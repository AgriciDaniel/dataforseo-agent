import { expect, test } from "bun:test"
import { createTestRenderer } from "@opentui/core/testing"
import { Effect, FileSystem } from "effect"
import { Global } from "@dataforseo-agent/util/global"
import { run } from "../src/app"
import { createStorage } from "../src/context/storage"
import { createEventStream, createFetch, directory, json } from "./fixture/tui-client"
import { tmpdir } from "./fixture/fixture"

test("an open terminal restores its snapshot and socket after reconnect without creating another terminal", async () => {
  await using state = await tmpdir()
  const session = {
    id: "ses_terminal_reconnect",
    title: "Reconnect terminal",
    projectID: "project",
    location: { directory },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    time: { created: 0, updated: 0 },
  }
  const pty = {
    id: "pty_reconnect",
    sessionID: session.id,
    title: "Terminal",
    command: "/bin/sh",
    args: [],
    cwd: directory,
    status: "running",
    pid: 42,
    foregroundProcess: null,
    size: { cols: 48, rows: 24 },
    output: { head: 0, tail: 0 },
  }
  const storage = createStorage(state.path, "test")
  await storage.storage.store<{ sessions: Record<string, string> }>("session-terminal-selection", {
    initial: { sessions: {} },
  })[1]((draft) => {
    draft.sessions[session.id] = pty.id
  })
  storage.close()
  const events = createEventStream()
  let snapshots = 0
  let attachments = 0
  const mutations: string[] = []
  const calls = createFetch((url, request) => {
    if (request.method !== "GET" && !url.pathname.endsWith(".goal/get")) mutations.push(url.pathname)
    if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
    if (url.pathname === `/api/session/${session.id}/message`) return json({ data: [], cursor: {} })
    if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
    if (url.pathname === `/api/experimental/session/${session.id}/terminal`) return json({ data: [pty] })
    if (url.pathname.endsWith("/snapshot")) {
      snapshots++
      return json({
        data: {
          info: pty,
          text: "retained-output",
          checkpoint: Buffer.from("retained-output").toString("base64"),
          cursor: { x: 15, y: 0 },
        },
      })
    }
    if (url.pathname.endsWith("/connect-token")) return json({ data: { ticket: "fixture" } })
    return undefined
  }, events)
  const server = Bun.serve({
    port: 0,
    fetch(request, server) {
      if (new URL(request.url).pathname.endsWith("/connect") && server.upgrade(request)) return undefined
      return calls.fetch(request)
    },
    websocket: {
      open(socket) {
        attachments++
        socket.send(JSON.stringify({ type: "attached", inputProtocol: 1, role: "controller", info: pty }))
        socket.send(JSON.stringify({ type: "replay_complete" }))
      },
      message() {},
    },
  })
  const setup = await createTestRenderer({ width: 120, height: 36 })
  await setup.renderer.setupTerminal()
  setup.renderer.start()
  const task = Effect.runPromise(
    run({
      app: { name: "test", version: "test", channel: "test" },
      server: { endpoint: { url: server.url.toString() } },
      config: { get: async () => ({ animations: false }), update: async () => ({}) },
      packages: { prepare: async () => ({ directory: "" }) },
      args: { sessionID: session.id },
      terminalHandoff: async () => ({ renderer: setup.renderer, mode: "dark", complete: () => {} }),
    }).pipe(Effect.provide(Global.layerWith({ state: state.path })), Effect.provide(FileSystem.layerNoop({}))),
  )
  try {
    await setup.waitFor(() => attachments === 1)
    await setup.waitForFrame((frame) => frame.includes("retained-output"))
    events.disconnect()
    await setup.waitFor(() => attachments === 2, { maxPasses: 300 })
    await setup.waitForFrame((frame) => frame.includes("retained-output"))
    expect(snapshots).toBe(2)
    expect(mutations.filter((path) => !path.endsWith("/environment") && !path.endsWith("/connect-token"))).toEqual([])
  } finally {
    setup.renderer.destroy()
    await task
    await server.stop(true)
  }
})
