import type { Plugin } from "@dataforseo-agent/plugin/tui"
import { fetchAccount, readSettings, type Account } from "@dataforseo-agent/util/dataforseo"
import { createEffect, createMemo, createRoot, createSignal, on, onCleanup, untrack, type Accessor } from "solid-js"

type Data = { session: { message: Pick<Plugin.Context["data"]["session"]["message"], "list"> } }
const sessionStarts = new WeakMap<Data, Map<string, { start?: number }>>()
const accounts = new WeakMap<
  Data,
  { state: ReturnType<typeof createAccountState>; dispose: () => void; users: number }
>()

export const usd = (value: number) =>
  value === 0
    ? "$0.00"
    : Math.abs(value) < 0.01
      ? `$${Number(value.toPrecision(2))}`
      : Math.abs(value) < 1
        ? `$${value.toFixed(3)}`
        : `$${value.toFixed(2)}`

export function budgetUsage(spent: number, budget: number, width = 0) {
  const share = spent / Math.max(budget, 1e-9)
  const label = ` ${Math.round(share * 100)}% used`
  const columns = Math.max(0, Math.floor(width) - label.length)
  const fill = Math.min(columns, Math.round(share * columns))
  return {
    status: share >= 1 ? "error" : share >= 0.75 ? "warning" : "success",
    label,
    filled: "█".repeat(fill),
    empty: "░".repeat(columns - fill),
  } as const
}

// One request stream per TUI data context, retained while either the panel or a session prompt is mounted.
export function createAccountState(
  source = { fetchAccount, readSettings },
  sessions = new Map<string, { start?: number }>(),
) {
  const [account, setAccount] = createSignal<Account>()
  const [error, setError] = createSignal<string>()
  const [loading, setLoading] = createSignal(false)
  const [settings, setSettings] = createSignal(source.readSettings())
  let timer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let lagTimer: ReturnType<typeof setTimeout> | undefined
  let retries = 0
  let again = false
  let disposed = false

  const refresh = () => {
    if (disposed) return
    if (loading()) {
      again = true
      return
    }
    clearTimeout(retryTimer)
    setLoading(true)
    setSettings(source.readSettings())
    void source
      .fetchAccount()
      .then((value) => {
        if (disposed) return
        for (const session of sessions.values()) session.start ??= value.balance
        setAccount(value)
        setError(undefined)
        retries = 0
      })
      .catch((cause: unknown) => {
        if (disposed) return
        const message = cause instanceof Error ? cause.message : String(cause)
        setError(message)
        if (message === "no credentials") setAccount(undefined)
        if (message === "no credentials" || retries >= 3) return
        retries++
        retryTimer = setTimeout(refresh, 10_000 * retries)
      })
      .finally(() => {
        if (disposed) return
        setLoading(false)
        if (!again) return
        again = false
        refresh()
      })
  }
  onCleanup(() => {
    disposed = true
    clearTimeout(timer)
    clearTimeout(retryTimer)
    clearTimeout(lagTimer)
  })

  return {
    account,
    error,
    loading,
    settings,
    refresh,
    track(sessionID: string) {
      if (!sessions.has(sessionID)) sessions.set(sessionID, { start: account()?.balance })
    },
    spent(sessionID: string | undefined) {
      const start = sessionID ? sessions.get(sessionID)?.start : undefined
      const value = account()
      return start !== undefined && value ? Math.max(0, start - value.balance) : 0
    },
    completed() {
      clearTimeout(timer)
      timer = setTimeout(refresh, 1500)
      // The balance can lag a billed call by a few seconds, so check once more.
      clearTimeout(lagTimer)
      lagTimer = setTimeout(refresh, 15_000)
    },
  }
}

export function useAccount(
  data: Data,
  sessionID: Accessor<string | undefined>,
  source = { fetchAccount, readSettings },
) {
  const starts = sessionStarts.get(data) ?? new Map<string, { start?: number }>()
  sessionStarts.set(data, starts)
  const shared =
    accounts.get(data) ?? createRoot((dispose) => ({ state: createAccountState(source, starts), dispose, users: 0 }))
  accounts.set(data, shared)
  shared.users++
  createEffect(() => {
    const id = sessionID()
    if (!id) return
    untrack(() => shared.state.track(id))
    const steps = createMemo(() =>
      data.session.message
        .list(id)
        .reduce(
          (count, message) =>
            count +
            (message.type === "assistant"
              ? Number(message.time.completed !== undefined) +
                message.content.filter((part) => part.type === "tool" && part.state.status === "completed").length
              : 0),
          0,
        ),
    )
    createEffect(on(steps, shared.state.completed, { defer: true }))
  })
  if (shared.users === 1) shared.state.refresh()
  onCleanup(() => {
    shared.users--
    if (shared.users) return
    shared.dispose()
    accounts.delete(data)
  })
  return {
    ...shared.state,
    spent: createMemo(() => shared.state.spent(sessionID())),
    budget: createMemo(() => shared.state.settings().budget_per_session_usd),
  }
}
