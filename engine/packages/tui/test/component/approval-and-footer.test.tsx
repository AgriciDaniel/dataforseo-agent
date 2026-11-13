/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import { expect, test } from "bun:test"
import { createSignal } from "solid-js"
import { ConfigProvider } from "../../src/config"
import { Keymap } from "../../src/context/keymap"
import { ThemeProvider } from "../../src/context/theme"
import { FooterMenu } from "../../src/component/prompt/footer-menu"
import { APPROVAL_CREW_WIDTH, approvalCrewFrame } from "../../src/component/approval-crew"
import { chatAutoAllowed, isDataForSEOAction, rootSession, setChatAutoAllowed } from "../../src/util/chat-auto-allow"
import { emptyThemeSource, tmpdir } from "../fixture/fixture"
import { TestTuiContexts } from "../fixture/tui-environment"
import { createTuiResolvedConfig } from "../fixture/tui-runtime"

test("the approval crew is three small bots pointing right, and it moves", () => {
  const a = approvalCrewFrame(0)
  const b = approvalCrewFrame(0.4)
  expect(a).toHaveLength(4)
  a.forEach((row) => expect(row).toHaveLength(APPROVAL_CREW_WIDTH))
  const colors = new Set(a.flat().flatMap((cell) => [cell.fg, cell.bg]))
  for (const c of ["#F44336", "#FFC107", "#7ED957", "#ffffff"]) expect(colors.has(c)).toBe(true)
  expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
})

test("chat auto-allow is per chat and only for DataForSEO actions", () => {
  expect(isDataForSEOAction("dataforseo_api_request")).toBe(true)
  expect(isDataForSEOAction("shell")).toBe(false)
  const parents: Record<string, string> = { child: "root", grandchild: "child" }
  expect(rootSession("grandchild", (id) => parents[id])).toBe("root")
  setChatAutoAllowed("root", true)
  expect(chatAutoAllowed("root")).toBe(true)
  expect(chatAutoAllowed("other")).toBe(false)
  setChatAutoAllowed("root", false)
  expect(chatAutoAllowed("root")).toBe(false)
})

test("the footer menu picks with enter only after the arrow keys moved the highlight", async () => {
  await using tmp = await tmpdir()
  const picked: string[] = []
  const [open, setOpen] = createSignal(true)
  const app = await testRender(
    () => (
      <TestTuiContexts directory={tmp.path} paths={{ home: tmp.path, state: tmp.path, worktree: tmp.path }}>
        <ConfigProvider config={createTuiResolvedConfig({ animations: false })}>
          <Keymap.Provider>
            <ThemeProvider mode="dark" source={emptyThemeSource}>
              {open() ? (
                <FooterMenu
                  id="menu"
                  title="Agent"
                  width={40}
                  current="onpage"
                  items={[
                    { id: "general", label: "General", detail: "Everyday work" },
                    { id: "onpage", label: "Onpage", detail: "Site audits" },
                    { id: "labs", label: "Labs", detail: "Keyword research" },
                  ]}
                  onSelect={(id) => picked.push(id)}
                  onClose={() => setOpen(false)}
                />
              ) : (
                <text>closed</text>
              )}
            </ThemeProvider>
          </Keymap.Provider>
        </ConfigProvider>
      </TestTuiContexts>
    ),
    { width: 60, height: 12, kittyKeyboard: true },
  )
  try {
    await app.renderOnce()
    const frame = app.captureCharFrame()
    console.log(frame)
    expect(frame).toContain("● Onpage")
    expect(frame).toContain("○ Labs")
    // Enter before any arrow key picks nothing, even with a row under the mouse.
    await app.mockMouse.moveTo(5, 2)
    app.mockInput.pressEnter()
    await app.renderOnce()
    expect(picked).toEqual([])
    app.mockInput.pressArrow("down")
    await app.renderOnce()
    app.mockInput.pressEnter()
    // The hover left the highlight on General, so one step down is OnPage.
    expect(picked).toEqual(["onpage"])
    app.mockInput.pressEscape()
    await app.waitForFrame((frame) => frame.includes("closed"))
  } finally {
    app.renderer.destroy()
  }
})

test("a paid call asks in four rows: price and endpoint, parameters, choices, fine print", async () => {
  await using tmp = await tmpdir()
  const { SessionQuestion } = await import("../../src/routes/session/permission")
  const { ApprovalCrew } = await import("../../src/component/approval-crew")
  const picked: string[] = []
  const app = await testRender(
    () => (
      <TestTuiContexts directory={tmp.path} paths={{ home: tmp.path, state: tmp.path, worktree: tmp.path }}>
        <ConfigProvider config={createTuiResolvedConfig({ animations: false })}>
          <Keymap.Provider>
            <ThemeProvider mode="dark" source={emptyThemeSource}>
              <SessionQuestion
                title="Permission required"
                instance="req"
                body={<text>full body</text>}
                lead={<ApprovalCrew />}
                hotkeys={{ once: "y", chat: "a", reject: "n" }}
                options={{ once: "Accept", chat: "Allow all in chat", always: "Always this endpoint", reject: "Deny" }}
                compact={{
                  heading: <text>$0.06 POST /v3/keywords_data/google_ads/search_volume/task_post</text>,
                  detail: (option) => <text>{option === "always" ? "always text" : "keywords [ai marketing]"}</text>,
                  footnote: "List price $0.06 per task.",
                }}
                fullscreen
                onSelect={(option) => picked.push(option)}
              />
            </ThemeProvider>
          </Keymap.Provider>
        </ConfigProvider>
      </TestTuiContexts>
    ),
    { width: 120, height: 10, kittyKeyboard: true },
  )
  try {
    await app.renderOnce()
    const lines = app.captureCharFrame().split("\n")
    if (process.env.APPROVAL_SNAPSHOT) await Bun.write(process.env.APPROVAL_SNAPSHOT, lines.join("\n"))
    const row = (text: string) => lines.findIndex((line) => line.includes(text))
    expect(row("$0.06 POST")).toBeGreaterThanOrEqual(0)
    expect(row("keywords [ai marketing]")).toBe(row("$0.06 POST") + 1)
    expect(row("Accept")).toBe(row("$0.06 POST") + 2)
    expect(row("List price")).toBe(row("$0.06 POST") + 3)
    expect(lines.join("\n")).not.toContain("full body")
    app.mockInput.pressKey("y")
    await app.renderOnce()
    expect(picked).toEqual(["once"])
  } finally {
    app.renderer.destroy()
  }
})
