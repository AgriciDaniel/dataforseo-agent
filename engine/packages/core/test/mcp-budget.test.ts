import { afterAll, expect, spyOn, test } from "bun:test"
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { AppNodeBuilder } from "@dataforseo-agent/core/effect/app-node-builder"
import { Bus } from "@dataforseo-agent/core/bus"
import { Image } from "@dataforseo-agent/core/image"
import { Mcp } from "@dataforseo-agent/core/mcp/index"
import { Permission } from "@dataforseo-agent/core/permission"
import { SessionStore } from "@dataforseo-agent/core/session/store"
import { Tool } from "@dataforseo-agent/core/tool"
import { McpTool } from "@dataforseo-agent/core/tool/mcp"
import { Session } from "@dataforseo-agent/schema/session"
import { DataForSEOLedger } from "@dataforseo-agent/util/dataforseo-ledger"
import { Global } from "@dataforseo-agent/util/global"
import { LayerNode } from "@dataforseo-agent/util/effect/layer-node"
import { Deferred, Effect, Fiber, Layer, Schema, Stream } from "effect"
import { testEffect } from "./lib/effect"
import { imagePassthrough } from "./lib/image"
import { executeTool, toolIdentity } from "./lib/tool"

// Replace the account boundary before executing paid tools. No credential or API access is permitted.
const helpers = await import("@dataforseo-agent/util/dataforseo")
const credential = spyOn(helpers, "credentials").mockReturnValue(undefined)
const account = spyOn(helpers, "fetchAccount").mockImplementation(() => {
  throw new Error("Account access forbidden")
})
const directory = await mkdtemp(path.join(tmpdir(), "dfa-mcp-budget-"))
const config = path.join(directory, "config")
await mkdir(config)
await writeFile(path.join(config, "settings.json"), JSON.stringify({ budget_per_session_usd: 1 }))
await writeFile(
  path.join(config, "prices.json"),
  JSON.stringify({
    "/v3/test/live": { unit: "per_task", usd: 0.6 },
    "/v3/test/free": { unit: "free", usd: 0 },
  }),
)
const previous = process.env.DATAFORSEO_AGENT_CONFIG_DIR
process.env.DATAFORSEO_AGENT_CONFIG_DIR = config
afterAll(async () => {
  credential.mockRestore()
  account.mockRestore()
  if (previous === undefined) delete process.env.DATAFORSEO_AGENT_CONFIG_DIR
  else process.env.DATAFORSEO_AGENT_CONFIG_DIR = previous
  await rm(directory, { recursive: true, force: true })
})
const ledger = new DataForSEOLedger(directory)
let calls = 0
let invoke: () => Effect.Effect<Mcp.ToolResult, Mcp.ToolCallError> = () =>
  Effect.succeed({ isError: false, structured: { cost: 0.6, answer: 42 }, content: [] })
const assertions: Permission.AssertInput[] = []
const it = testEffect(
  AppNodeBuilder.build(LayerNode.group([Tool.node, McpTool.node]), [
    Mcp.node.replace(
      Layer.mock(Mcp.Service, {
        awaitStartup: () => Effect.void,
        tools: () =>
          Effect.succeed(
            ["dataforseo", "sandbox"].map((server) => ({
              server: Mcp.ServerName.make(server),
              name: "api_request",
              codemode: false,
              inputSchema: { type: "object", additionalProperties: true },
            })),
          ),
        callTool: () =>
          Effect.suspend(() => {
            calls++
            return invoke()
          }),
      }),
    ),
    Permission.node.replace(
      Layer.mock(Permission.Service, {
        assert: (input) =>
          Effect.sync(() => {
            assertions.push(input)
          }),
      }),
    ),
    SessionStore.node.replace(
      Layer.mock(SessionStore.Service, {
        get: (id) =>
          Effect.succeed(
            Schema.decodeUnknownSync(Session.Info)({
              id,
              ...(id.startsWith("ses_child-") ? { parentID: "ses_parent" } : {}),
              projectID: "global",
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
              time: { created: 0, updated: 0 },
              location: { directory },
            }),
          ),
      }),
    ),
    Bus.node.replace(Layer.mock(Bus.Service, { subscribe: () => Stream.never })),
    Image.node.replace(imagePassthrough),
    Global.node.replace(Global.layerWith({ state: directory, data: directory })),
  ]),
)
const run = (
  registry: Tool.Interface,
  session: string,
  id = "call",
  input: Record<string, unknown> = { path: "/v3/test/live", data: [{}] },
  server = "dataforseo",
) =>
  executeTool(registry, {
    ...toolIdentity,
    sessionID: Session.ID.make(`ses_${session}`),
    call: { type: "tool-call", id, name: `${server}_api_request`, input },
  })

it.live("paid gate replays a repeated call ID without sending again", () =>
  Effect.gen(function* () {
    calls = 0
    invoke = () => Effect.succeed({ isError: false, structured: { cost: 0.6, answer: 42 }, content: [] })
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    expect((yield* run(registry, "replay")).status).toBe("completed")
    expect((yield* run(registry, "replay")).output).toEqual({ cost: 0.6, answer: 42 })
    expect(calls).toBe(1)
    expect((yield* Effect.promise(() => ledger.read("ses_replay", 1))).spent).toBe(0.6)
    expect(assertions.at(-1)).toMatchObject({
      resources: ["/v3/test/live"],
      save: ["/v3/test/live"],
      metadata: { input: { path: "/v3/test/live", data: [{}] } },
    })
  }),
)

it.live("parallel children share their root budget and exactly one is dispatched", () =>
  Effect.gen(function* () {
    calls = 0
    const entered = yield* Deferred.make<void>()
    const release = yield* Deferred.make<void>()
    invoke = () =>
      Deferred.succeed(entered, undefined).pipe(
        Effect.andThen(Deferred.await(release)),
        Effect.as({ isError: false, structured: { cost: 0.6 }, content: [] }),
      )
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    const first = yield* run(registry, "child-a").pipe(Effect.forkChild)
    yield* Deferred.await(entered)
    expect(yield* run(registry, "child-b")).toMatchObject({
      status: "error",
      error: { message: expect.stringMatching(/^Session budget would be exceeded/) },
    })
    yield* Deferred.succeed(release, undefined)
    expect((yield* Fiber.join(first)).status).toBe("completed")
    expect(calls).toBe(1)
    expect((yield* Effect.promise(() => ledger.read("ses_parent", 1))).spent).toBe(0.6)
    expect(yield* registration.readBudget(Session.ID.make("ses_child-b"))).toEqual({
      spent: 0.6,
      reserved: 0,
      budget: 1,
      uncertain: 0,
    })
  }),
)

it.live("known zero-cost failures release their reservations", () =>
  Effect.gen(function* () {
    invoke = () =>
      Effect.succeed({ isError: true, structured: { cost: 0 }, content: [{ type: "text", text: "Invalid task" }] })
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    expect((yield* run(registry, "failed")).status).toBe("error")
    expect(yield* Effect.promise(() => ledger.read("ses_failed", 1))).toEqual({
      spent: 0,
      reserved: 0,
      uncertain: 0,
      budget: 1,
    })
  }),
)

it.live("unknown transport outcomes become uncertain and cannot be retried", () =>
  Effect.gen(function* () {
    calls = 0
    invoke = () =>
      Effect.fail(
        new Mcp.ToolCallError({
          server: Mcp.ServerName.make("dataforseo"),
          tool: "api_request",
          message: "connection lost",
        }),
      )
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    expect(yield* run(registry, "uncertain")).toMatchObject({
      status: "error",
      error: { message: expect.stringContaining("may already have been billed") },
    })
    expect((yield* run(registry, "uncertain")).status).toBe("error")
    expect(calls).toBe(1)
    expect((yield* Effect.promise(() => ledger.read("ses_uncertain", 1))).uncertain).toBe(0.6)
  }),
)

it.live("interruption after dispatch retains uncertain spend", () =>
  Effect.gen(function* () {
    const entered = yield* Deferred.make<void>()
    invoke = () => Deferred.succeed(entered, undefined).pipe(Effect.andThen(Effect.never))
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    const pending = yield* run(registry, "interrupt").pipe(Effect.forkChild)
    yield* Deferred.await(entered)
    yield* Fiber.interrupt(pending)
    expect((yield* Effect.promise(() => ledger.read("ses_interrupt", 1))).uncertain).toBe(0.6)
  }),
)

it.live("free and sandbox calls never enter paid accounting", () =>
  Effect.gen(function* () {
    calls = 0
    invoke = () => Effect.succeed({ isError: false, structured: { cost: 999 }, content: [] })
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    expect((yield* run(registry, "free", "free", { path: "/v3/test/free" })).status).toBe("completed")
    expect(
      (yield* run(registry, "sandbox", "sandbox", { url: "https://sandbox.dataforseo.com/v3/test/live" }, "sandbox"))
        .status,
    ).toBe("completed")
    expect(
      (yield* run(registry, "sandbox-rejected", "reject", { url: "https://sandbox.dataforseo.com/v3/test/live" }))
        .status,
    ).toBe("error")
    expect(calls).toBe(2)
    for (const session of ["free", "sandbox", "sandbox-rejected"])
      expect(yield* Effect.promise(() => ledger.read(`ses_${session}`, 1))).toEqual({
        spent: 0,
        reserved: 0,
        uncertain: 0,
        budget: 1,
      })
  }),
)

it.live("both budget refusal prefixes survive and settings changes take effect on the next call", () =>
  Effect.gen(function* () {
    invoke = () => Effect.succeed({ isError: false, structured: { cost: 1 }, content: [] })
    const registry = yield* Tool.Service
    const registration = yield* McpTool.Service
    yield* registration.flush
    expect((yield* run(registry, "reached")).status).toBe("completed")
    expect(yield* run(registry, "reached", "second")).toMatchObject({
      status: "error",
      error: { message: expect.stringMatching(/^Session budget reached/) },
    })
    yield* Effect.promise(() =>
      writeFile(path.join(config, "settings.json"), JSON.stringify({ budget_per_session_usd: 2 })),
    )
    expect((yield* run(registry, "reached", "second")).status).toBe("completed")
    yield* Effect.promise(() =>
      writeFile(path.join(config, "settings.json"), JSON.stringify({ budget_per_session_usd: 1 })),
    )
  }),
)

test("a corrupt session fails closed while free endpoints remain usable", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const isolated = path.join(directory, "corrupt")
        const broken = new DataForSEOLedger(isolated)
        yield* Effect.promise(() =>
          broken.reserve({
            session: "ses_corrupt",
            id: "corrupt",
            endpoint: "/v3/test/live",
            tasks: 1,
            estimated: 0.6,
            budget: 1,
          }),
        )
        const files = yield* Effect.promise(() => readdir(path.join(isolated, "dataforseo-budget")))
        yield* Effect.promise(() =>
          writeFile(path.join(isolated, "dataforseo-budget", files.find((file) => file.endsWith(".json"))!), "{}"),
        )
        const layer = AppNodeBuilder.build(LayerNode.group([Tool.node, McpTool.node]), [
          Mcp.node.replace(
            Layer.mock(Mcp.Service, {
              awaitStartup: () => Effect.void,
              tools: () =>
                Effect.succeed([
                  {
                    server: Mcp.ServerName.make("dataforseo"),
                    name: "api_request",
                    codemode: false,
                    inputSchema: { type: "object" },
                  },
                ]),
              callTool: () => Effect.succeed({ isError: false, content: [] }),
            }),
          ),
          Permission.node.replace(Layer.mock(Permission.Service, { assert: () => Effect.void })),
          SessionStore.node.replace(Layer.mock(SessionStore.Service, { get: () => Effect.succeed(undefined) })),
          Bus.node.replace(Layer.mock(Bus.Service, { subscribe: () => Stream.never })),
          Image.node.replace(imagePassthrough),
          Global.node.replace(Global.layerWith({ state: isolated, data: isolated })),
        ])
        yield* Effect.gen(function* () {
          const registry = yield* Tool.Service
          const registration = yield* McpTool.Service
          yield* registration.flush
          expect((yield* run(registry, "corrupt")).status).toBe("error")
          expect((yield* run(registry, "corrupt", "free", { path: "/v3/test/free" })).status).toBe("completed")
        }).pipe(Effect.scoped, Effect.provide(layer))
      }),
    ),
  ))
