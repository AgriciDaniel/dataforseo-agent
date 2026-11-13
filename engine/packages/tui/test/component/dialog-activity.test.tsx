/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { onMount, type JSX } from "solid-js"
import type { SessionInfo } from "@dataforseo-agent/client"
import { ConfigProvider } from "../../src/config"
import { DialogActivity, activityFinished, filterActivity, type ActivityRow } from "../../src/component/dialog-activity"
import { DialogConfig } from "../../src/component/dialog-config"
import { ClientProvider } from "../../src/context/client"
import { DataProvider, useData } from "../../src/context/data"
import { Keymap } from "../../src/context/keymap"
import { LocationProvider } from "../../src/context/location"
import { RouteProvider, useRoute } from "../../src/context/route"
import { TuiAppProvider } from "../../src/context/runtime"
import { SessionTabsProvider, useSessionTabs } from "../../src/context/session-tabs"
import { StorageProvider, useStorage } from "../../src/context/storage"
import { ThemeProvider } from "../../src/context/theme"
import { DialogProvider, useDialog } from "../../src/ui/dialog"
import { ToastProvider } from "../../src/ui/toast"
import { createApi, createEventStream, createFetch, directory, json } from "../fixture/tui-client"
import { emptyThemeSource, tmpdir } from "../fixture/fixture"
import { TestTuiContexts } from "../fixture/tui-environment"
import { createTuiResolvedConfig } from "../fixture/tui-runtime"

const rows: ActivityRow[] = [
  { sessionID: "idle", state: "idle", title: "Welcome", reason: "idle" },
  { sessionID: "done", state: "done", title: "Audit", reason: "finished 2m ago" },
  { sessionID: "work", state: "working", title: "Keywords", agent: "Scout", reason: "running: ideas" },
  { sessionID: "error", state: "error", title: "Links", reason: "last turn failed" },
  { sessionID: "question", state: "question", title: "Research", reason: "asked a question" },
  { sessionID: "approval", state: "approval", title: "Research", reason: "waiting for approval" },
]

test("activity search keeps state groups in priority order and searches titles, states and agent names", () => {
  expect(filterActivity(rows, "").map((row) => row.state)).toEqual([
    "approval",
    "question",
    "error",
    "working",
    "done",
    "idle",
  ])
  expect(filterActivity(rows, "RESEARCH").map((row) => row.state)).toEqual(["approval", "question"])
  expect(filterActivity(rows, "  working SCOUT ").map((row) => row.sessionID)).toEqual(["work"])
  expect(filterActivity(rows, "missing")).toEqual([])
  expect(rows[0].state).toBe("idle")
})

test("completion reasons handle minutes, hours, days and clock skew", () => {
  const now = 100_000_000
  expect(activityFinished(undefined, now)).toBe("finished")
  expect(activityFinished(now + 100, now)).toBe("finished just now")
  expect(activityFinished(now - 120_000, now)).toBe("finished 2m ago")
  expect(activityFinished(now - 7_200_000, now)).toBe("finished 2h ago")
  expect(activityFinished(now - 172_800_000, now)).toBe("finished 2d ago")
})

async function renderActivity(view: () => JSX.Element = () => <DialogActivity />, preload = true) {
  const temporary = await tmpdir()
  const base = {
    projectID: "proj_test",
    location: { directory },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    time: { created: 1, updated: 2 },
  }
  const sessions: SessionInfo[] = [
    { ...base, id: "root", title: "SEO research" },
    { ...base, id: "child", parentID: "root", title: "Keyword ideas", agent: "Scout" },
    { ...base, id: "question", parentID: "root", title: "Audience choice", agent: "Writer" },
    {
      ...base,
      id: "running",
      parentID: "root",
      title: "Competitor pages",
      agent: "Researcher",
      time: { ...base.time, busy: Date.now() },
    },
    { ...base, id: "done", title: "Finished audit", time: { ...base.time, idle: Date.now() - 120_000 } },
    { ...base, id: "idle", title: "Welcome" },
  ]
  const permission = {
    id: "per_child",
    sessionID: "child",
    action: "dataforseo",
    resources: [],
    metadata: { input: { method: "POST", path: "/v3/serp/google/organic/live/advanced" } },
  }
  const form = {
    id: "frm_child",
    sessionID: "question",
    title: "Choose audience",
    fields: [{ key: "audience", type: "string", title: "Audience" }],
  }
  const events = createEventStream()
  const calls = createFetch((url) => {
    if (url.pathname === "/api/session/active") return json({ data: { running: { type: "running" } } })
    if (url.pathname === "/api/session")
      return json({ data: sessions.filter((s) => s.parentID === url.searchParams.get("parentID")), cursor: {} })
    for (const session of sessions) {
      if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
      if (url.pathname === `/api/session/${session.id}/message`) return json({ data: [], cursor: {} })
      if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
      if (url.pathname === `/api/session/${session.id}/permission`)
        return json({ data: session.id === "child" ? [permission] : [] })
      if (url.pathname === `/api/session/${session.id}/form`)
        return json({ data: session.id === "question" ? [form] : [] })
    }
  }, events)
  let data!: ReturnType<typeof useData>
  let tabs!: ReturnType<typeof useSessionTabs>
  let route!: ReturnType<typeof useRoute>
  let storage!: ReturnType<typeof useStorage>
  let dialog!: ReturnType<typeof useDialog>
  let configuration = {
    attention: { notifications: false, sound: false },
    tabs: { mode: "on" as const, scope: "global" as const },
  }
  const writes: (typeof configuration)[] = []
  function Probe() {
    data = useData()
    tabs = useSessionTabs()
    route = useRoute()
    storage = useStorage()
    dialog = useDialog()
    onMount(() => {
      for (const session of sessions) data.session.remember(session)
      data.session.setStatus("running", "running")
      tabs.open("root")
      tabs.open("done")
      tabs.open("idle")
      dialog.replace(view)
    })
    return null
  }
  const app = await testRender(
    () => (
      <TestTuiContexts paths={{ state: temporary.path }}>
        <TuiAppProvider value={{ name: "test", version: "test", channel: "test" }}>
          <StorageProvider>
            <ConfigProvider
              config={createTuiResolvedConfig(configuration)}
              service={{
                get: async () => configuration,
                update: async (update) => {
                  configuration = structuredClone(configuration)
                  update(configuration)
                  writes.push(configuration)
                  return configuration
                },
              }}
            >
              <Keymap.Provider>
                <ToastProvider>
                  <RouteProvider>
                    <ClientProvider api={createApi(calls.fetch)}>
                      <DataProvider directory={directory}>
                        <LocationProvider>
                          <SessionTabsProvider>
                            <ThemeProvider mode="dark" source={emptyThemeSource}>
                              <DialogProvider>
                                <Probe />
                              </DialogProvider>
                            </ThemeProvider>
                          </SessionTabsProvider>
                        </LocationProvider>
                      </DataProvider>
                    </ClientProvider>
                  </RouteProvider>
                </ToastProvider>
              </Keymap.Provider>
            </ConfigProvider>
          </StorageProvider>
        </TuiAppProvider>
      </TestTuiContexts>
    ),
    { width: 150, height: 42, kittyKeyboard: true },
  )
  app.renderer.start()
  await app.waitForFrame(() => data !== undefined)
  if (preload)
    await Promise.all(
      sessions.flatMap((session) => [data.session.permission.sync(session.id), data.session.form.sync(session.id)]),
    )
  return {
    ...app,
    tabs,
    route,
    data,
    dialog,
    writes,
    async destroy() {
      app.renderer.destroy()
      await storage.flush()
      await temporary[Symbol.asyncDispose]()
    },
  }
}

test("activity renders family states, searches a child question and Enter targets that exact prompt", async () => {
  const app = await renderActivity()
  try {
    const frame = await app.waitForFrame(
      (value) =>
        value.includes("Choose audience") && value.includes("Competitor pages") && value.includes("Finished audit"),
    )
    expect(frame).toContain("POST /v3/serp/")
    expect(frame).toContain("Scout")
    expect(frame).toContain("Writer")
    expect(frame).toContain("Competitor pages")
    expect(frame).toContain("finished 2m ago")
    expect(frame.indexOf("approval")).toBeLessThan(frame.indexOf("question"))
    expect(frame.indexOf("question")).toBeLessThan(frame.indexOf("working"))
    expect(frame.indexOf("working")).toBeLessThan(frame.indexOf("done"))
    expect(app.tabs.state("root")).toBe("approval")
    await app.mockInput.typeText("question Writer")
    const filtered = await app.waitForFrame((value) => value.includes("Writer") && !value.includes("Scout"))
    expect(filtered).not.toContain("Finished audit")
    await app.mockInput.pressEnter()
    expect(app.route.data).toMatchObject({ type: "session", sessionID: "root" })
    expect(app.tabs.promptTarget()).toEqual({ sessionID: "root", kind: "question", id: "frm_child" })
  } finally {
    await app.destroy()
  }
})

test("activity Enter on a child approval selects its parent and request", async () => {
  const app = await renderActivity()
  try {
    await app.waitForFrame((value) => value.includes("Scout"))
    await app.mockInput.typeText("Scout")
    await app.waitForFrame((value) => value.includes("Scout") && !value.includes("Writer"))
    await app.mockInput.pressEnter()
    expect(app.route.data).toMatchObject({ type: "session", sessionID: "root" })
    expect(app.tabs.promptTarget()).toEqual({ sessionID: "root", kind: "approval", id: "per_child" })
  } finally {
    await app.destroy()
  }
})

test("background tab prefetch hydrates waiting child prompts without visiting the parent", async () => {
  const app = await renderActivity(undefined, false)
  try {
    await app.waitForFrame((value) => value.includes("Choose audience") && value.includes("POST /v3/serp/"))
    expect(app.route.data.type).toBe("home")
    expect(app.tabs.state("root")).toBe("approval")
  } finally {
    await app.destroy()
  }
})

test("session state follows existing outcome, running and viewed data", async () => {
  const app = await renderActivity()
  try {
    const idle = app.data.session.get("idle")!
    app.data.session.remember({ ...idle, outcome: "failed" })
    expect(app.tabs.state("idle")).toBe("error")
    app.data.session.setStatus("idle", "running")
    expect(app.tabs.state("idle")).toBe("working")
    app.data.session.setStatus("idle", "idle")
    app.data.session.remember({ ...idle, outcome: "succeeded", time: { ...idle.time, idle: 100, viewed: 50 } })
    expect(app.tabs.state("idle")).toBe("done")
    app.data.session.remember({ ...idle, outcome: "succeeded", time: { ...idle.time, idle: 100, viewed: 100 } })
    expect(app.tabs.state("idle")).toBe("idle")
  } finally {
    await app.destroy()
  }
})

test("notification toggles keep defaults off and persist through the existing config service", async () => {
  const app = await renderActivity(() => <DialogConfig notifications />)
  try {
    const frame = await app.waitForFrame((value) => value.includes("Notifications") && value.includes("Sounds"))
    expect(frame).toContain("off")
    expect(app.writes).toHaveLength(0)
    await app.mockInput.pressEnter()
    await app.waitForFrame((value) => value.includes("on"))
    expect(app.writes.at(-1)?.attention).toEqual({ notifications: true, sound: false })
    await app.mockInput.pressArrow("down")
    await app.mockInput.pressEnter()
    await app.waitForFrame(() => app.writes.at(-1)?.attention.sound === true)
    expect(app.writes.at(-1)?.attention).toEqual({ notifications: true, sound: true })
  } finally {
    await app.destroy()
  }
})
