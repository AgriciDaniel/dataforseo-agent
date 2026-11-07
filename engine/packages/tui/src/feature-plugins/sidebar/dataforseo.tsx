// DataForSEO Agent: the account panel at the top of the sidebar. Balance, today's spend against the daily
// limit, this session's spend against the budget in settings.json, and the default market. All numbers come
// from the free /v3/appendix/user_data endpoint, refreshed when the session finishes a step.
import { Plugin } from "@dataforseo-agent/plugin/tui"
import { fetchAccount, readSettings, type Account } from "@dataforseo-agent/util/dataforseo"
import { createEffect, createMemo, createSignal, on, onCleanup, Show } from "solid-js"

const LOCATIONS: Record<number, string> = {
  2840: "US", 2826: "UK", 2124: "Canada", 2036: "Australia", 2276: "Germany", 2250: "France", 2724: "Spain",
  2380: "Italy", 2528: "Netherlands", 2642: "Romania", 2356: "India", 2076: "Brazil", 2484: "Mexico", 2392: "Japan",
}

// Small spends keep their real digits: $0.00015 must not show as $0.000.
const usd = (v: number) =>
  v === 0 ? "$0.00" : Math.abs(v) < 0.01 ? `$${Number(v.toPrecision(2))}` : Math.abs(v) < 1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`
// Balance at the moment each session was first shown, so its spend is the difference.
const sessionStart = new Map<string, number>()

export function SidebarDataForSEO(props: { context: Plugin.Context; sessionID: string }) {
  const theme = props.context.theme
  const [account, setAccount] = createSignal<Account | undefined>()
  const [error, setError] = createSignal<string | undefined>()
  const [loading, setLoading] = createSignal(false)
  const [settings, setSettings] = createSignal(readSettings())

  let timer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let lagTimer: ReturnType<typeof setTimeout> | undefined
  let retries = 0
  // A refresh asked for while one is in flight runs right after it, so a late paid call is never missed.
  let again = false
  const refresh = () => {
    if (loading()) {
      again = true
      return
    }
    setLoading(true)
    setSettings(readSettings())
    fetchAccount()
      .then((value) => {
        if (!sessionStart.has(props.sessionID)) sessionStart.set(props.sessionID, value.balance)
        setAccount(value)
        setError(undefined)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e))
        // user_data is rate limited: try again shortly instead of showing a stale total until the next step.
        if (retries < 3) {
          retries++
          clearTimeout(retryTimer)
          retryTimer = setTimeout(refresh, 10_000 * retries)
        }
      })
      .then(() => {
        if (!error()) retries = 0
      })
      .finally(() => {
        setLoading(false)
        if (!again) return
        again = false
        refresh()
      })
  }
  refresh()

  // Refresh a moment after each completed step, so paid calls show up without polling.
  const steps = createMemo(
    () =>
      props.context.data.session.message
        .list(props.sessionID)
        .flatMap((m) => ("content" in m && Array.isArray(m.content) ? m.content : []))
        .filter((p) => p.type === "tool" && p.state.status === "completed").length,
  )
  createEffect(
    on(steps, () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 1500)
      // The balance can lag a billed call by a few seconds: look once more.
      clearTimeout(lagTimer)
      lagTimer = setTimeout(refresh, 15_000)
    }, { defer: true }),
  )
  onCleanup(() => {
    clearTimeout(timer)
    clearTimeout(retryTimer)
    clearTimeout(lagTimer)
  })

  const spent = createMemo(() => {
    const a = account()
    const start = sessionStart.get(props.sessionID)
    return a && start !== undefined ? Math.max(0, start - a.balance) : 0
  })
  const budget = createMemo(() => settings().budget_per_session_usd)
  const barWidth = 18
  const fill = createMemo(() => Math.min(barWidth, Math.round((spent() / Math.max(budget(), 1e-9)) * barWidth)))
  const barColor = createMemo(() => {
    const share = spent() / Math.max(budget(), 1e-9)
    if (share >= 1) return theme.text.feedback.error.base
    if (share >= 0.75) return theme.text.feedback.warning.base
    return theme.text.feedback.success.base
  })
  const market = createMemo(() => {
    const s = settings()
    const where = LOCATIONS[s.default_location_code] ?? String(s.default_location_code)
    return `${where} · ${s.default_language_code} · ${s.prefer_mode}`
  })

  return (
    <box>
      <box flexDirection="row" gap={1} onMouseUp={refresh}>
        <text fg={theme.text.base}>
          <b>DataForSEO</b>
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
            <text>
              <span style={{ fg: barColor() }}>{"█".repeat(fill())}</span>
              <span style={{ fg: theme.text.muted }}>{"░".repeat(barWidth - fill())}</span>
            </text>
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
