import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { TextRenderable } from "@opentui/core"
import { createSignal, Show } from "solid-js"
import { ConfigProvider } from "../src/config"
import { ClientProvider } from "../src/context/client"
import { DataProvider, useData } from "../src/context/data"
import { ThemeProvider, useTheme } from "../src/context/theme"
import { SidebarDataForSEO } from "../src/feature-plugins/sidebar/dataforseo"
import { useAccount } from "../src/feature-plugins/sidebar/account"
import { PromptMetadataRow } from "../src/component/prompt/metadata"
import { readSettings } from "@dataforseo-agent/util/dataforseo"
import { emptyThemeSource } from "./fixture/fixture"
import { TestTuiContexts } from "./fixture/tui-environment"
import { createTuiResolvedConfig } from "./fixture/tui-runtime"
import { createApi, createFetch, directory } from "./fixture/tui-client"

for (const width of [40, 100]) {
  test(`account renderer keeps the readout when the panel folds at width ${width}`, async () => {
    let balance = 48.2
    let calls = 0
    let connected = true
    let account!: ReturnType<typeof useAccount>
    let theme!: ReturnType<typeof useTheme>
    const [visible, setVisible] = createSignal(true)
    const api = createApi(createFetch().fetch)
    function View() {
      const data = useData()
      theme = useTheme()
      account = useAccount(data, () => "session", {
        readSettings: () => ({ ...readSettings(), budget_per_session_usd: 1 }),
        fetchAccount: async () => {
          calls++
          if (!connected) throw new Error("no credentials")
          return { balance, today: 0 }
        },
      })
      return (
        <box width="100%">
          <Show when={visible()}>
            <SidebarDataForSEO context={{ data, theme }} sessionID="session" />
          </Show>
          <PromptMetadataRow
            sessionID="session"
            mode="normal"
            agent="General"
            auto={false}
            model="Test model"
            provider="Test"
            muted={false}
            highlight={theme.text.base}
            agentAlpha={1}
            modelAlpha={1}
            variantAlpha={1}
          />
        </box>
      )
    }
    const setup = await testRender(
      () => (
        <TestTuiContexts>
          <ConfigProvider config={createTuiResolvedConfig()}>
            <ThemeProvider mode="dark" source={emptyThemeSource}>
              <ClientProvider api={api}>
                <DataProvider directory={directory}>
                  <View />
                </DataProvider>
              </ClientProvider>
            </ThemeProvider>
          </ConfigProvider>
        </TestTuiContexts>
      ),
      { width, height: 20 },
    )
    try {
      setup.renderer.start()
      await setup.waitForFrame((frame) => frame.includes("session $0.00 of $1.00"))
      expect(calls).toBe(1)
      expect(setup.captureCharFrame()).toContain("0% used")
      setVisible(false)
      await setup.waitForFrame((frame) => !frame.includes("Account") && frame.includes("$48.20"))
      expect(calls).toBe(1)
      balance = 47.45
      account.refresh()
      await setup.waitForFrame((frame) => frame.includes("session $0.750 of $1.00"))
      const readout = setup.renderer.root.findDescendantById("prompt-account")
      expect(readout).toBeInstanceOf(TextRenderable)
      if (!(readout instanceof TextRenderable)) throw new Error("Expected account readout")
      const sessionSpan = () =>
        setup
          .captureSpans()
          .lines.flatMap((line) => line.spans)
          .find((span) => span.text.includes("session $"))
      expect(sessionSpan()?.fg.toInts()).toEqual(theme.text.feedback.warning.base.toInts())
      balance = 47.2
      account.refresh()
      await setup.waitForFrame((frame) => frame.includes("session $1.00 of $1.00"))
      expect(calls).toBe(3)
      expect(sessionSpan()?.fg.toInts()).toEqual(theme.text.feedback.error.base.toInts())
      connected = false
      account.refresh()
      await setup.waitForFrame(() => !setup.renderer.root.findDescendantById("prompt-account"))
    } finally {
      setup.renderer.destroy()
    }
  })
}
