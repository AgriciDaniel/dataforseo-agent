// DataForSEO Agent: the bot crew walking across the home screen, and the small session crew that acts out what a
// busy session is doing (see ui/bots.ts and ui/crew-scenes.ts for the drawings).
import { RGBA, type BoxRenderable } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import type { SessionMessageAssistantTool, SessionMessageInfo } from "@dataforseo-agent/client"
import { createEffect, createMemo, createSignal, onCleanup, untrack } from "solid-js"
import { useConfig } from "../config"
import { requestPath, requestTarget } from "@dataforseo-agent/util/dataforseo"
import type { Cell } from "../ui/bots"
import { CHAT_ROWS, HomeCrew } from "../ui/home-crew"
import { HomeStage } from "../ui/home-stage"
import {
  AFTER_TURN,
  STILL,
  crewFrame,
  pickStage,
  toolScene,
  type Pose,
  type Scene,
  type Stage,
} from "../ui/crew-scenes"

const colors = new Map<string, RGBA>()
const rgba = (hex: string | undefined) => {
  if (!hex) return undefined
  const known = colors.get(hex)
  if (known) return known
  const value = RGBA.fromHex(hex)
  colors.set(hex, value)
  return value
}

const CLEAR = RGBA.fromValues(0, 0, 0, 0)

export function CellRows(props: { rows: Cell[][]; onPress?: (col: number) => void; onHover?: (col: number) => void }) {
  let node: BoxRenderable | undefined
  // One box that paints the cells straight into the frame: no element per cell, no layout per frame.
  createEffect(() => {
    props.rows
    node?.requestRender()
  })
  return (
    <box
      ref={(value: BoxRenderable) => (node = value)}
      width={props.rows[0]?.length ?? 0}
      height={props.rows.length}
      flexShrink={0}
      renderAfter={function (buffer) {
        // Paint only inside the space the layout gave the box: when it is squeezed, the top rows (sky and HUD)
        // go first and the floor stays, so nothing spills over the prompt.
        const skip = Math.max(0, props.rows.length - this.height)
        props.rows.slice(skip).forEach((row, y) =>
          row.slice(0, this.width).forEach((cell, x) => {
            if (cell.char === " " && !cell.bg) return
            buffer.setCellWithAlphaBlending(
              this.screenX + x,
              this.screenY + y,
              cell.char,
              rgba(cell.fg) ?? CLEAR,
              rgba(cell.bg) ?? CLEAR,
            )
          }),
        )
      }}
      onMouseDown={function (event) {
        props.onPress?.(event.x - this.screenX)
      }}
      onMouseMove={function (event) {
        props.onHover?.(event.x - this.screenX)
      }}
    />
  )
}

/**
 * The home screen crew along the bottom: the bots wander, look at the pointer, and hop and say a tip when
 * clicked. One 50 ms timer while animating; with animations off they stand still but still answer a click.
 */
export function HomeCrewStrip(props: { width: number; stage?: boolean }) {
  const config = useConfig().data
  const animate = () => config.animations ?? true
  // With room, the big stage (the Homies working DataForSEO stations); otherwise the short strip.
  const crew = props.stage ? new HomeStage(Math.max(20, props.width)) : new HomeCrew(Math.max(20, props.width))
  const [rows, setRows] = createSignal(crew.frame())
  let last = Date.now()
  const timer = setInterval(
    () => {
      const now = Date.now()
      if (animate()) crew.step(Math.min(0.2, (now - last) / 1000))
      else crew.time += (now - last) / 1000
      last = now
      setRows(crew.frame())
    },
    animate() ? 33 : 250,
  )
  onCleanup(() => clearInterval(timer))
  createEffect(() => {
    crew.resize(Math.max(20, props.width))
    setRows(crew.frame())
  })
  return (
    <CellRows
      rows={rows()}
      onPress={(col) => {
        crew.poke(col)
        setRows(crew.frame())
      }}
      onHover={(col) => crew.point(col)}
    />
  )
}

/**
 * The chat crew: the same tiny bots in a strip just above the prompt, acting out what the agent does (see
 * HomeCrew.setMood). Clicks and pointing work as on the home screen.
 */
export function SessionCrewStrip(props: { width: number; scene: () => string | undefined }) {
  const config = useConfig().data
  const animate = () => config.animations ?? true
  const crew = new HomeCrew(Math.max(20, props.width), Date.now(), CHAT_ROWS)
  crew.setMood(props.scene())
  const [rows, setRows] = createSignal(crew.frame())
  let last = Date.now()
  const timer = setInterval(
    () => {
      const now = Date.now()
      crew.setMood(props.scene())
      if (animate()) crew.step(Math.min(0.2, (now - last) / 1000))
      else crew.time += (now - last) / 1000
      last = now
      setRows(crew.frame())
    },
    animate() ? 33 : 250,
  )
  onCleanup(() => clearInterval(timer))
  createEffect(() => crew.resize(Math.max(20, props.width)))
  return (
    <CellRows
      rows={rows()}
      onPress={(col) => {
        crew.poke(col)
        setRows(crew.frame())
      }}
      onHover={(col) => crew.point(col)}
    />
  )
}

/** Below this terminal size the crew only walks the one row rail, so it never crowds the transcript. */
export const CREW_STAGE_MIN = { height: 24, width: 40 }
const HOP_MS = 1500
const SHAKE_MS = 1200
// Both refusals from the engine gate: "Session budget reached" and "Session budget would be exceeded".
const BUDGET_TEXT = "Session budget "

/**
 * The scene the crew acts out, or undefined when there is nothing to show. `since` is when the scene started, so
 * one shot scenes (hop, bow, shake, wave) play from the beginning; the endless loops use 0. After a turn ends the
 * crew stays a moment to wave goodbye, or to hold its bow when the session budget stopped the turn.
 */
export function crewMood(input: {
  status: string
  permissions: number
  messages: readonly SessionMessageInfo[]
  now: number
}): { scene: Scene; since: number } | undefined {
  const turn = currentTurn(input.messages)
  const tools = turn.flatMap((message) =>
    message.type === "assistant"
      ? message.content.filter((part): part is SessionMessageAssistantTool => part.type === "tool")
      : [],
  )
  const budget = tools.find((tool) => tool.state.status === "error" && tool.state.error.message.includes(BUDGET_TEXT))
  if (input.status !== "running") {
    const ended = turnEnd(turn)
    if (ended === undefined) return undefined
    // The client clock can trail the finish time by a tick: count that as just ended.
    const after = Math.max(0, (input.now - ended) / 1000)
    if (budget && after < AFTER_TURN.budget) return { scene: "budget", since: budget.time.completed ?? ended }
    if (!budget && after < AFTER_TURN.done) return { scene: "done", since: ended }
    return undefined
  }
  if (input.permissions > 0) return { scene: "permission", since: 0 }
  // Tool scenes start when the running tool began, so the crew sets off from where it stands.
  const busy = tools.filter((tool) => tool.state.status === "running" || tool.state.status === "streaming")
  if (busy.length > 0) {
    const tool = busy[busy.length - 1]
    const called = "input" in tool.state ? tool.state.input : undefined
    const path = called && typeof called === "object" ? requestPath(requestTarget(called as Record<string, unknown>)) : undefined
    return { scene: toolScene(tool.name, path), since: Math.min(...busy.map((tool) => tool.time.ran ?? tool.time.created)) }
  }
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
  if (errors.length > 0) return { scene: "error", since: Math.max(...errors.map((time) => time ?? 0)) }
  const chart = tools.findLast((tool) => tool.name === "chart" && tool.state.status === "completed")
  if (chart && recent(chart.time.completed, HOP_MS)) return { scene: "chart", since: chart.time.completed ?? 0 }
  if (budget) return { scene: "budget", since: budget.time.completed ?? 0 }
  return { scene: "thinking", since: 0 }
}

// The messages after the latest user message: what the agent has done for the current request.
function currentTurn(messages: readonly SessionMessageInfo[]) {
  const index = messages.findLastIndex((message) => message.type === "user")
  return index === -1 ? messages : messages.slice(index + 1)
}

// When the turn's last assistant message finished.
function turnEnd(turn: readonly SessionMessageInfo[]) {
  const last = turn.findLast((message) => message.type === "assistant")
  return last?.type === "assistant" ? last.time.completed : undefined
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
 * The session crew. Each turn picks a stage from the turn's id: a spot at the end of the transcript (left, centre,
 * right, or one bot peeking in) or the rail row under it, plus the cast, entry side and variant. The stage stays
 * the same for the whole turn. One timer runs only while the crew is shown: 50 ms frames when animating,
 * otherwise a slow tick so the goodbye still ends on time while the bots hold a still pose.
 */
export function useCrew(props: {
  sessionID: () => string
  status: () => string
  permissions: () => number
  messages: () => readonly SessionMessageInfo[]
  animate: () => boolean
  width: () => number
}) {
  const dimensions = useTerminalDimensions()
  const [now, setNow] = createSignal(Date.now())
  const mood = createMemo(() =>
    crewMood({ status: props.status(), permissions: props.permissions(), messages: props.messages(), now: now() }),
  )
  const on = createMemo(() => mood() !== undefined)
  const seed = createMemo(() => {
    const turn = props.messages().findLast((message) => message.type === "user")
    return `${props.sessionID()}:${turn?.id ?? ""}`
  })
  // Picked once per turn: the terminal size at the start decides whether the stage has room.
  const stage = createMemo<Stage>(() => {
    const id = seed()
    const size = untrack(dimensions)
    return pickStage(id, { stage: size.height >= CREW_STAGE_MIN.height && size.width >= CREW_STAGE_MIN.width })
  })
  // The strip above the prompt needs a terminal of at least 24 rows; smaller ones get the one row rail.
  const roomy = createMemo(() => {
    seed()
    const size = untrack(dimensions)
    return size.height >= CREW_STAGE_MIN.height && size.width >= CREW_STAGE_MIN.width
  })
  const [appeared, setAppeared] = createSignal(Date.now())
  createEffect(() => {
    seed()
    if (on()) setAppeared(Date.now())
  })
  createEffect(() => {
    // Keep ticking while running too, so the goodbye after the turn starts on time.
    if (!on() && props.status() !== "running") return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), props.animate() ? 50 : 500)
    onCleanup(() => clearInterval(timer))
  })
  // The poses of the last frame, and when the scene last changed, so the bots glide into each new scene.
  let last: Pose[] | undefined
  let from: Pose[] | undefined
  let switched = 0
  let key = ""
  const rows = createMemo<Cell[][]>(() => {
    const current = mood()
    // The strip above the prompt draws itself; these rows are only for the rail.
    if (!current || roomy()) {
      last = undefined
      return []
    }
    const time = now()
    const animate = props.animate()
    const next = `${current.scene}:${current.since}`
    if (next !== key) {
      key = next
      from = last
      switched = time
    }
    const frame = crewFrame({
      scene: current.scene,
      t: animate ? Math.max(0, time - (current.since || appeared())) / 1000 : STILL[current.scene],
      stage: stage(),
      width: Math.max(30, props.width()),
      age: animate ? (time - appeared()) / 1000 : Infinity,
      from: animate ? from : undefined,
      since: (time - switched) / 1000,
    })
    last = frame.poses
    return frame.rows
  })
  return {
    rows,
    /** Shown on the stage at the end of the transcript. */
    stage: () => on() && roomy(),
    /** The scene the crew acts out now, if any. */
    scene: () => mood()?.scene,
    /** Shown on the rail row under the transcript. */
    rail: () => on() && !roomy(),
  }
}
