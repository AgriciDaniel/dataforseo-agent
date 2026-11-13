import { createHash, randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { mkdir, open, readFile, readdir, rename, unlink } from "node:fs/promises"
import { hostname } from "node:os"
import path from "node:path"
import { Schema } from "effect"
import { Database } from "bun:sqlite"
import { Global } from "./global.js"
import { readSettings } from "./dataforseo.js"

const amount = Schema.Number.check(Schema.isFinite(), Schema.isGreaterThanOrEqualTo(0))
const ownerSchema = Schema.Struct({
  pid: Schema.Number,
  host: Schema.String,
  instance: Schema.String,
  start: Schema.String,
})
const entrySchema = Schema.Struct({
  id: Schema.String,
  endpoint: Schema.String,
  tasks: Schema.Number,
  estimated: amount,
  state: Schema.Literals(["reserved", "sent", "settled", "failed", "uncertain"]),
  owner: ownerSchema,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  sentAt: Schema.optional(Schema.String),
  finishedAt: Schema.optional(Schema.String),
  billed: Schema.optional(amount),
  outcome: Schema.optional(Schema.Unknown),
})
const documentSchema = Schema.Struct({
  version: Schema.Literal(1),
  session: Schema.String,
  entries: Schema.Array(entrySchema),
  startBalance: Schema.optional(amount),
  balanceDrop: amount,
})
type Entry = typeof entrySchema.Type
type Document = typeof documentSchema.Type
export type Budget = { spent: number; reserved: number; budget: number; uncertain: number }
export type Reservation =
  | { kind: "reserved"; entry: Entry }
  | { kind: "replay"; outcome: unknown }
  | { kind: "uncertain" }
  | { kind: "budget"; spent: number }

// Linux start time distinguishes a reused PID. On other hosts a live PID is retained conservatively.
function processStart(pid: number) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
    return stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19]
  } catch {
    return ""
  }
}
const owner = { pid: process.pid, host: hostname(), instance: randomUUID(), start: processStart(process.pid) }
function alive(value: Entry["owner"]) {
  if (value.host !== owner.host) return true
  if (value.pid === owner.pid) return value.instance === owner.instance
  try {
    process.kill(value.pid, 0)
    return !value.start || !processStart(value.pid) || processStart(value.pid) === value.start
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH"
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    )
  return value
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex")

/** Include the child session too: providers can reuse a tool call ID in different subagents. */
export function paidRequestID(root: string, session: string, call: string, request: Record<string, unknown>) {
  return hash(
    JSON.stringify(
      canonical({
        root,
        session,
        call,
        request: { ...request, method: String(request.method ?? "POST").toUpperCase() },
      }),
    ),
  )
}
// Sum decimal USD without binary addition errors or rounding tiny reservations down to zero.
function total(values: number[]) {
  const parts = values.map((value) => {
    const [mantissa, exponent = "0"] = String(value).split("e")
    const [whole, fraction = ""] = mantissa.split(".")
    return { integer: BigInt(whole + fraction), scale: fraction.length - Number(exponent) }
  })
  const scale = Math.max(0, ...parts.map((part) => part.scale))
  const integer = parts.reduce((sum, part) => sum + part.integer * 10n ** BigInt(scale - part.scale), 0n)
  return Number(`${integer}e-${scale}`)
}
function summary(doc: Document, budget: number): Budget {
  const spent = total(
    doc.entries
      .filter((entry) => entry.state === "settled" || entry.state === "failed")
      .map((entry) => entry.billed ?? (entry.state === "settled" ? entry.estimated : 0)),
  )
  return {
    spent: Math.max(spent, total([doc.balanceDrop])),
    reserved: total(
      doc.entries
        .filter((entry) => entry.state === "reserved" || entry.state === "sent")
        .map((entry) => entry.estimated),
    ),
    uncertain: total(
      doc.entries.filter((entry) => entry.state === "uncertain").map((entry) => entry.billed ?? entry.estimated),
    ),
    budget,
  }
}

// A kernel-backed SQLite write lock has no lease to expire while a process is paused, and is released
// automatically on process death. The database only coordinates writers; the ledger remains atomic JSON.
async function withLock<T>(file: string, run: () => Promise<T>) {
  const database = new Database(file)
  const deadline = Date.now() + 30_000
  try {
    while (true) {
      try {
        database.exec("BEGIN IMMEDIATE")
        break
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "SQLITE_BUSY") throw error
        if (Date.now() >= deadline) throw new Error("Timed out waiting for the DataForSEO budget ledger lock")
        // Never block Bun's event loop: the current writer may be another fiber in this process.
        await Bun.sleep(10)
      }
    }
    const value = await run()
    database.exec("COMMIT")
    return value
  } finally {
    database.close()
  }
}

/** JSON files and locks both live below the engine's existing state directory. Corruption fails closed. */
export class DataForSEOLedger {
  private readonly directory: string
  constructor(state = Global.Path.state) {
    this.directory = path.join(state, "dataforseo-budget")
  }

  private async transaction<T>(session: string, run: (doc: Document) => { doc: Document; value: T }) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 })
    return withLock(path.join(this.directory, "writer.sqlite"), async () => {
      const file = path.join(this.directory, `${hash(session)}.json`)
      const raw = await readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return undefined
        throw error
      })
      const loaded =
        raw === undefined
          ? { version: 1 as const, session, entries: [], balanceDrop: 0 }
          : Schema.decodeUnknownSync(Schema.fromJsonString(documentSchema))(raw)
      if (loaded.session !== session) throw new Error("DataForSEO budget ledger session mismatch")
      const now = new Date().toISOString()
      const recovered = {
        ...loaded,
        entries: loaded.entries.map((entry): Entry => {
          if ((entry.state !== "reserved" && entry.state !== "sent") || alive(entry.owner)) return entry
          return { ...entry, state: entry.state === "reserved" ? "failed" : "uncertain", updatedAt: now }
        }),
      }
      const result = run(recovered)
      const temporary = `${file}.${randomUUID()}.tmp`
      try {
        const handle = await open(temporary, "wx", 0o600)
        try {
          await handle.writeFile(JSON.stringify(result.doc))
          await handle.sync()
        } finally {
          await handle.close()
        }
        await rename(temporary, file)
        const directory = await open(this.directory, "r")
        try {
          await directory.sync()
        } finally {
          await directory.close()
        }
      } finally {
        await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error
        })
      }
      return result.value
    })
  }

  /** Startup recovery never releases another live process's reservations. */
  async recover() {
    const files = await readdir(this.directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return []
      throw error
    })
    for (const file of files.filter((file) => /^[a-f0-9]{64}\.json$/.test(file))) {
      const doc = Schema.decodeUnknownSync(Schema.fromJsonString(documentSchema))(
        await readFile(path.join(this.directory, file), "utf8"),
      )
      await this.read(doc.session)
    }
  }

  read(session: string, budget = readSettings().budget_per_session_usd) {
    return this.transaction(session, (doc) => ({ doc, value: summary(doc, budget) }))
  }

  reserve(input: {
    session: string
    id: string
    endpoint: string
    tasks: number
    estimated: number
    budget: number
    balance?: number
  }) {
    if (!Number.isFinite(input.estimated) || input.estimated < 0) throw new Error("Invalid DataForSEO estimate")
    return this.transaction<Reservation>(input.session, (loaded) => {
      const doc =
        input.balance === undefined
          ? loaded
          : {
              ...loaded,
              startBalance: loaded.startBalance ?? input.balance,
              balanceDrop: Math.max(loaded.balanceDrop, total([loaded.startBalance ?? input.balance, -input.balance])),
            }
      const prior = doc.entries.find((entry) => entry.id === input.id)
      if (prior?.outcome !== undefined) return { doc, value: { kind: "replay", outcome: prior.outcome } }
      if (prior && (prior.state !== "failed" || prior.sentAt !== undefined)) {
        const entries = doc.entries.map((entry) =>
          entry.id === prior.id &&
          (entry.state === "sent" ||
            entry.state === "settled" ||
            (entry.state === "failed" && entry.sentAt !== undefined))
            ? { ...entry, state: "uncertain" as const, updatedAt: new Date().toISOString() }
            : entry,
        )
        return { doc: { ...doc, entries }, value: { kind: "uncertain" } }
      }
      const current = summary(doc, input.budget)
      const spent = total([current.spent, current.reserved, current.uncertain])
      if (spent >= input.budget || total([spent, input.estimated]) > input.budget)
        return { doc, value: { kind: "budget", spent } }
      const now = new Date().toISOString()
      const entry: Entry = {
        id: input.id,
        endpoint: input.endpoint,
        tasks: input.tasks,
        estimated: input.estimated,
        state: "reserved",
        owner,
        createdAt: now,
        updatedAt: now,
      }
      return {
        doc: { ...doc, entries: [...doc.entries.filter((item) => item.id !== input.id), entry] },
        value: { kind: "reserved", entry },
      }
    })
  }

  private update(session: string, id: string, run: (entry: Entry) => Entry) {
    return this.transaction(session, (doc) => {
      const entry = doc.entries.find((entry) => entry.id === id)
      if (!entry || entry.owner.instance !== owner.instance)
        throw new Error("DataForSEO reservation is not owned by this process")
      return {
        doc: { ...doc, entries: doc.entries.map((entry) => (entry.id === id ? run(entry) : entry)) },
        value: undefined,
      }
    })
  }

  sent(session: string, id: string) {
    return this.update(session, id, (entry) => {
      if (entry.state !== "reserved") throw new Error("DataForSEO request was already sent")
      const now = new Date().toISOString()
      return { ...entry, state: "sent", updatedAt: now, sentAt: now }
    })
  }

  finish(session: string, id: string, outcome: unknown, billed: number | undefined, failed: boolean) {
    if (billed !== undefined && (!Number.isFinite(billed) || billed < 0))
      throw new Error("Invalid DataForSEO billed cost")
    return this.update(session, id, (entry) => {
      const now = new Date().toISOString()
      // An MCP error alone does not prove the API did not bill. Missing cost stays uncertain.
      const state = failed && billed === undefined ? "uncertain" : failed ? "failed" : "settled"
      return { ...entry, state, outcome, billed, updatedAt: now, finishedAt: now }
    })
  }

  abandon(session: string, id: string) {
    return this.update(session, id, (entry) => {
      if (entry.state !== "reserved" && entry.state !== "sent") return entry
      return {
        ...entry,
        state: entry.state === "reserved" ? "failed" : "uncertain",
        updatedAt: new Date().toISOString(),
      }
    })
  }
}

const ledger = new DataForSEOLedger()
/** Root session totals in USD. Uncertain is separate from spent and reserved, and counts against the budget. */
export const readSessionBudget = (session: string) => ledger.read(session)
