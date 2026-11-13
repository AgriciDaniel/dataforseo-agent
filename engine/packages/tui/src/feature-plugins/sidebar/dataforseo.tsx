// DataForSEO Agent: the account panel at the top of the sidebar. Balance, today's spend against the daily
// limit, this session's spend against the budget in settings.json, and the default market. All numbers come
// from the free /v3/appendix/user_data endpoint, refreshed when the session finishes a step.
import { Plugin } from "@dataforseo-agent/plugin/tui"
import type { BoxRenderable } from "@opentui/core"
import { createMemo, createSignal, Show } from "solid-js"
import { budgetUsage, useAccount, usd } from "./account"

const LOCATIONS: Record<number, string> = {
  2840: "US",
  2826: "UK",
  2124: "Canada",
  2036: "Australia",
  2276: "Germany",
  2250: "France",
  2724: "Spain",
  2380: "Italy",
  2528: "Netherlands",
  2642: "Romania",
  2356: "India",
  2076: "Brazil",
  2484: "Mexico",
  2392: "Japan",
}

export function SidebarDataForSEO(props: { context: Pick<Plugin.Context, "theme" | "data">; sessionID: string }) {
  const theme = props.context.theme
  const { account, error, loading, settings, refresh, spent, budget } = useAccount(
    props.context.data,
    () => props.sessionID,
  )
  const [width, setWidth] = createSignal(0)
  const bar = createMemo(() => budgetUsage(spent(), budget(), width()))
  const barColor = () => theme.text.feedback[bar().status].base
  const market = createMemo(() => {
    const s = settings()
    const where = LOCATIONS[s.default_location_code] ?? String(s.default_location_code)
    return `${where} · ${s.default_language_code} · ${s.prefer_mode}`
  })

  return (
    <box>
      <box flexDirection="row" gap={1} onMouseUp={refresh}>
        <text fg={theme.text.base}>
          <b>Account</b>
        </text>
        <text fg={theme.text.muted}>{loading() ? "↻" : ""}</text>
      </box>
      <Show
        when={account()}
        fallback={
          <text fg={error() === "no credentials" ? theme.text.feedback.warning.base : theme.text.muted} wrapMode="word">
            {error() === "no credentials"
              ? "Not connected. Run /dfs-setup, or set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD."
              : error()
                ? `Account check failed: ${error()}`
                : "Checking account…"}
          </text>
        }
      >
        {(a) => (
          <>
            <box flexDirection="row" justifyContent="space-between">
              <text fg={theme.text.muted}>Balance</text>
              <text fg={theme.text.base}>
                <b>{usd(a().balance)}</b>
              </text>
            </box>
            <box flexDirection="row" justifyContent="space-between">
              <text fg={theme.text.muted}>Spent today</text>
              <text fg={theme.text.base}>
                {usd(a().today)}
                <span style={{ fg: theme.text.muted }}>{a().dayLimit ? ` of $${a().dayLimit}` : ""}</span>
              </text>
            </box>
            <box flexDirection="row" justifyContent="space-between">
              <text fg={theme.text.muted}>This session</text>
              <text fg={theme.text.base}>
                {usd(spent())}
                <span style={{ fg: theme.text.muted }}> of {usd(budget())}</span>
              </text>
            </box>
            <box
              onSizeChange={function (this: BoxRenderable) {
                setWidth(this.width)
              }}
            >
              <text wrapMode="none">
                <span style={{ fg: barColor() }}>{bar().filled}</span>
                <span style={{ fg: theme.text.muted }}>{bar().empty}</span>
                <span style={{ fg: barColor() }}>{bar().label}</span>
              </text>
            </box>
          </>
        )}
      </Show>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text.muted}>Market</text>
        <text fg={theme.text.base}>{market()}</text>
      </box>
    </box>
  )
}

export default Plugin.define({
  id: "dataforseo.sidebar.account",
  setup(context) {
    context.ui.slot({
      append: "sidebar.content",
      render: (props) => <SidebarDataForSEO context={context} sessionID={props.sessionID} />,
    })
  },
})
