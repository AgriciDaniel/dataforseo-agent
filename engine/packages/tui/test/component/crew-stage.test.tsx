/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import type {
  SessionMessageAssistant,
  SessionMessageAssistantTool,
  SessionMessageInfo,
} from "@dataforseo-agent/client"
import { crewMood } from "../../src/component/crew"
import { BOTS, type Cell } from "../../src/ui/bots"
import {
  AFTER_TURN,
  RAIL_ROWS,
  SCENES,
  STAGE_ROWS,
  STILL,
  crewFrame,
  pickStage,
  toolScene,
  type Scene,
  type Spot,
  type Stage,
} from "../../src/ui/crew-scenes"

const NOW = 1_000_000
const user = { id: "user-1", type: "user", text: "What is my balance?", time: { created: NOW - 9000 } } as const

function tool(
  name: string,
  state: SessionMessageAssistantTool["state"],
  completed?: number,
): SessionMessageAssistantTool {
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

const running = (name: string, input: Record<string, string> = {}) =>
  tool(name, { status: "running", input, metadata: {} })
const completed = (name: string, at: number) =>
  tool(name, { status: "completed", input: {}, content: [{ type: "text", text: "ok" }] }, at)
const failed = (name: string, message: string, at: number) =>
  tool(name, { status: "error", input: {}, error: { type: "ToolFailure", message } }, at)

const scene = (messages: SessionMessageInfo[], extra: { status?: string; permissions?: number; now?: number } = {}) =>
  crewMood({ status: extra.status ?? "running", permissions: extra.permissions ?? 0, messages, now: extra.now ?? NOW })
    ?.scene

const text = (rows: Cell[][]) => rows.map((row) => row.map((cell) => cell.char).join(""))
const colors = (rows: Cell[][]) => new Set(rows.flat().flatMap((cell) => [cell.fg, cell.bg]))
const crew = (spot: Spot, extra: Partial<Stage> = {}): Stage => ({
  spot,
  cast: spot === "peek" ? [2] : [0, 1, 2],
  side: 1,
  variant: 0,
  ...extra,
})
const frame = (name: Scene, t: number, stage = crew("left"), width = 48) =>
  crewFrame({ scene: name, t, stage, width }).rows

test("every scene draws in every spot at the requested width", () => {
  for (const spot of ["left", "centre", "right", "peek", "rail"] as Spot[]) {
    for (const name of SCENES) {
      const rows = frame(name, STILL[name], crew(spot))
      expect(rows).toHaveLength(spot === "rail" ? RAIL_ROWS : STAGE_ROWS)
      rows.forEach((row) => expect(row).toHaveLength(48))
      if (name !== "done") crew(spot).cast.forEach((bot) => expect(colors(rows).has(BOTS[bot].pal.c)).toBe(true))
    }
  }
})

test("the stage is 7 rows and the rail one", () => {
  expect(STAGE_ROWS).toBe(7)
  expect(RAIL_ROWS).toBe(1)
})

test("the spot moves the crew across the stage", () => {
  const first = (rows: Cell[][]) => Math.min(...text(rows).map((row) => row.search(/\S/)).filter((at) => at >= 0))
  const left = first(frame("thinking", 0, crew("left")))
  const centre = first(frame("thinking", 0, crew("centre")))
  const right = first(frame("thinking", 0, crew("right")))
  expect(left).toBeLessThan(centre)
  expect(centre).toBeLessThan(right)
  // Peeking: one bot cut off at the right edge.
  const peek = text(frame("thinking", 0, crew("peek")))
  expect(peek.some((row) => row.trimEnd().length === 48)).toBe(true)
})

test("each scene has its own look", () => {
  expect(text(frame("permission", 0))[0]).toContain("$")
  expect(text(frame("thinking", 0)).join("")).not.toContain("$")
  expect(colors(frame("search", 0.5)).has("#8fd3ff")).toBe(true)
  expect(text(frame("search", 1))).not.toEqual(text(frame("search", 0)))
  expect(text(frame("keywords", 1.5)).join("")).toContain("k")
  expect(colors(frame("links", 0.35)).has("#8fd3ff")).toBe(true)
  expect(colors(frame("crawl", 0.5)).has("#ffe08a") || colors(frame("crawl", 0.5)).has("#ffb347")).toBe(true)
  expect(colors(frame("data", 0.4)).has("#b07a45")).toBe(true)
  expect(text(frame("budget", 1))[0]).toContain("budget")
  expect(text(frame("budget", 1))).toEqual(text(frame("budget", 5)))
  // The bow leans the bots over, so it differs from standing.
  expect(text(frame("budget", 1)).slice(1)).not.toEqual(text(frame("thinking", 0)).slice(1))
  // The error puff is a grey cloud above the lead.
  expect(colors(frame("error", 0.5)).has("#8a8fa3")).toBe(true)
  // The keyword blocks spell the word left to right on the floor.
  expect(text(frame("keywords", 1.5))[STAGE_ROWS - 2].replace(/[^a-z]/g, "")).toBe("key")
  expect(text(frame("error", 0.1))).not.toEqual(text(frame("error", 0.2)))
  // The goodbye ends with the stage empty.
  expect(text(frame("done", AFTER_TURN.done)).join("").trim()).toBe("")
})

test("the crew walks in, then glides between scenes", () => {
  const stage = crew("left", { side: -1 })
  const entering = crewFrame({ scene: "thinking", t: 0, stage, width: 48, age: 0 })
  expect(text(entering.rows).join("").trim()).toBe("")
  const settled = crewFrame({ scene: "thinking", t: 0, stage, width: 48, age: 5 })
  const from = settled.poses.map((pose) => ({ ...pose, x: pose.x + 10 }))
  const gliding = crewFrame({ scene: "thinking", t: 0, stage, width: 48, age: 5, from, since: 0.1 })
  expect(gliding.poses[0].x).toBeGreaterThan(settled.poses[0].x)
  const landed = crewFrame({ scene: "thinking", t: 0, stage, width: 48, age: 5, from, since: 1 })
  expect(landed.poses[0].x).toBe(settled.poses[0].x)
})

test("each turn picks its own stage, the same on every frame", () => {
  expect(pickStage("session:turn-1")).toEqual(pickStage("session:turn-1"))
  const picks = Array.from({ length: 40 }, (_, i) => pickStage(`session:turn-${i}`))
  expect(new Set(picks.map((pick) => pick.spot)).size).toBeGreaterThanOrEqual(4)
  expect(new Set(picks.map((pick) => pick.cast.length)).size).toBe(3)
  picks.forEach((pick) => expect(new Set(pick.cast).size).toBe(pick.cast.length))
  // A short terminal keeps the crew on the rail.
  expect(pickStage("session:turn-1", { stage: false }).spot).toBe("rail")
})

test("the tool scene follows the API the call goes to", () => {
  expect(toolScene("x", "/v3/serp/google/organic/live/advanced")).toBe("search")
  expect(toolScene("x", "/v3/serp/google/maps/live/advanced")).toBe("maps")
  expect(toolScene("x", "/v3/business_data/google/my_business_info/live")).toBe("maps")
  expect(toolScene("x", "/v3/keywords_data/google_ads/search_volume/live")).toBe("keywords")
  expect(toolScene("x", "/v3/dataforseo_labs/google/keyword_ideas/live")).toBe("keywords")
  expect(toolScene("x", "/v3/backlinks/summary/live")).toBe("links")
  expect(toolScene("x", "/v3/on_page/instant_pages")).toBe("crawl")
  expect(toolScene("x", "/v3/merchant/amazon/products/task_post")).toBe("data")
  expect(toolScene("chart", undefined)).toBe("chart")
})

test("the scene follows the session state", () => {
  expect(scene([user], { status: "idle" })).toBeUndefined()
  expect(scene([user])).toBe("thinking")
  expect(scene([user, assistant([running("dataforseo_api_request", { path: "/v3/backlinks/summary/live" })])])).toBe(
    "links",
  )
  expect(
    scene([
      user,
      assistant([running("dataforseo_api_request", { url: "https://api.dataforseo.com/v3/serp/google/organic/live/advanced" })]),
    ]),
  ).toBe("search")
  expect(scene([user, assistant([running("dataforseo_api_request")])], { permissions: 1 })).toBe("permission")
  expect(scene([user, assistant([completed("chart", NOW - 500)])])).toBe("chart")
  expect(scene([user, assistant([completed("chart", NOW - 2000)])])).toBe("thinking")
  const budget = failed("dataforseo_api_request", "Session budget reached: $1.0000 spent of $1.00. Not sent.", NOW - 4000)
  expect(scene([user, assistant([budget])])).toBe("budget")
  expect(scene([user, assistant([failed("websearch", "Request timed out", NOW - 300)])])).toBe("error")
  expect(scene([user, assistant([failed("websearch", "Request timed out", NOW - 3000)])])).toBe("thinking")
  expect(scene([user, assistant([failed("dataforseo_api_request", "The user rejected permission", NOW - 300)])])).toBe(
    "thinking",
  )
  expect(scene([user, assistant([], { error: { type: "Api", message: "boom" }, time: { created: NOW - 200 } })])).toBe(
    "error",
  )
  expect(scene([assistant([completed("chart", NOW - 100)]), user])).toBe("thinking")
})

test("after the turn the crew waves goodbye, or holds its bow at a budget stop", () => {
  const ended = (content: SessionMessageAssistantTool[]) => [
    user,
    assistant(content, { time: { created: NOW - 5000, completed: NOW - 500 } }),
  ]
  expect(scene(ended([]), { status: "idle" })).toBe("done")
  expect(scene(ended([]), { status: "idle", now: NOW + AFTER_TURN.done * 1000 })).toBeUndefined()
  const budget = failed("dataforseo_api_request", "Session budget would be exceeded. Not sent.", NOW - 800)
  expect(scene(ended([budget]), { status: "idle", now: NOW + 2000 })).toBe("budget")
  expect(scene(ended([budget]), { status: "idle", now: NOW + AFTER_TURN.budget * 1000 })).toBeUndefined()
  // A finish time a tick ahead of the client clock still counts as just ended.
  expect(scene(ended([]), { status: "idle", now: NOW - 600 })).toBe("done")
})
