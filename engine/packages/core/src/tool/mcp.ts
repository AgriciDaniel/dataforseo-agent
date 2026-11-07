export * as McpTool from "./mcp.js"

import { ToolFailure } from "@dataforseo-agent/ai/effect"
import { McpEvent } from "@dataforseo-agent/schema/mcp-event"
import { Context, Effect, Fiber, type JsonSchema, Layer, Option, PubSub, Schema, Semaphore, Stream } from "effect"
import { makeLocationNode } from "@dataforseo-agent/util/effect/app-node"
import { extension } from "mime-types"
import { Bus } from "../bus.js"

import { Mcp } from "../mcp/index.js"
import { Mime } from "../mime.js"
import { Permission } from "../permission.js"
import { Tool } from "../tool.js"
import { ToolOutput } from "../tool-output.js"
import { ReadToolFileSystem } from "./read-filesystem.js"
import { billedCost, credentials, fetchAccount, listPrice, minimumCost, readSettings, requestPath, requestShape, requestTarget, type Account } from "@dataforseo-agent/util/dataforseo"
import { SessionStore } from "../session/store.js"
import type { SessionSchema } from "../session/schema.js"
import { effectiveName, normalizedName } from "./runtime.js"

const decodeJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown))

// DataForSEO Agent: the session budget in settings.json is a hard stop on billed DataForSEO cost, kept per
// top-level session so subagents (each in its own child session) share their parent's budget.
// Each paid call adds its billed `cost`, or, when the MCP server's AI format drops it, the catalog list price
// for its tasks. As a backstop, the drop in account balance since the session's first paid call also counts
// (it includes anything else billed meanwhile); the larger number wins, so the stop errs toward stopping.
// If the balance can't be read (user_data is rate limited), the last reading stands. Free endpoints skip all of
// this, so fetching a result already paid for always works. It lives in memory: a restart starts over.
const sessionSpend = new Map<string, number>()
const startBalance = new Map<string, number>()
const lastDrop = new Map<string, number>()
let cachedAccount: { at: number; value: Promise<Account | undefined> } | undefined

/** One shared balance reading for up to 10 s, so bursts of calls don't trip the user_data rate limit. */
function account() {
  if (!cachedAccount || Date.now() - cachedAccount.at > 10_000)
    cachedAccount = { at: Date.now(), value: fetchAccount().catch(() => undefined) }
  return cachedAccount.value
}

async function balanceSpend(root: string) {
  if (!credentials()) return lastDrop.get(root) ?? 0
  const current = await account()
  if (!current) return lastDrop.get(root) ?? 0
  const start = startBalance.get(root)
  if (start === undefined) {
    startBalance.set(root, current.balance)
    return 0
  }
  const drop = Math.max(0, start - current.balance)
  lastDrop.set(root, drop)
  return drop
}

/** The catalog minimum for this request's tasks, used when the response doesn't report its cost. */
function estimate(endpoint: string, input: Record<string, unknown>) {
  const shape = requestShape(input)
  return minimumCost(endpoint, shape.tasks, shape.priority)
}

// Enough digits that a tiny budget or spend never shows as $0.00.
const money = (value: number) => (value >= 0.01 ? value.toFixed(2) : String(Number(value.toPrecision(2))))
const DATAFORSEO_SERVER = "dataforseo"

/**
 * Registry namespace and permission action names for MCP tools.
 */
export const namespace = (server: string) => normalizedName({ name: server })
export const name = (server: string, tool: string) =>
  effectiveName({ name: tool, options: { namespace: namespace(server) } })

export interface Interface {
  /**
   * Wait for the initial MCP tool registration, give servers still connecting a bounded chance to
   * finish, then bring the registry up to date without waiting for the debounced reload.
   */
  readonly flush: Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@dataforseo-agent/McpTool") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const mcp = yield* Mcp.Service
    const tools = yield* Tool.Service
    const bus = yield* Bus.Service
    const permission = yield* Permission.Service
    const toolOutput = yield* ToolOutput.Service
    const sessions = yield* SessionStore.Service
    // The top-level session above a subagent's child session. Parents never change, so cache them.
    const roots = new Map<SessionSchema.ID, SessionSchema.ID>()
    const rootSession = Effect.fnUntraced(function* (sessionID: SessionSchema.ID) {
      const known = roots.get(sessionID)
      if (known) return known
      const seen = new Set<SessionSchema.ID>()
      let current = sessionID
      while (!seen.has(current)) {
        seen.add(current)
        const parentID = (yield* sessions.get(current))?.parentID
        if (!parentID) break
        current = parentID
      }
      roots.set(sessionID, current)
      return current
    })
    const lock = Semaphore.makeUnsafe(1)
    let discovered: Mcp.Tool[] = []

    // Register once after initial discovery; only subsequent updates need a debounced reload.
    const initial = yield* lock
      .withPermit(
        Effect.gen(function* () {
          discovered = yield* mcp.tools()
          yield* tools.transform((editor) => {
            for (const tool of discovered) {
              editor.add({
                name: tool.name,
                options: { namespace: namespace(tool.server), codemode: tool.codemode !== false },
                description: tool.description ?? "",
                input: tool.inputSchema as JsonSchema.JsonSchema,
                output: (tool.outputSchema ?? {}) as JsonSchema.JsonSchema,
                execute: (input, context) =>
                  Effect.gen(function* () {
                    // DataForSEO Agent: the DataForSEO request tool is checked per endpoint path, so config can let
                    // free endpoints through and make paid ones ask, and "Always allow" saves only that one path.
                    // Other MCP tools keep the usual per-tool permission.
                    const args = (input ?? {}) as Record<string, unknown>
                    const dataforseoCall = tool.server === DATAFORSEO_SERVER && /api_request$/.test(tool.name)
                    const rawPath = dataforseoCall ? requestTarget(args) : undefined
                    const endpoint = dataforseoCall ? requestPath(rawPath) : undefined
                    if (dataforseoCall && !endpoint)
                      return yield* new ToolFailure({
                        message:
                          rawPath === undefined
                            ? `Not sent: give the request a "path" such as /v3/serp/google/organic/live/advanced. A "url" must start with https://api.dataforseo.com/.`
                            : `Not sent: "${String(rawPath)}" is not a DataForSEO API path. Use a path like /v3/serp/google/organic/live/advanced, with no query string.`,
                      })
                    // What the prompt shows and the server receives: the checked path, never a `url`.
                    const sent = endpoint ? { ...Object.fromEntries(Object.entries(args).filter(([key]) => key !== "url")), path: endpoint } : args
                    const resource = endpoint ?? "*"
                    yield* permission.assert({
                      action: name(tool.server, tool.name),
                      resources: [resource],
                      // Never save "*" for DataForSEO: one "Always allow" must not cover every paid endpoint.
                      save: tool.server === DATAFORSEO_SERVER && !endpoint ? [] : [resource],
                      metadata: { input: sent },
                      ...Permission.invocation(context),
                    })
                    const free = endpoint !== undefined && listPrice(endpoint)?.unit === "free"
                    const root = dataforseoCall && !free ? yield* rootSession(context.sessionID) : undefined
                    const budget = readSettings().budget_per_session_usd
                    const spent =
                      root === undefined
                        ? 0
                        : Math.max(sessionSpend.get(root) ?? 0, yield* Effect.promise(() => balanceSpend(root)))
                    // Refuse a call that would cross the budget by its catalog minimum, not only once it is crossed.
                    // Calls already in flight when the budget runs out can still finish; nothing new starts.
                    const next = endpoint ? estimate(endpoint, args) : 0
                    if (root !== undefined && (spent >= budget || spent + next > budget))
                      return yield* new ToolFailure({
                        message: `${spent >= budget ? "Session budget reached" : "Session budget would be exceeded"}: $${money(spent)} spent of $${money(budget)}${next > 0 ? `, and this request costs at least $${money(next)}` : ""}. Not sent. The user can raise budget_per_session_usd with /dfs-settings, or start a new session. The budget is read again on every request, so after a change, try the request again.`,
                      })
                    const result = yield* mcp
                      .callTool({
                        server: tool.server,
                        name: tool.name,
                        // The DataForSEO server needs the full "/v3/..." path, so send the canonical form the permission checked.
                        // The server prefers `url` over `path`, so `url` never goes through: only the checked path does.
                        args: sent,
                        sessionID: context.sessionID,
                      })
                      .pipe(
                        Effect.catchTags({
                          "MCP.NotFoundError": (error) =>
                            new ToolFailure({ message: `MCP server "${error.server}" is not available` }),
                          "MCP.ToolCallError": (error) => new ToolFailure({ message: error.message }),
                        }),
                      )
                    if (result.isError)
                      return yield* new ToolFailure({
                        message:
                          result.content
                            .flatMap((part) => (part.type === "text" ? [part.text] : []))
                            .join("\n")
                            .trim() || "MCP tool returned an error",
                      })
                    const content = yield* Effect.forEach(result.content, (part) => toContent(part, toolOutput))
                    const text = content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n")
                    if (root !== undefined) {
                      // Add to the current total (not a value read before the call), so parallel calls all count.
                      const billed = billedCost(result.structured ?? Option.getOrUndefined(decodeJson(text)))
                      const charge = billed > 0 ? billed : endpoint ? estimate(endpoint, args) : 0
                      sessionSpend.set(root, (sessionSpend.get(root) ?? 0) + charge)
                    }
                    const output = () => {
                      if (result.structured !== undefined) return result.structured
                      if (text === "") return null
                      // Agents assume JSON returned as text is already an object, so parse it when the server declares no schema.
                      if (tool.outputSchema === undefined && (text.startsWith("{") || text.startsWith("[")))
                        return Option.getOrElse(decodeJson(text), () => text)
                      return text
                    }
                    return {
                      output: output(),
                      ...(content.length === 0 ? {} : { content }),
                    }
                  }).pipe(
                    Effect.mapError((error) => {
                      if (error instanceof ToolFailure) return error
                      if (error instanceof Permission.BlockedError)
                        return new ToolFailure({ message: error.message, error })
                      if (error instanceof Permission.CorrectedError)
                        return new ToolFailure({ message: error.feedback, error })
                      return new ToolFailure({ message: `Unable to execute ${name(tool.server, tool.name)}`, error })
                    }),
                  ),
              })
            }
          })
        }),
      )
      .pipe(Effect.forkScoped)
    const reconcile = lock.withPermit(
      Effect.gen(function* () {
        discovered = yield* mcp.tools()
        yield* tools.reload()
      }),
    )

    // Servers announce tools in bursts and each read loads the whole catalog, so settle and refresh
    // once. The bus subscription stays eager; only the already-open sliding subscription is debounced.
    const changes = yield* PubSub.sliding<void>(1)
    yield* bus.subscribe(McpEvent.ToolsChanged).pipe(
      Stream.runForEach(() => PubSub.publish(changes, undefined)),
      Effect.forkScoped({ startImmediately: true }),
    )
    const updates = yield* PubSub.subscribe(changes)
    yield* Stream.fromSubscription(updates).pipe(
      Stream.debounce("100 millis"),
      Stream.runForEach(() => reconcile),
      Effect.forkScoped({ startImmediately: true }),
    )
    return Service.of({
      flush: Effect.gen(function* () {
        yield* Fiber.await(initial)
        yield* mcp.awaitStartup()
        // Each catalog refresh creates new tool objects, so identity shows whether the registry is behind.
        const current = yield* mcp.tools()
        if (current.length !== discovered.length || current.some((tool, index) => tool !== discovered[index]))
          yield* reconcile
      }),
    })
  }),
)

// Only media the read tool also accepts is sent inline; other types would fail request lowering on every later turn.
const toContent = Effect.fnUntraced(function* (part: Mcp.ToolResultContent, toolOutput: ToolOutput.Interface) {
  if (part.type === "text") return { type: "text" as const, text: part.text }
  const mime = part.mimeType.split(";", 1)[0].trim().toLowerCase()
  if (ReadToolFileSystem.MEDIA_MIMES.has(mime))
    return { type: "file" as const, uri: `data:${part.mimeType};base64,${part.data}`, mime: part.mimeType }
  const bytes = Buffer.from(part.data, "base64")
  const label = part.uri ?? "content"
  if (Mime.isTextual(mime))
    return { type: "text" as const, text: `[Resource ${label} (${part.mimeType})]\n${bytes.toString("utf8")}` }
  const ext = extension(mime)
  const file = yield* toolOutput.save(bytes, ext ? `.${ext}` : "")
  return {
    type: "text" as const,
    text: `[Binary resource ${label} (${part.mimeType}, ${bytes.byteLength} bytes) saved to ${file}]`,
  }
})

export const node = makeLocationNode({
  service: Service,
  layer,
  deps: [Tool.node, Mcp.node, Bus.node, Permission.node, ToolOutput.node, SessionStore.node],
})
