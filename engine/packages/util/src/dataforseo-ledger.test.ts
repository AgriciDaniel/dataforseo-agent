import { afterAll, describe, expect, test } from "bun:test"
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { DataForSEOLedger, paidRequestID } from "./dataforseo-ledger.js"

const directory = await mkdtemp(path.join(tmpdir(), "dfa-ledger-"))
afterAll(() => rm(directory, { recursive: true, force: true }))
const input = (session: string, id = "call", estimated = 0.6) => ({
  session,
  id,
  estimated,
  endpoint: "/v3/test/live",
  tasks: 1,
  budget: 1,
})
const ledger = new DataForSEOLedger(directory)

async function child(source: string) {
  const proc = Bun.spawn(
    [
      process.execPath,
      "-e",
      `import { DataForSEOLedger } from ${JSON.stringify(path.join(import.meta.dir, "dataforseo-ledger.ts"))}; const ledger = new DataForSEOLedger(${JSON.stringify(directory)}); ${source}`,
    ],
    {
      env: { PATH: process.env.PATH },
      stdout: "pipe",
      stderr: "pipe",
    },
  )
  const [code, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  if (code !== 0) throw new Error(stderr)
  return stdout.trim()
}

describe("durable session budget", () => {
  test("settled spend survives a process restart and uses billed cost", async () => {
    await child(
      `await ledger.reserve(${JSON.stringify(input("restart"))}); await ledger.sent("restart", "call"); await ledger.finish("restart", "call", {ok: true}, 0.8, false)`,
    )
    const restarted = new DataForSEOLedger(directory)
    await restarted.recover()
    expect(await restarted.read("restart", 1)).toEqual({ spent: 0.8, reserved: 0, uncertain: 0, budget: 1 })
    expect((await restarted.reserve(input("restart", "next", 0.3))).kind).toBe("budget")
  })

  test("two concurrent processes cannot both reserve beyond the shared budget", async () => {
    const source = (id: string) =>
      `const result = await ledger.reserve(${JSON.stringify(input("parallel", id))}); console.log(result.kind); if(result.kind === "reserved") { await ledger.sent("parallel", ${JSON.stringify(id)}); await ledger.finish("parallel", ${JSON.stringify(id)}, {ok: true}, 0.6, false); }`
    expect((await Promise.all([child(source("a")), child(source("b"))])).sort()).toEqual(["budget", "reserved"])
    expect((await ledger.read("parallel", 1)).spent).toBe(0.6)
  })

  test("writer lock is held until its process dies and then releases immediately", async () => {
    const source = `import { Database } from "bun:sqlite";
      const db = new Database(${JSON.stringify(path.join(directory, "dataforseo-budget", "writer.sqlite"))});
      db.exec("BEGIN IMMEDIATE"); console.log("locked"); await Bun.sleep(30000)`
    const proc = Bun.spawn([process.execPath, "-e", source], {
      env: { PATH: process.env.PATH },
      stdout: "pipe",
      stderr: "pipe",
    })
    const reader = proc.stdout.getReader()
    try {
      const ready = await reader.read()
      expect(new TextDecoder().decode(ready.value)).toContain("locked")
      let acquired = false
      const pending = ledger.reserve(input("lock-crash")).then((result) => {
        acquired = true
        return result
      })
      await Bun.sleep(30)
      expect(acquired).toBe(false)
      proc.kill("SIGKILL")
      await proc.exited
      expect((await pending).kind).toBe("reserved")
    } finally {
      proc.kill()
      await proc.exited
      reader.releaseLock()
    }
  })

  test("same-process concurrent callers also share one reservation limit", async () => {
    const results = await Promise.all([ledger.reserve(input("local", "a")), ledger.reserve(input("local", "b"))])
    expect(results.map((item) => item.kind).sort()).toEqual(["budget", "reserved"])
    expect((await ledger.read("local", 1)).reserved).toBe(0.6)
  })

  test("a sent call becomes uncertain after restart and still counts", async () => {
    await child(`await ledger.reserve(${JSON.stringify(input("sent"))}); await ledger.sent("sent", "call")`)
    await ledger.recover()
    expect(await ledger.read("sent", 1)).toEqual({ spent: 0, reserved: 0, uncertain: 0.6, budget: 1 })
    expect((await ledger.reserve(input("sent", "next"))).kind).toBe("budget")
    expect((await ledger.reserve(input("sent"))).kind).toBe("uncertain")
  })

  test("a dead process's unsent reservation is released, a live process's is kept", async () => {
    await child(`await ledger.reserve(${JSON.stringify(input("unsent"))})`)
    expect((await ledger.read("unsent", 1)).reserved).toBe(0)
    expect((await ledger.reserve(input("unsent"))).kind).toBe("reserved")
    await new DataForSEOLedger(directory).recover()
    expect((await ledger.read("unsent", 1)).reserved).toBe(0.6)
  })

  test("repeated call IDs replay stored outcomes and never acquire a second send", async () => {
    let sent = 0
    const invoke = async () => {
      const result = await ledger.reserve(input("replay"))
      if (result.kind !== "reserved") return result
      await ledger.sent("replay", "call")
      sent++
      await ledger.finish("replay", "call", { answer: 42 }, 0.6, false)
      return result
    }
    await invoke()
    expect(await invoke()).toEqual({ kind: "replay", outcome: { answer: 42 } })
    expect(sent).toBe(1)
    expect((await ledger.read("replay", 1)).spent).toBe(0.6)
  })

  test("a concurrent duplicate of a sent call is blocked, but the original can still settle", async () => {
    await ledger.reserve(input("inflight"))
    await ledger.sent("inflight", "call")
    expect((await ledger.reserve(input("inflight"))).kind).toBe("uncertain")
    await ledger.finish("inflight", "call", { ok: true }, 0.2, false)
    expect((await ledger.read("inflight", 1)).spent).toBe(0.2)
  })

  test("known zero-cost failure releases its reservation and replays the error", async () => {
    await ledger.reserve(input("failed"))
    await ledger.sent("failed", "call")
    await ledger.finish("failed", "call", { error: "invalid request" }, 0, true)
    expect(await ledger.read("failed", 1)).toEqual({ spent: 0, reserved: 0, uncertain: 0, budget: 1 })
    expect((await ledger.reserve(input("failed"))).kind).toBe("replay")
  })

  test("transport failure retains the estimate; partial error billing is counted", async () => {
    await ledger.reserve(input("unknown"))
    await ledger.sent("unknown", "call")
    await ledger.abandon("unknown", "call")
    expect((await ledger.read("unknown", 1)).uncertain).toBe(0.6)
    await ledger.reserve(input("partial"))
    await ledger.sent("partial", "call")
    await ledger.finish("partial", "call", { error: "some tasks failed" }, 0.3, true)
    expect((await ledger.read("partial", 1)).spent).toBe(0.3)
  })

  test("unknown success uses the estimate, explicit zero uses zero", async () => {
    for (const [session, billed] of [
      ["estimate", undefined],
      ["zero", 0],
    ] as const) {
      await ledger.reserve(input(session))
      await ledger.sent(session, "call")
      await ledger.finish(session, "call", { ok: true }, billed, false)
    }
    expect((await ledger.read("estimate", 1)).spent).toBe(0.6)
    expect((await ledger.read("zero", 1)).spent).toBe(0)
  })

  test("balance backstop and changed budgets survive reload", async () => {
    await ledger.reserve({ ...input("balance"), balance: 10 })
    await ledger.abandon("balance", "call")
    expect((await ledger.reserve({ ...input("balance", "next"), balance: 9.3 })).kind).toBe("budget")
    expect(await new DataForSEOLedger(directory).read("balance", 2)).toEqual({
      spent: 0.7,
      reserved: 0,
      uncertain: 0,
      budget: 2,
    })
  })

  test("corrupt ledgers fail closed instead of silently refilling the budget", async () => {
    const isolated = await mkdtemp(path.join(directory, "corrupt-"))
    const broken = new DataForSEOLedger(isolated)
    await broken.reserve(input("corrupt"))
    const file = (await readdir(path.join(isolated, "dataforseo-budget"))).find((file) => file.endsWith(".json"))!
    await writeFile(path.join(isolated, "dataforseo-budget", file), "{}")
    await expect(broken.reserve(input("corrupt", "next"))).rejects.toThrow()
    expect(await readFile(path.join(isolated, "dataforseo-budget", file), "utf8")).toBe("{}")
  })

  test("decimal boundaries fit exactly and tiny reservations still count", async () => {
    expect((await ledger.reserve({ ...input("decimal", "first", 0.1), budget: 0.3 })).kind).toBe("reserved")
    expect((await ledger.reserve({ ...input("decimal", "second", 0.2), budget: 0.3 })).kind).toBe("reserved")
    expect((await ledger.read("decimal", 0.3)).reserved).toBe(0.3)
    expect((await ledger.reserve({ ...input("tiny", "first", 1e-15), budget: 1e-15 })).kind).toBe("reserved")
    expect((await ledger.read("tiny", 1e-15)).reserved).toBe(1e-15)
    expect((await ledger.reserve({ ...input("tiny", "second", 1e-15), budget: 1e-15 })).kind).toBe("budget")
  })

  test("request identity is stable for object key order and distinguishes method, body and child", () => {
    const first = paidRequestID("root", "child", "call", { path: "/v3/a", data: [{ a: 1, b: 2 }] })
    expect(paidRequestID("root", "child", "call", { data: [{ b: 2, a: 1 }], path: "/v3/a", method: "post" })).toBe(
      first,
    )
    for (const request of [{ path: "/v3/b" }, { path: "/v3/a", method: "GET" }, { path: "/v3/a", data: [{ a: 2 }] }])
      expect(paidRequestID("root", "child", "call", request)).not.toBe(first)
    expect(paidRequestID("root", "other", "call", { path: "/v3/a", data: [{ a: 1, b: 2 }] })).not.toBe(first)
  })
})
