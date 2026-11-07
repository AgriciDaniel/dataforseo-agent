/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"
import type {
  SessionMessageAssistant,
  SessionMessageAssistantTool,
  SessionMessageInfo,
} from "@dataforseo-agent/client"
import { CrewStrip, crewMood } from "../../src/component/crew"
import { BOTS, STILL_TIME, STRIP_ROWS, crewStrip, type Cell, type CrewMood, type StripSize } from "../../src/ui/bots"

const NOW = 1_000_000
const user = { id: "user-1", type: "user", text: "What is my balance?", time: { created: NOW - 9000 } } as const

function tool(name: string, state: SessionMessageAssistantTool["state"], completed?: number): SessionMessageAssistantTool {
  return { type: "tool", id: `tool-${name}-${state.status}`, name, state, time: { created: NOW - 5000, completed } }
}

function assistant(content: SessionMessageAssistantTool[], extra: Partial<SessionMessageAssistant> = {}) {
  return {
    id: "assistant-1",
    type: "assistant",
    agent: "build",
    model: { providerID: "test", id: "test" },
    content,
    time: { created: NOW - 5000 },
    ...extra,
  } as SessionMessageAssistant
}

const running = (name: string) => tool(name, { status: "running", input: {}, metadata: {} })
const completed = (name: string, at: number) =>
  tool(name, { status: "completed", input: {}, content: [{ type: "text", text: "ok" }] }, at)
const failed = (name: string, message: string, at: number) =>
  tool(name, { status: "error", input: {}, error: { type: "ToolFailure", message } }, at)

const mood = (messages: SessionMessageInfo[], extra: { status?: string; permissions?: number; now?: number } = {}) =>
  crewMood({ status: extra.status ?? "running", permissions: extra.permissions ?? 0, messages, now: extra.now ?? NOW })?.mood

const text = (rows: Cell[][]) => rows.map((row) => row.map((cell) => cell.char).join(""))
const colors = (rows: Cell[][]) => new Set(rows.flat().flatMap((cell) => [cell.fg, cell.bg]))

const SIZES: StripSize[] = ["full", "mini"]

test.each(SIZES)("every mood draws a %s strip at the requested width", (size) => {
  const moods = Object.keys(STILL_TIME) as CrewMood[]
  moods.forEach((name) => {
    const rows = crewStrip(name, STILL_TIME[name], 40, size)
    expect(rows).toHaveLength(STRIP_ROWS[size])
    rows.forEach((row) => expect(row).toHaveLength(40))
    BOTS.forEach((bot) => expect(colors(rows).has(bot.pal.c)).toBe(true))
  })
})

test("the full strip draws the real sprites, the mini strip smaller bots", () => {
  expect(STRIP_ROWS).toEqual({ full: 8, mini: 4 })
  // Green, the tallest real sprite, is 13 pixels: its top half block sits in text row 1 of 8 (pixels 3 to 15).
  const full = crewStrip("thinking", 0, 40, "full")
  expect(full.flat().filter((cell) => cell.fg === BOTS[2].pal.c || cell.bg === BOTS[2].pal.c).length).toBeGreaterThan(30)
  expect(text(full)[1].trim()).not.toBe("")
  expect(text(full)[0].trim()).toBe("")
  expect(text(crewStrip("thinking", 0, 40, "mini"))).not.toEqual(text(full).slice(4))
})

test.each(SIZES)("each mood has its own look at %s size", (size) => {
  const frame = (mood: CrewMood, t: number) => crewStrip(mood, t, 40, size)
  const last = STRIP_ROWS[size] - 1
  // Waiting on a paid call: a "$" sign held up over yellow.
  expect(text(frame("permission", 0))[0]).toContain("$")
  expect(text(frame("thinking", 0)).join("")).not.toContain("$")
  // Running a tool: the magnifier lens appears and the crew moves across.
  expect(colors(frame("tool", 0)).has("#8fd3ff")).toBe(true)
  expect(text(frame("tool", 1))).not.toEqual(text(frame("tool", 0)))
  // The chart hop lifts the crew off the ground, then lands them again.
  expect(text(frame("chart", 1.15))[last].trim()).toBe("")
  expect(text(frame("chart", 1.6))).toEqual(text(frame("thinking", 0)))
  // The bow is held, and differs from standing.
  expect(text(frame("budget", 1))).toEqual(text(frame("budget", 5)))
  expect(text(frame("budget", 1))).not.toEqual(text(frame("thinking", 0)))
  // Red shakes its head only briefly.
  expect(text(frame("error", 0.1))).not.toEqual(text(frame("error", 0.2)))
  expect(text(frame("error", 2))).toEqual(text(frame("error", 3)))
})

test("the mood follows the session state", () => {
  expect(mood([user], { status: "idle" })).toBeUndefined()
  expect(mood([user])).toBe("thinking")
  expect(mood([user, assistant([running("dataforseo_execute")])])).toBe("tool")
  expect(mood([user, assistant([running("dataforseo_execute")])], { permissions: 1 })).toBe("permission")
  // The walk starts when the tool started, so the crew sets off from its lineup.
  expect(
    crewMood({ status: "running", permissions: 0, messages: [user, assistant([running("search")])], now: NOW }),
  ).toEqual({ mood: "tool", since: NOW - 5000 })
  expect(mood([user, assistant([completed("chart", NOW - 500)])])).toBe("chart")
  expect(mood([user, assistant([completed("chart", NOW - 2000)])])).toBe("thinking")
  const budget = failed("dataforseo_execute", "Session budget reached: $1.0000 spent of $1.00. Not sent.", NOW - 4000)
  expect(mood([user, assistant([budget])])).toBe("budget")
  expect(mood([user, assistant([failed("websearch", "Request timed out", NOW - 300)])])).toBe("error")
  expect(mood([user, assistant([failed("websearch", "Request timed out", NOW - 3000)])])).toBe("thinking")
  // A rejected permission is the user's choice, not an error.
  expect(mood([user, assistant([failed("dataforseo_execute", "The user rejected permission", NOW - 300)])])).toBe(
    "thinking",
  )
  expect(mood([user, assistant([failed("dataforseo_execute", "Permission.DeclinedError", NOW - 300)])])).toBe("thinking")
  expect(mood([user, assistant([], { error: { type: "Api", message: "boom" }, time: { created: NOW - 200 } })])).toBe(
    "error",
  )
  // Only the current request counts: a chart from an earlier turn does not make the crew hop.
  expect(mood([assistant([completed("chart", NOW - 100)]), user])).toBe("thinking")
})

async function mount(status: string, height: number) {
  const [state, setState] = createSignal(status)
  const app = await testRender(
    () => <CrewStrip status={state()} permissions={0} messages={[user]} animate={false} width={40} />,
    { width: 40, height },
  )
  await app.renderOnce()
  const rows = () => app.captureCharFrame().split("\n").filter((line) => line.trim() !== "").length
  return Object.assign(app, { rows, setState })
}

test("the strip is hidden when the session is idle or the terminal is short", async () => {
  const cases = [
    ["running", 46],
    ["idle", 46],
    ["running", 20],
  ] as const
  const counts = await Promise.all(
    cases.map(async ([status, height]) => {
      const app = await mount(status, height)
      const count = app.rows()
      app.renderer.destroy()
      return count
    }),
  )
  expect(counts[0]).toBeGreaterThan(0)
  expect(counts.slice(1)).toEqual([0, 0])
})

test("the size is chosen when the turn starts and kept until it ends", async () => {
  const app = await mount("running", 46)
  // Full size: the green bot fills 7 of the 8 rows.
  expect(app.rows()).toBe(7)
  // Shrinking mid-turn keeps the full bots, so the transcript does not jump.
  app.resize(40, 34)
  await app.renderOnce()
  expect(app.rows()).toBe(7)
  // The next turn at this height uses the mini bots.
  app.setState("idle")
  await app.renderOnce()
  expect(app.rows()).toBe(0)
  app.setState("running")
  await app.renderOnce()
  expect(app.rows()).toBe(3)
  app.renderer.destroy()
})
