import { expect, test } from "bun:test"
import { HOME_STARTERS, HomeStarters, showHomeStarters } from "../src/feature-plugins/home/starters"
import { testRender } from "@opentui/solid"
import { ConfigProvider } from "../src/config"
import { ThemeProvider } from "../src/context/theme"
import { emptyThemeSource } from "./fixture/fixture"
import { TestTuiContexts } from "./fixture/tui-environment"
import { createTuiResolvedConfig } from "./fixture/tui-runtime"
import { createAppFixture } from "./fixture/app"

test("starters reserve room for the home prompt and crew on compact terminals", () => {
  expect(showHomeStarters(100, 40)).toBe(true)
  expect(showHomeStarters(71, 40)).toBe(false)
  expect(showHomeStarters(100, 33)).toBe(false)
  expect(showHomeStarters(100, 34, 16)).toBe(false)
  expect(showHomeStarters(100, 40, 16)).toBe(true)
})

test("home starters fill an editable request without submitting", async () => {
  let submitted = 0
  await using setup = await createAppFixture({
    width: 100,
    height: 40,
    fetch: async (url, request) => {
      if (request.method === "POST" && url.pathname.startsWith("/api/session")) submitted++
    },
  })
  await setup.ready
  await setup.waitForFrame((frame) => frame.includes("Keyword ideas"))
  for (const [index, starter] of HOME_STARTERS.entries()) {
    const chip = setup.renderer.root.findDescendantById(`home-starter-${index}`)!
    expect(chip.y + chip.height).toBeLessThan(32)
    await setup.mockMouse.click(chip.x + 1, chip.y)
    await setup.waitForFrame((frame) => frame.includes(starter.prompt.slice(0, 25)))
  }
  expect(submitted).toBe(0)
  await setup.mockInput.typeText(" editable")
  await setup.waitForFrame((frame) => frame.includes("editable"))
})

test.each([
  [100, 30],
  [60, 40],
])("home hides starters at %ix%i", async (width, height) => {
  await using setup = await createAppFixture({ width, height })
  await setup.ready
  await setup.waitForVisualIdle({ quietFrames: 3 })
  expect(setup.renderer.root.findDescendantById("home-starter-0")).toBeUndefined()
})

for (const mode of ["dark", "light"] as const) {
  test(`starter renderer clicks and descriptions in ${mode} mode`, async () => {
    const picked: string[] = []
    const setup = await testRender(
      () => (
        <TestTuiContexts>
          <ConfigProvider config={createTuiResolvedConfig()}>
            <ThemeProvider mode={mode} source={emptyThemeSource}>
              <HomeStarters disabled={false} onSelect={(text) => picked.push(text)} />
            </ThemeProvider>
          </ConfigProvider>
        </TestTuiContexts>
      ),
      { width: 75, height: 5 },
    )
    try {
      setup.renderer.start()
      await setup.waitForFrame((frame) => frame.includes("Keyword ideas"))
      for (const [index, starter] of HOME_STARTERS.entries()) {
        expect(setup.captureCharFrame()).toContain(starter.description)
        const chip = setup.renderer.root.findDescendantById(`home-starter-${index}`)!
        await setup.mockMouse.click(chip.x + 1, chip.y)
      }
      expect(picked).toEqual(HOME_STARTERS.map((starter) => starter.prompt))
    } finally {
      setup.renderer.destroy()
    }
  })
}
