// DataForSEO Agent: shared helpers for the user's settings, request paths and billed cost, used by the
// engine (budget stop, permissions) and the TUI (sidebar), so both read the same values the same way.
import { readFileSync } from "node:fs"
import path from "node:path"
import { Global } from "./global.js"

export type Settings = {
  budget_per_session_usd: number
  ask_above_usd: number
  default_location_code: number
  default_language_code: string
  prefer_mode: "standard" | "live" | "cheapest"
}

export const DEFAULT_SETTINGS: Settings = {
  budget_per_session_usd: 1,
  ask_above_usd: 0,
  default_location_code: 2840,
  default_language_code: "en",
  prefer_mode: "cheapest",
}

export function settingsPath() {
  return path.join(process.env.DATAFORSEO_AGENT_CONFIG_DIR ?? Global.Path.config, "settings.json")
}

/** settings.json with each field checked; a missing or invalid field falls back to its default. */
export function readSettings(): Settings {
  const raw = parse(settingsPath())
  const positive = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
  return {
    // The budget must be above 0: a 0 budget would block nothing billed before the first response.
    budget_per_session_usd: positive(raw.budget_per_session_usd, DEFAULT_SETTINGS.budget_per_session_usd),
    ask_above_usd:
      typeof raw.ask_above_usd === "number" && raw.ask_above_usd >= 0
        ? raw.ask_above_usd
        : DEFAULT_SETTINGS.ask_above_usd,
    default_location_code: Number.isInteger(raw.default_location_code)
      ? (raw.default_location_code as number)
      : DEFAULT_SETTINGS.default_location_code,
    default_language_code:
      typeof raw.default_language_code === "string" && raw.default_language_code !== ""
        ? raw.default_language_code
        : DEFAULT_SETTINGS.default_language_code,
    prefer_mode:
      raw.prefer_mode === "standard" || raw.prefer_mode === "live" || raw.prefer_mode === "cheapest"
        ? raw.prefer_mode
        : DEFAULT_SETTINGS.prefer_mode,
  }
}

function parse(file: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(readFileSync(file, "utf8"))
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * A DataForSEO API path as the permission resource: `/v3/...` with only letters, digits, `_`, `-` and `/`.
 * Anything else (query strings, globs, `..`) is refused, so a crafted path can never match a free-endpoint rule.
 */
export function requestPath(value: unknown) {
  if (typeof value !== "string") return undefined
  const clean = value.trim().replace(/^\/+/, "").replace(/\/+$/, "")
  if (!/^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/.test(clean)) return undefined
  // Models send the same endpoint as "/v3/serp/...", "v3/serp/..." or "/serp/...": one canonical form.
  return "/" + (clean.startsWith("v3/") ? clean : "v3/" + clean)
}

/** The request tool's target as a raw path: `url` (which the server prefers) must point at the DataForSEO API. */
export function requestTarget(input: Record<string, unknown>) {
  if (input.url === undefined) return input.path
  if (typeof input.url !== "string") return undefined
  try {
    const url = new URL(input.url)
    return url.protocol === "https:" && url.hostname === "api.dataforseo.com" && url.search === ""
      ? url.pathname
      : undefined
  } catch {
    return undefined
  }
}

/** Shown when a shell command tries to reach the live API directly. */
export const PAID_API_SHELL_REFUSAL =
  "Not run: this command calls api.dataforseo.com directly, which skips the price prompt and the spend record. Send the request with the DataForSEO request tool instead."

/**
 * True when shell text names the live DataForSEO API host. Only the request tool may call it, because that
 * is where the price is shown and the spend is recorded. The free sandbox host is not matched.
 */
export function reachesPaidApi(command: string) {
  return /(^|[^A-Za-z0-9.-])api\.dataforseo\.com(?![A-Za-z0-9-])/i.test(command)
}

/** Billed USD for one DataForSEO response: the top-level `cost`, else the sum of `tasks[].cost`. */
export function reportedCost(response: unknown): number | undefined {
  if (!response || typeof response !== "object") return undefined
  const body = response as { cost?: unknown; tasks?: unknown }
  if (typeof body.cost === "number" && Number.isFinite(body.cost)) return Math.max(0, body.cost)
  if (!Array.isArray(body.tasks)) return undefined
  if (!body.tasks.some((task) => typeof task?.cost === "number" && Number.isFinite(task.cost))) return undefined
  return body.tasks.reduce<number>((sum, task) => {
    const cost = (task as { cost?: unknown } | null)?.cost
    return typeof cost === "number" && Number.isFinite(cost) ? sum + Math.max(0, cost) : sum
  }, 0)
}

/** Backward compatible total for display; accounting uses reportedCost to distinguish unknown from zero. */
export function billedCost(response: unknown): number {
  return reportedCost(response) ?? 0
}

/** The account from the free /v3/appendix/user_data endpoint: balance, today's spend and the daily limit. */
export type Account = { balance: number; today: number; dayLimit?: number; login?: string }

export function credentials() {
  const login = process.env.DATAFORSEO_LOGIN ?? process.env.DATAFORSEO_USERNAME
  const password = process.env.DATAFORSEO_PASSWORD
  return login && password ? { login, password } : undefined
}

export async function fetchAccount(): Promise<Account> {
  const creds = credentials()
  if (!creds) throw new Error("no credentials")
  const res = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
    headers: { Authorization: "Basic " + Buffer.from(`${creds.login}:${creds.password}`).toString("base64") },
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await res.json()) as {
    status_code?: number
    status_message?: string
    tasks?: {
      result?: {
        login?: string
        money?: { balance?: number; limits?: { day?: { total?: number } }; statistics?: { day?: { total?: number } } }
      }[]
    }[]
  }
  const money = body.tasks?.[0]?.result?.[0]?.money
  if (body.status_code !== 20000 || !money || typeof money.balance !== "number")
    throw new Error(body.status_message ?? `HTTP ${res.status}`)
  return {
    balance: money.balance,
    today: money.statistics?.day?.total ?? 0,
    dayLimit: money.limits?.day?.total,
    login: body.tasks?.[0]?.result?.[0]?.login,
  }
}

export type ListPrice = {
  unit: string
  usd: number
  price?: string
  per?: string
  priority_usd?: number
  priority_price?: string
}

/** The catalog list price for a canonical `/v3/...` path, from `prices.json` (written by tools/bridge.py). */
export function listPrice(endpoint: string): ListPrice | undefined {
  const prices = parse(path.join(path.dirname(settingsPath()), "prices.json"))
  const pick = (value: unknown) => {
    if (!value || typeof value !== "object") return undefined
    const entry = value as Record<string, unknown>
    if (typeof entry.unit !== "string" || typeof entry.usd !== "number") return undefined
    return {
      unit: entry.unit,
      usd: entry.usd,
      price: typeof entry.price === "string" ? entry.price : undefined,
      per: typeof entry.per === "string" ? entry.per : undefined,
      priority_usd: typeof entry.priority_usd === "number" ? entry.priority_usd : undefined,
      priority_price: typeof entry.priority_price === "string" ? entry.priority_price : undefined,
    }
  }
  if (endpoint in prices) return pick(prices[endpoint])
  // Paths with a placeholder, such as /v3/serp/google/organic/task_get/advanced/{id}.
  const parts = endpoint.split("/")
  for (const [key, value] of Object.entries(prices)) {
    const pattern = key.split("/")
    if (pattern.length === parts.length && pattern.every((p, i) => p === parts[i] || /^\{.+\}$/.test(p)))
      return pick(value)
  }
  return undefined
}

// Per-task extras (an LLM advance payment) are charged on every task, so they count toward the minimum.
function minimumPerTask(entry: ListPrice) {
  if ((entry.unit === "per_task" || entry.unit === "per_request") && entry.price)
    return [...entry.price.matchAll(/\$([0-9.]+)/g)].reduce((sum, m) => sum + Number(m[1]), 0) || entry.usd
  return entry.usd
}

/** Tasks in a request body (each array item is one billed task) and whether any asks for the priority queue. */
export function requestShape(input: Record<string, unknown>) {
  const body = input.data ?? input.params ?? input.body
  const items = Array.isArray(body) ? body : body === undefined ? [] : [body]
  const priority = items.some(
    (item) => !!item && typeof item === "object" && (item as { priority?: unknown }).priority === 2,
  )
  return { tasks: Array.isArray(body) ? body.length : body === undefined ? 0 : 1, priority }
}

/** The catalog entry, switched to the priority queue price when the request asks for it and one is listed. */
function tierFor(endpoint: string, priority: boolean) {
  const entry = listPrice(endpoint)
  if (!entry || !priority || entry.priority_usd === undefined) return entry
  const per = `${entry.per ?? entry.unit.replace(/_/g, " ")}, priority queue`
  return { ...entry, usd: entry.priority_usd, price: entry.priority_price ?? entry.price, per }
}

/** The least a request can cost by the catalog: 0 for free or unknown endpoints. */
export function minimumCost(endpoint: string, tasks: number, priority = false) {
  const entry = tierFor(endpoint, priority)
  if (!entry || entry.unit === "free") return 0
  return minimumPerTask(entry) * Math.max(1, tasks)
}

/** One line for the request prompt: the list price and, when billing is per task, the total for this request. */
export function priceLine(endpoint: string, tasks: number, priority = false) {
  const entry = tierFor(endpoint, priority)
  if (!entry) return "Price unknown: this endpoint is not in the catalog."
  if (entry.unit === "free") return "Free endpoint (catalog list price $0)."
  const count = Math.max(tasks, 1)
  const usd = (value: number) => "$" + Number(value.toPrecision(4)).toString()
  const per = entry.per ? entry.per.charAt(0).toLowerCase() + entry.per.slice(1) : entry.unit.replace(/_/g, " ")
  // A flat per-task price gives an exact total; anything else ("$0.0002 + $0.01 advance payment", per row, per
  // result) gives the catalog text and a minimum.
  const flat =
    (entry.unit === "per_task" || entry.unit === "per_request") && (!entry.price || entry.price === usd(entry.usd))
  if (flat)
    return `List price ${usd(entry.usd)} ${per}${count > 1 ? `, ${usd(entry.usd * count)} for ${count} tasks` : ""}.`
  const perTask = minimumPerTask(entry)
  const minimum =
    count > 1 || perTask !== entry.usd
      ? `, at least ${usd(perTask * count)}${count > 1 ? ` for ${count} tasks` : ""}`
      : ""
  return `List price ${entry.price ?? usd(entry.usd)} ${per}${minimum}. The bill depends on the results.`
}
