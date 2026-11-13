import { expect, jest, test } from "bun:test"
import type { SessionMessageAssistant } from "@dataforseo-agent/client"
import { createRoot, createSignal } from "solid-js"
import { readSettings, type Account } from "@dataforseo-agent/util/dataforseo"
import { budgetUsage, createAccountState, useAccount, usd } from "../src/feature-plugins/sidebar/account"

const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

test("budget bars fill the available columns and keep the warning thresholds", () => {
  for (const width of [18, 32, 46]) {
    const bar = budgetUsage(0.75, 1, width)
    expect(bar.filled.length + bar.empty.length + bar.label.length).toBe(width)
    expect(bar.label).toBe(" 75% used")
  }
  expect(budgetUsage(0.749, 1).status).toBe("success")
  expect(budgetUsage(0.75, 1).status).toBe("warning")
  expect(budgetUsage(1, 1).status).toBe("error")
  expect(budgetUsage(1.2, 1, 32).empty).toBe("")
  expect(budgetUsage(0, 0, 32).label).toBe(" 0% used")
  expect(budgetUsage(0, 1, 0).filled).toBe("")
})

test("account amounts preserve small spends", () => {
  expect(usd(0)).toBe("$0.00")
  expect(usd(0.00015)).toBe("$0.00015")
  expect(usd(0.012)).toBe("$0.012")
  expect(usd(48.2)).toBe("$48.20")
})

test("panel and footer share requests and keep the account alive when one unmounts", async () => {
  const pending = Promise.withResolvers<Account>()
  let calls = 0
  const source = {
    readSettings,
    fetchAccount: () => {
      calls++
      return pending.promise
    },
  }
  const data = { session: { message: { list: () => [] } } }
  const panel = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  const footer = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  try {
    expect(calls).toBe(1)
    pending.resolve({ balance: 48.2, today: 0.5 })
    await flush()
    expect(panel.account.account()).toEqual(footer.account.account())
    panel.dispose()
    expect(footer.account.account()?.balance).toBe(48.2)
    footer.account.refresh()
    await flush()
    expect(calls).toBe(2)
  } finally {
    panel.dispose()
    footer.dispose()
  }
})

test("refresh coalesces completed calls, retries rate limits, and cancels timers on disposal", async () => {
  jest.useFakeTimers()
  let calls = 0
  const scope = createRoot((dispose) => ({
    dispose,
    state: createAccountState({
      readSettings,
      fetchAccount: async () => {
        calls++
        if (calls === 1) throw new Error("rate limit")
        return { balance: calls === 2 ? 50 : 49.25, today: 0.75 }
      },
    }),
  }))
  try {
    scope.state.track("session")
    scope.state.refresh()
    await flush()
    expect(scope.state.error()).toBe("rate limit")
    jest.advanceTimersByTime(10_000)
    await flush()
    expect(calls).toBe(2)
    scope.state.completed()
    scope.state.completed()
    jest.advanceTimersByTime(1500)
    await flush()
    expect(calls).toBe(3)
    expect(scope.state.spent("session")).toBe(0.75)
    scope.dispose()
    jest.advanceTimersByTime(30_000)
    await flush()
    expect(calls).toBe(3)
  } finally {
    scope.dispose()
    jest.useRealTimers()
  }
})

test("missing credentials leave no readout and do not schedule retries", async () => {
  jest.useFakeTimers()
  let calls = 0
  const scope = createRoot((dispose) => ({
    dispose,
    state: createAccountState({
      readSettings,
      fetchAccount: async () => {
        calls++
        throw new Error("no credentials")
      },
    }),
  }))
  try {
    scope.state.refresh()
    await flush()
    jest.advanceTimersByTime(60_000)
    expect(calls).toBe(1)
    expect(scope.state.account()).toBeUndefined()
  } finally {
    scope.dispose()
    jest.useRealTimers()
  }
})

test("a pending refresh runs once more after settlement", async () => {
  const pending = Promise.withResolvers<Account>()
  let calls = 0
  const scope = createRoot((dispose) => ({
    dispose,
    state: createAccountState({
      readSettings,
      fetchAccount: () => {
        calls++
        return calls === 1 ? pending.promise : Promise.resolve({ balance: 49, today: 1 })
      },
    }),
  }))
  try {
    scope.state.track("session")
    scope.state.refresh()
    scope.state.refresh()
    scope.state.refresh()
    expect(calls).toBe(1)
    pending.resolve({ balance: 50, today: 0 })
    await flush()
    expect(calls).toBe(2)
    expect(scope.state.spent("session")).toBe(1)
  } finally {
    scope.dispose()
  }
})

test("returning to a session keeps its original balance baseline", async () => {
  let balance = 50
  const data = { session: { message: { list: () => [] } } }
  const source = { readSettings, fetchAccount: async () => ({ balance, today: 0 }) }
  const first = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  await flush()
  first.dispose()
  balance = 49.5
  const second = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  try {
    await flush()
    expect(second.account.spent()).toBe(0.5)
  } finally {
    second.dispose()
  }
})

test("completed steps schedule one shared refresh and one lag check", async () => {
  jest.useFakeTimers()
  let calls = 0
  const [messages, setMessages] = createSignal<SessionMessageAssistant[]>([])
  const data = { session: { message: { list: messages } } }
  const source = {
    readSettings,
    fetchAccount: async () => {
      calls++
      return { balance: 50, today: 0 }
    },
  }
  const panel = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  const footer = createRoot((dispose) => ({ dispose, account: useAccount(data, () => "session", source) }))
  try {
    await flush()
    expect(calls).toBe(1)
    setMessages([
      {
        type: "assistant",
        id: "step",
        agent: "general",
        model: { providerID: "demo", id: "test" },
        content: [],
        time: { created: 1, completed: 2 },
      },
    ])
    await flush()
    jest.advanceTimersByTime(1500)
    await flush()
    expect(calls).toBe(2)
    jest.advanceTimersByTime(13_500)
    await flush()
    expect(calls).toBe(3)
  } finally {
    panel.dispose()
    footer.dispose()
    jest.useRealTimers()
  }
})
