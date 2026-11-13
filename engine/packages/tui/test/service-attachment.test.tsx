import { expect, test } from "bun:test"
import { detachMessage } from "../src/component/service-lifecycle"
import { createStorage } from "../src/context/storage"
import { createAppFixture } from "./fixture/app"
import { tmpdir } from "./fixture/fixture"
import { directory, json } from "./fixture/tui-client"

test("detach reports active chats without mutating them, including an unavailable count", async () => {
  expect(await detachMessage({ session: { active: async () => ({ one: {}, two: {} }) } })).toBe(
    "Detached; 2 chats still running. Come back with dataforseo.",
  )
  expect(
    await detachMessage({
      session: {
        active: async () => {
          throw new Error("offline")
        },
      },
    }),
  ).toContain("running chat count unavailable")
})

const session = {
  id: "ses_attachment",
  title: "Reattached chat",
  projectID: "project",
  location: { directory },
  cost: 0,
  tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  time: { created: 0, updated: 0 },
}

test.each(["exit", "detach", "hangup"])(
  "managed %s leaves running work and pending interactions alone",
  async (action) => {
    const mutations: string[] = []
    await using setup = await createAppFixture({
      managed: true,
      fetch: (url, request) => {
        if (request.method !== "GET" && !url.pathname.endsWith(".goal/get")) mutations.push(url.pathname)
        if (url.pathname === "/api/session/active") return json({ data: { [session.id]: { type: "running" } } })
        if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
        return undefined
      },
    })
    await setup.ready
    await setup.waitForFrame((frame) => frame.includes("commands"))
    if (action === "hangup") process.emit("SIGHUP")
    else {
      await setup.mockInput.typeText(`/${action}`)
      setup.mockInput.pressEnter()
    }
    await setup.closed
    expect(mutations).toEqual([])
  },
)

test.each(["permission", "form"])(
  "a fresh client restores the last chat and an answerable %s without replay",
  async (kind) => {
    await using state = await tmpdir()
    const storage = createStorage(state.path, "test")
    await storage.storage.store<{ sessionID?: string; pid?: number }>("service-attachment", { initial: {} })[1](
      (draft) => {
        draft.sessionID = session.id
        draft.pid = 0
      },
    )
    storage.close()
    const mutations: string[] = []
    await using setup = await createAppFixture({
      state: state.path,
      managed: true,
      fetch: (url, request) => {
        if (request.method !== "GET" && !url.pathname.endsWith(".goal/get")) mutations.push(url.pathname)
        if (url.pathname === "/api/session") return json({ data: [session], cursor: {} })
        if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
        if (url.pathname === `/api/session/${session.id}/message`) return json({ data: [], cursor: {} })
        if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
        if (url.pathname === `/api/session/${session.id}/permission`)
          return json({
            data:
              kind === "permission"
                ? [
                    {
                      id: "per_restored",
                      sessionID: session.id,
                      action: "shell",
                      resources: ["retained-resource"],
                    },
                  ]
                : [],
          })
        if (url.pathname === `/api/session/${session.id}/form`)
          return json({
            data:
              kind === "form"
                ? [
                    {
                      id: "frm_restored",
                      sessionID: session.id,
                      title: "Restored question",
                      fields: [{ key: "choice", type: "string", title: "Choose a value", default: "answer" }],
                    },
                  ]
                : [],
          })
        if (url.pathname.endsWith("/reply")) return new Response(null, { status: 204 })
        return undefined
      },
    })
    await setup.ready
    await setup.waitForFrame((frame) =>
      frame.includes(kind === "permission" ? "Permission required" : "Restored question"),
    )
    expect(mutations.filter((path) => !path.endsWith("/environment"))).toEqual([])
    // The restored question is on screen and nothing was replayed; answering a form field by field is covered
    // by the form tests, so only the approval is answered here.
    if (kind === "form") return
    setup.mockInput.pressEnter()
    await setup.waitFor(() => mutations.some((path) => path.endsWith("/reply")))
    expect(mutations.filter((path) => !path.endsWith("/environment"))).toEqual([
      `/api/session/${session.id}/${kind}/${kind === "permission" ? "per_restored" : "frm_restored"}/reply`,
    ])
  },
)

test.each(["permission", "form"])("quitting a pending %s detaches without rejection or cancellation", async (kind) => {
  const mutations: string[] = []
  await using setup = await createAppFixture({
    managed: true,
    args: { sessionID: session.id },
    config: { animations: false, keybinds: { "app.exit": "f9" } },
    fetch: (url, request) => {
      if (request.method !== "GET" && !url.pathname.endsWith(".goal/get")) mutations.push(url.pathname)
      if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
      if (url.pathname === `/api/session/${session.id}/message`) return json({ data: [], cursor: {} })
      if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
      if (url.pathname === `/api/session/${session.id}/permission`)
        return json({
          data:
            kind === "permission"
              ? [
                  {
                    id: "per_detached",
                    sessionID: session.id,
                    action: "shell",
                    resources: ["retained-resource"],
                  },
                ]
              : [],
        })
      if (url.pathname === `/api/session/${session.id}/form`)
        return json({
          data:
            kind === "form"
              ? [
                  {
                    id: "frm_detached",
                    sessionID: session.id,
                    title: "Pending question",
                    fields: [{ key: "choice", type: "string" }],
                  },
                ]
              : [],
        })
      return undefined
    },
  })
  await setup.ready
  await setup.waitForFrame((frame) =>
    frame.includes(kind === "permission" ? "Permission required" : "Pending question"),
  )
  setup.mockInput.pressKey("F9")
  await setup.closed
  expect(mutations.filter((path) => !path.endsWith("/environment"))).toEqual([])
})

test("standalone startup explains its lifetime and detach does not claim success", async () => {
  await using setup = await createAppFixture({ standalone: true })
  await setup.ready
  await setup.waitForFrame((frame) => frame.includes("closing this TUI stops"))
  await setup.mockInput.typeText("/detach")
  setup.mockInput.pressEnter()
  await setup.waitForFrame((frame) => frame.includes("Detach requires the background service"))
  expect(setup.renderer.isDestroyed).toBe(false)
})

test("a missing saved terminal is explained on screen", async () => {
  await using state = await tmpdir()
  const storage = createStorage(state.path, "test")
  await storage.storage.store<{ sessions: Record<string, string> }>("session-terminal-selection", {
    initial: { sessions: {} },
  })[1]((draft) => {
    draft.sessions[session.id] = "pty_missing"
  })
  storage.close()
  await using setup = await createAppFixture({ state: state.path })
  await setup.ready
  await setup.waitForFrame((frame) => frame.includes("previous terminal is no longer available"))
})

test("a changed service process explains that pending interactions may need to be asked again", async () => {
  await using state = await tmpdir()
  const storage = createStorage(state.path, "test")
  await storage.storage.store<{ pid?: number }>("service-attachment", { initial: {} })[1]((draft) => {
    draft.pid = 123
  })
  storage.close()
  await using setup = await createAppFixture({ state: state.path, managed: true })
  await setup.ready
  // The toast wraps, so match the start of the message.
  await setup.waitForFrame((frame) => frame.includes("Service restarted; pending approvals or questions"))
})

test("normal exit flushes the selected chat before another client reads it", async () => {
  await using state = await tmpdir()
  await using setup = await createAppFixture({
    state: state.path,
    managed: true,
    args: { sessionID: session.id },
    fetch: (url) => {
      if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
      if (url.pathname === `/api/session/${session.id}/message`) return json({ data: [], cursor: {} })
      if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
      return undefined
    },
  })
  await setup.ready
  await setup.waitForFrame((frame) => frame.includes(session.title))
  setup.renderer.destroy()
  await setup.closed
  const storage = createStorage(state.path, "test")
  try {
    expect(storage.storage.store<{ sessionID?: string }>("service-attachment", { initial: {} })[0].sessionID).toBe(
      session.id,
    )
  } finally {
    storage.close()
  }
})
