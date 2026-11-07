// DataForSEO Agent: the bot crew walking across the home screen, and the small crew strip that acts out what a
// busy session is doing (see ui/bots.ts for the drawings).
import { RGBA } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import type { SessionMessageAssistantTool, SessionMessageInfo } from "@dataforseo-agent/client"
import { Index, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { useConfig } from "../config"
import { STILL_TIME, STRIP_ROWS, crewScene, crewStrip, type Cell, type CrewMood, type StripSize } from "../ui/bots"

const colors = new Map<string, RGBA>()
const rgba = (hex: string | undefined) => {
  if (!hex) return undefined
  const known = colors.get(hex)
  if (known) return known
  const value = RGBA.fromHex(hex)
  colors.set(hex, value)
  return value
}

export function Crew(props: { width: number }) {
  const config = useConfig().data
  const animate = () => config.animations ?? true
  const start = Date.now()
  // With animations off, show the still lineup mid-story.
  const [time, setTime] = createSignal(animate() ? 0 : 5.5)
  if (animate()) {
    const timer = setInterval(() => setTime((Date.now() - start) / 1000), 80)
    onCleanup(() => clearInterval(timer))
  }
  const rows = createMemo(() => crewScene(time(), Math.max(30, props.width)))
  return <CellRows rows={rows()} />
}

function CellRows(props: { rows: Cell[][] }) {
  return (
    <box flexDirection="column" flexShrink={0}>
      {/* Index keeps one text node per cell and only updates its colors, so a frame costs little. */}
      <Index each={props.rows}>
        {(row) => (
          <box flexDirection="row" height={1}>
            <Index each={row()}>
              {(cell) => (
                <text fg={rgba(cell().fg)} bg={rgba(cell().bg)} selectable={false} flexShrink={0}>
                  {cell().char}
                </text>
              )}
            </Index>
          </box>
        )}
      </Index>
    </box>
  )
}

/** Below this terminal height the strip would crowd the transcript, so it stays hidden. */
export const CREW_STRIP_MIN_HEIGHT = 30
/** From this terminal height up, the strip draws the full size bots. */
export const CREW_STRIP_FULL_HEIGHT = 40
const HOP_MS = 1500
const SHAKE_MS = 1200
// Both refusals from the engine gate: "Session budget reached" and "Session budget would be exceeded".
const BUDGET_TEXT = "Session budget "

/**
 * The mood the strip acts out, or undefined when the session is idle. `since` is when the mood started (the hop,
 * bow, shake or walk), so its frames play from the beginning; the endless idle loops use 0.
 */
export function crewMood(input: {
  status: string
  permissions: number
  messages: readonly SessionMessageInfo[]
  now: number
}): { mood: CrewMood; since: number } | undefined {
  if (input.status !== "running") return undefined
  if (input.permissions > 0) return { mood: "permission", since: 0 }
  const turn = currentTurn(input.messages)
  const tools = turn.flatMap((message) =>
    message.type === "assistant"
      ? message.content.filter((part): part is SessionMessageAssistantTool => part.type === "tool")
      : [],
  )
  // The walk starts from the lineup when the first running tool began, so the crew never jumps across the strip.
  const busy = tools.filter((tool) => tool.state.status === "running" || tool.state.status === "streaming")
  if (busy.length > 0) return { mood: "tool", since: Math.min(...busy.map((tool) => tool.time.ran ?? tool.time.created)) }
  const recent = (time: number | undefined, window: number) =>
    time !== undefined && input.now - time >= 0 && input.now - time < window
  const errors = [
    ...tools.flatMap((tool) =>
      tool.state.status === "error" && !denied(tool.state.error.message) && !tool.state.error.message.includes(BUDGET_TEXT)
        ? [tool.time.completed]
        : [],
    ),
    ...turn.flatMap((message) =>
      message.type === "assistant" && message.error ? [message.time.completed ?? message.time.created] : [],
    ),
  ].filter((time) => recent(time, SHAKE_MS))
  if (errors.length > 0) return { mood: "error", since: Math.max(...errors.map((time) => time ?? 0)) }
  const chart = tools.findLast((tool) => tool.name === "chart" && tool.state.status === "completed")
  if (chart && recent(chart.time.completed, HOP_MS)) return { mood: "chart", since: chart.time.completed ?? 0 }
  const budget = tools.find(
    (tool) => tool.state.status === "error" && tool.state.error.message.includes(BUDGET_TEXT),
  )
  if (budget) return { mood: "budget", since: budget.time.completed ?? 0 }
  return { mood: "thinking", since: 0 }
}

// The messages after the latest user message: what the agent has done for the current request.
function currentTurn(messages: readonly SessionMessageInfo[]) {
  const index = messages.findLastIndex((message) => message.type === "user")
  return index === -1 ? messages : messages.slice(index + 1)
}

// A rejected or dismissed permission is the user's choice, not a failure (the transcript's tool row test, plus the
// "Permission.DeclinedError" a rejected paid call reports).
function denied(message: string) {
  return (
    message.includes("DeclinedError") ||
    message.includes("QuestionRejectedError") ||
    message.includes("rejected permission") ||
    message.includes("specified a rule") ||
    message.includes("user dismissed")
  )
}

/**
 * The crew strip above the prompt. It shows only while the session is busy and the terminal is tall enough, and
 * runs one timer only while it is shown: 80 ms frames when animating, otherwise a slow tick so one shot moods
 * still end on time while the bots hold a still pose. The size (full bots or mini) is picked from the terminal
 * height when the turn starts and kept until it ends, so the transcript never jumps mid-turn.
 */
export function CrewStrip(props: {
  status: string
  permissions: number
  messages: readonly SessionMessageInfo[]
  animate: boolean
  width: number
}) {
  const dimensions = useTerminalDimensions()
  const [now, setNow] = createSignal(Date.now())
  const active = createMemo(() => props.status === "running" && dimensions().height >= CREW_STRIP_MIN_HEIGHT)
  // Once chosen, the size no longer reads the terminal height, so a resize mid-turn keeps it.
  const size = createMemo<StripSize | undefined>((previous) => {
    if (props.status !== "running") return undefined
    return previous ?? (dimensions().height >= CREW_STRIP_FULL_HEIGHT ? "full" : "mini")
  })
  createEffect(() => {
    if (!active()) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), props.animate ? 80 : 500)
    onCleanup(() => clearInterval(timer))
  })
  const mood = createMemo(() =>
    active()
      ? crewMood({ status: props.status, permissions: props.permissions, messages: props.messages, now: now() })
      : undefined,
  )
  const rows = createMemo(() => {
    const current = mood()
    if (!current) return []
    const t = props.animate ? Math.max(0, now() - current.since) / 1000 : STILL_TIME[current.mood]
    return crewStrip(current.mood, t, Math.max(30, props.width), size() ?? "mini")
  })
  return (
    <Show when={mood()}>
      <box height={STRIP_ROWS[size() ?? "mini"]} flexShrink={0}>
        <CellRows rows={rows()} />
      </box>
    </Show>
  )
}
