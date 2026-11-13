import { expect, test } from "bun:test"
import { createTestRenderer } from "@opentui/core/testing"
import { Effect, FileSystem } from "effect"
import { Global } from "@dataforseo-agent/util/global"
import { mkdir } from "node:fs/promises"
import { createEventStream, createFetch, directory, json } from "./fixture/tui-client"
import { tmpdir } from "./fixture/fixture"
import { waitForHighlightedFrame } from "./fixture/frame"
import { filterChats, sidebarLayout } from "../src/component/chat-sidebar"

test("the chat search keeps matching titles, ignoring case", () => {
  const chats = [{ title: "US SEO keyword research" }, { title: "Potato keyword research" }, { title: "Greeting" }]
  expect(filterChats(chats, "")).toHaveLength(3)
  expect(filterChats(chats, "  KEYWORD ").map((c) => c.title)).toEqual([
    "US SEO keyword research",
    "Potato keyword research",
  ])
  expect(filterChats(chats, "audit")).toEqual([])
})

async function open(
  width: number,
  height: number,
  inspect: (setup: Awaited<ReturnType<typeof createTestRenderer>>) => Promise<void>,
  attention = false,
) {
  await using state = await tmpdir()
  const setup = await createTestRenderer({ width, height, kittyKeyboard: true })
  await setup.renderer.setupTerminal()
  setup.renderer.start()
  const base = {
    projectID: "proj_test",
    location: { directory },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    time: { created: 0, updated: 0 },
  }
  const sessions = [
    { ...base, id: "ses_kw", title: "US SEO keyword research" },
    { ...base, id: "ses_potato", title: "Potato keyword research" },
    {
      ...base,
      id: "ses_hi",
      title: "Greeting",
      time: { ...base.time, ...(attention ? { idle: Date.now() - 120_000 } : {}) },
    },
  ]
  await mkdir(`${state.path}/test/tui`, { recursive: true })
  await Bun.write(
    `${state.path}/test/tui/tabs.json`,
    JSON.stringify({
      global: { tabs: sessions.map((s) => ({ sessionID: s.id, title: s.title })), unread: {} },
      cwd: {},
    }),
  )
  const calls = createFetch((url) => {
    if (url.pathname === "/api/session") return json({ data: sessions, cursor: {} })
    for (const s of sessions) {
      if (url.pathname === `/api/session/${s.id}`) return json({ data: s })
      if (url.pathname === `/api/session/${s.id}/message`)
        return json({
          data: [{ type: "user", id: `msg_${s.id}`, text: `Question in ${s.title}`, time: { created: 0 } }],
          cursor: {},
        })
      if (url.pathname === `/api/session/${s.id}/permission`)
        return json({
          data:
            attention && s.id === "ses_kw"
              ? [{ id: "per_kw", sessionID: s.id, action: "shell", resources: ["echo ready"] }]
              : [],
        })
      if (url.pathname === `/api/session/${s.id}/form`)
        return json({
          data:
            attention && s.id === "ses_potato"
              ? [
                  {
                    id: "frm_potato",
                    sessionID: s.id,
                    title: "Choose market",
                    fields: [{ key: "market", type: "string", title: "Market" }],
                  },
                ]
              : [],
        })
      if (url.pathname === `/api/session/${s.id}/inbox`) return json({ data: [] })
    }
  }, createEventStream())
  const server = Bun.serve({ port: 0, idleTimeout: 0, fetch: (request) => calls.fetch(request) })
  const { run } = await import("../src/app")
  const task = Effect.runPromise(
    run({
      app: { name: "test", version: "test", channel: "test" },
      server: { endpoint: { url: server.url.toString() } },
      config: {
        get: async () => ({ animations: false, tabs: { enabled: true, scope: "global" } }),
        update: async () => ({}),
      },
      packages: { prepare: async () => ({ directory: "" }) },
      args: { sessionID: "ses_kw" },
      terminalHandoff: async () => ({ renderer: setup.renderer, mode: "dark", complete: () => {} }),
      log: () => {},
    }).pipe(Effect.provide(Global.layerWith({ state: state.path })), Effect.provide(FileSystem.layerNoop({}))),
  )
  try {
    await waitForHighlightedFrame(setup, (frame) => frame.includes("Question in US SEO keyword research"))
    await setup.waitForVisualIdle({ quietFrames: 3 })
    await inspect(setup)
  } finally {
    setup.renderer.destroy()
    await task
    await server.stop()
  }
}

const shots = process.env.CHAT_SIDEBAR_SNAPSHOTS

test("a wide terminal opens the chat sidebar on the left; « folds it and » brings it back", async () => {
  await open(160, 45, async (setup) => {
    const frame = setup.captureCharFrame()
    if (shots) await Bun.write(`${shots}/sidebar-160x45.txt`, frame)
    const lines = frame.split("\n")
    expect(frame).toContain("New chat")
    expect(frame).toContain("Search chats")
    expect(frame).toContain("DataForSEO")
    expect(frame).toContain("Account")
    const sidebar = setup.renderer.root.findDescendantById("chat-sidebar")!
    const first = setup.renderer.root.findDescendantById("chat-sidebar-chat-ses_kw")!
    const newChat = setup.renderer.root.findDescendantById("chat-sidebar-new")!
    const search = setup.renderer.root.findDescendantById("chat-sidebar-search")!
    expect(first.y - sidebar.y).toBe(8)
    expect(newChat.height).toBe(1)
    expect(first.height).toBe(1)
    expect(setup.renderer.root.findDescendantById("chat-sidebar-state-ses_kw")).toBeUndefined()
    expect(setup.renderer.root.findDescendantById("chat-sidebar-needs-user")).toBeUndefined()
    expect(search.y).toBe(newChat.y + 1)
    expect(frame.split("DataForSEO").length - 1).toBe(1)
    // The chats sit on the left, and the tab strip is gone: each title shows once, in the list.
    const potato = lines.find((line) => line.includes("Potato keyword research"))!
    expect(potato.indexOf("Potato keyword research")).toBeLessThan(42)
    expect(frame.split("Potato keyword research").length - 1).toBe(1)
    const fold = lines.findIndex((line) => line.includes("«"))
    await setup.mockMouse.click(lines[fold].indexOf("«"), fold)
    await waitForHighlightedFrame(setup, (next) => !next.includes("New chat"))
    const folded = setup.captureCharFrame()
    if (shots) await Bun.write(`${shots}/sidebar-160x45-folded.txt`, folded)
    expect(folded.split("\n")[0].startsWith("»")).toBe(true)
    await setup.mockMouse.click(0, 0)
    await waitForHighlightedFrame(setup, (next) => next.includes("New chat"))
  })
}, 20000)

test("a narrow terminal starts with the sidebar folded and the chat at full width", async () => {
  await open(100, 40, async (setup) => {
    const frame = setup.captureCharFrame()
    if (shots) await Bun.write(`${shots}/sidebar-100x40.txt`, frame)
    expect(frame).not.toContain("New chat")
    expect(frame.split("\n")[0].startsWith("»")).toBe(true)
    // Unfolded on a narrow screen, it opens over the chat.
    await setup.mockMouse.click(0, 0)
    await waitForHighlightedFrame(setup, (next) => next.includes("New chat"))
    if (shots) await Bun.write(`${shots}/sidebar-100x40-open.txt`, setup.captureCharFrame())
  })
}, 20000)

test("clicking a chat in the list switches to it", async () => {
  await open(160, 45, async (setup) => {
    const lines = setup.captureCharFrame().split("\n")
    const row = lines.findIndex((line) => line.indexOf("Greeting") >= 0 && line.indexOf("Greeting") < 42)
    await setup.mockMouse.click(lines[row].indexOf("Greeting"), row)
    await waitForHighlightedFrame(setup, (frame) => frame.includes("Question in Greeting"))
  })
}, 20000)

test("sidebar panels leave six chat rows when space allows", () => {
  for (const height of [14, 16, 24, 45]) {
    const layout = sidebarLayout(height)
    expect(layout.chats).toBe(6)
    expect(layout.panels + layout.chats + 8).toBeLessThanOrEqual(height)
  }
  expect(sidebarLayout(11)).toEqual({ chats: 3, panels: 0 })
})

test("a short terminal keeps the chat list usable and scrolls the lower panels", async () => {
  await open(160, 20, async (setup) => {
    const chats = setup.renderer.root.findDescendantById("chat-sidebar-chats")!
    const panels = setup.renderer.root.findDescendantById("chat-sidebar-panels")!
    expect(chats.height).toBeGreaterThanOrEqual(6)
    expect(panels.height).toBeGreaterThan(0)
    expect(panels.y + panels.height).toBeLessThanOrEqual(20)
    expect(setup.captureCharFrame()).toContain("Greeting")
  })
}, 20000)

test("sidebar marks approvals, questions and unseen finishes and its summary jumps to the first waiting chat", async () => {
  await open(
    160,
    45,
    async (setup) => {
      await waitForHighlightedFrame(setup, (frame) => frame.includes("2 need you"))
      for (const [id, marker] of [
        ["ses_kw", "!"],
        ["ses_potato", "?"],
        ["ses_hi", "●"],
      ]) {
        const row = setup.renderer.root.findDescendantById(`chat-sidebar-chat-${id}`)!
        expect(row.height).toBe(1)
        expect(setup.captureCharFrame().split("\n")[row.y]).toContain(marker)
      }
      // Select the second waiting chat, then use the summary to return to the first.
      const second = setup.renderer.root.findDescendantById("chat-sidebar-chat-ses_potato")!
      await setup.mockMouse.click(second.x + 2, second.y)
      await waitForHighlightedFrame(setup, (frame) => frame.includes("Choose market"))
      const summary = setup.renderer.root.findDescendantById("chat-sidebar-needs-user")!
      await setup.mockMouse.click(summary.x, summary.y)
      await waitForHighlightedFrame(setup, (frame) => frame.includes("echo ready"))
    },
    true,
  )
}, 20000)
