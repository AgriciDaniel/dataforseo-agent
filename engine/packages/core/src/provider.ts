export * as Provider from "./provider.js"

import { Context, Effect, Layer, Option, Schema, Stream, Struct } from "effect"
import { Provider } from "@dataforseo-agent/schema/provider"
import { Model } from "@dataforseo-agent/schema/model"
import { makeLocationNode } from "@dataforseo-agent/util/effect/app-node"
import { HttpTimeout, type ProviderPackage } from "@dataforseo-agent/ai/effect"
import { isRecord } from "@dataforseo-agent/util/record"
import { Npm } from "@dataforseo-agent/util/npm"
import type { DeepMutable } from "./schema.js"
import { importModule, resolveModule } from "@dataforseo-agent/util/runtime-import"
import { Bus } from "./bus.js"
import { Integration } from "./integration.js"
import { State } from "./state.js"
import { IntegrationConnection } from "./integration/connection.js"
import { Credential } from "@dataforseo-agent/schema/credential"
import { Location } from "./location.js"
import { freeze } from "immer"
import { AISDKNative } from "./aisdk-native.js"

export const ID = Provider.ID
export type ID = typeof ID.Type

export const AISDK_PREFIX = "aisdk:"
export const isAISDK = (value: string | undefined): value is string => value?.startsWith(AISDK_PREFIX) ?? false
export const aisdk = (value: string) => (isAISDK(value) ? value : `${AISDK_PREFIX}${value}`)
export function packageName(value: string): string
export function packageName(value: undefined): undefined
export function packageName(value: string | undefined): string | undefined
export function packageName(value: string | undefined) {
  // Native provider entrypoints can persist in user configuration across the npm scope migration.
  if (value?.startsWith("@dataforseo-agent-ai/ai/")) return value.replace("@dataforseo-agent-ai/", "@dataforseo-agent/")
  if (value === undefined || !isAISDK(value)) return value
  return value.slice(AISDK_PREFIX.length)
}

type Json = Schema.Schema.Type<typeof Schema.Json>
const JsonRecord = Schema.Record(Schema.String, Schema.Json)
const decodeJsonRecord = Schema.decodeUnknownSync(JsonRecord)

export class LoadError extends Schema.TaggedError<LoadError>()("Provider.LoadError", {
  package: Schema.String,
  cause: Schema.Defect(),
}) {}

const packages = new Map<string, Promise<unknown>>()
const builtins = new Map<string, () => Promise<unknown>>([
  ["@dataforseo-agent/ai/providers/alibaba", () => import("@dataforseo-agent/ai/providers/alibaba")],
  ["@dataforseo-agent/ai/providers/alibaba/chat", () => import("@dataforseo-agent/ai/providers/alibaba/chat")],
  ["@dataforseo-agent/ai/providers/alibaba/messages", () => import("@dataforseo-agent/ai/providers/alibaba/messages")],
  ["@dataforseo-agent/ai/providers/alibaba/responses", () => import("@dataforseo-agent/ai/providers/alibaba/responses")],
  ["@dataforseo-agent/ai/providers/alibaba/images", () => import("@dataforseo-agent/ai/providers/alibaba/images")],
  ["@dataforseo-agent/ai/providers/amazon-bedrock", () => import("@dataforseo-agent/ai/providers/amazon-bedrock")],
  ["@dataforseo-agent/ai/providers/amazon-bedrock/mantle", () => import("@dataforseo-agent/ai/providers/amazon-bedrock/mantle")],
  [
    "@dataforseo-agent/ai/providers/amazon-bedrock/mantle/chat",
    () => import("@dataforseo-agent/ai/providers/amazon-bedrock/mantle/chat"),
  ],
  [
    "@dataforseo-agent/ai/providers/amazon-bedrock/mantle/messages",
    () => import("@dataforseo-agent/ai/providers/amazon-bedrock/mantle/messages"),
  ],
  [
    "@dataforseo-agent/ai/providers/amazon-bedrock/mantle/responses",
    () => import("@dataforseo-agent/ai/providers/amazon-bedrock/mantle/responses"),
  ],
  ["@dataforseo-agent/ai/providers/anthropic", () => import("@dataforseo-agent/ai/providers/anthropic")],
  ["@dataforseo-agent/ai/providers/anthropic-compatible", () => import("@dataforseo-agent/ai/providers/anthropic-compatible")],
  ["@dataforseo-agent/ai/providers/azure", () => import("@dataforseo-agent/ai/providers/azure")],
  ["@dataforseo-agent/ai/providers/azure/chat", () => import("@dataforseo-agent/ai/providers/azure/chat")],
  ["@dataforseo-agent/ai/providers/azure/responses", () => import("@dataforseo-agent/ai/providers/azure/responses")],
  ["@dataforseo-agent/ai/providers/azure/images", () => import("@dataforseo-agent/ai/providers/azure/images")],
  ["@dataforseo-agent/ai/providers/azure/messages", () => import("@dataforseo-agent/ai/providers/azure/messages")],
  ["@dataforseo-agent/ai/providers/baseten", () => import("@dataforseo-agent/ai/providers/baseten")],
  ["@dataforseo-agent/ai/providers/baseten/decisions", () => import("@dataforseo-agent/ai/providers/baseten/decisions")],
  ["@dataforseo-agent/ai/providers/cerebras", () => import("@dataforseo-agent/ai/providers/cerebras")],
  ["@dataforseo-agent/ai/providers/cloudflare-ai-gateway", () => import("@dataforseo-agent/ai/providers/cloudflare-ai-gateway")],
  [
    "@dataforseo-agent/ai/providers/cloudflare-ai-gateway/decisions",
    () => import("@dataforseo-agent/ai/providers/cloudflare-ai-gateway/decisions"),
  ],
  ["@dataforseo-agent/ai/providers/cloudflare-workers-ai", () => import("@dataforseo-agent/ai/providers/cloudflare-workers-ai")],
  [
    "@dataforseo-agent/ai/providers/cloudflare-workers-ai/decisions",
    () => import("@dataforseo-agent/ai/providers/cloudflare-workers-ai/decisions"),
  ],
  [
    "@dataforseo-agent/ai/providers/cloudflare-workers-ai/images",
    () => import("@dataforseo-agent/ai/providers/cloudflare-workers-ai/images"),
  ],
  ["@dataforseo-agent/ai/providers/cohere", () => import("@dataforseo-agent/ai/providers/cohere")],
  ["@dataforseo-agent/ai/providers/cohere/chat", () => import("@dataforseo-agent/ai/providers/cohere/chat")],
  ["@dataforseo-agent/ai/providers/deepinfra", () => import("@dataforseo-agent/ai/providers/deepinfra")],
  ["@dataforseo-agent/ai/providers/deepseek", () => import("@dataforseo-agent/ai/providers/deepseek")],
  ["@dataforseo-agent/ai/providers/digitalocean", () => import("@dataforseo-agent/ai/providers/digitalocean")],
  ["@dataforseo-agent/ai/providers/digitalocean/decisions", () => import("@dataforseo-agent/ai/providers/digitalocean/decisions")],
  ["@dataforseo-agent/ai/providers/digitalocean/images", () => import("@dataforseo-agent/ai/providers/digitalocean/images")],
  ["@dataforseo-agent/ai/providers/digitalocean/responses", () => import("@dataforseo-agent/ai/providers/digitalocean/responses")],
  ["@dataforseo-agent/ai/providers/fireworks", () => import("@dataforseo-agent/ai/providers/fireworks")],
  ["@dataforseo-agent/ai/providers/google", () => import("@dataforseo-agent/ai/providers/google")],
  ["@dataforseo-agent/ai/providers/google/interactions", () => import("@dataforseo-agent/ai/providers/google/interactions")],
  ["@dataforseo-agent/ai/providers/google/images", () => import("@dataforseo-agent/ai/providers/google/images")],
  ["@dataforseo-agent/ai/providers/google-vertex", () => import("@dataforseo-agent/ai/providers/google-vertex")],
  ["@dataforseo-agent/ai/providers/google-vertex/chat", () => import("@dataforseo-agent/ai/providers/google-vertex/chat")],
  ["@dataforseo-agent/ai/providers/google-vertex/gemini", () => import("@dataforseo-agent/ai/providers/google-vertex/gemini")],
  [
    "@dataforseo-agent/ai/providers/google-vertex/interactions",
    () => import("@dataforseo-agent/ai/providers/google-vertex/interactions"),
  ],
  ["@dataforseo-agent/ai/providers/google-vertex/messages", () => import("@dataforseo-agent/ai/providers/google-vertex/messages")],
  ["@dataforseo-agent/ai/providers/google-vertex/mistral", () => import("@dataforseo-agent/ai/providers/google-vertex/mistral")],
  ["@dataforseo-agent/ai/providers/google-vertex/responses", () => import("@dataforseo-agent/ai/providers/google-vertex/responses")],
  ["@dataforseo-agent/ai/providers/google-vertex/images", () => import("@dataforseo-agent/ai/providers/google-vertex/images")],
  ["@dataforseo-agent/ai/providers/google-vertex-messages", () => import("@dataforseo-agent/ai/providers/google-vertex-messages")],
  ["@dataforseo-agent/ai/providers/groq", () => import("@dataforseo-agent/ai/providers/groq")],
  ["@dataforseo-agent/ai/providers/meta", () => import("@dataforseo-agent/ai/providers/meta")],
  ["@dataforseo-agent/ai/providers/meta/chat", () => import("@dataforseo-agent/ai/providers/meta/chat")],
  ["@dataforseo-agent/ai/providers/meta/images", () => import("@dataforseo-agent/ai/providers/meta/images")],
  ["@dataforseo-agent/ai/providers/meta/messages", () => import("@dataforseo-agent/ai/providers/meta/messages")],
  ["@dataforseo-agent/ai/providers/meta/responses", () => import("@dataforseo-agent/ai/providers/meta/responses")],
  ["@dataforseo-agent/ai/providers/minimax", () => import("@dataforseo-agent/ai/providers/minimax")],
  ["@dataforseo-agent/ai/providers/minimax/chat", () => import("@dataforseo-agent/ai/providers/minimax/chat")],
  ["@dataforseo-agent/ai/providers/minimax/images", () => import("@dataforseo-agent/ai/providers/minimax/images")],
  ["@dataforseo-agent/ai/providers/minimax/messages", () => import("@dataforseo-agent/ai/providers/minimax/messages")],
  ["@dataforseo-agent/ai/providers/minimax/responses", () => import("@dataforseo-agent/ai/providers/minimax/responses")],
  ["@dataforseo-agent/ai/providers/mistral", () => import("@dataforseo-agent/ai/providers/mistral")],
  ["@dataforseo-agent/ai/providers/moonshot", () => import("@dataforseo-agent/ai/providers/moonshot")],
  ["@dataforseo-agent/ai/providers/moonshot/chat", () => import("@dataforseo-agent/ai/providers/moonshot/chat")],
  ["@dataforseo-agent/ai/providers/moonshot/messages", () => import("@dataforseo-agent/ai/providers/moonshot/messages")],
  ["@dataforseo-agent/ai/providers/moonshot/responses", () => import("@dataforseo-agent/ai/providers/moonshot/responses")],
  ["@dataforseo-agent/ai/providers/openai", () => import("@dataforseo-agent/ai/providers/openai")],
  ["@dataforseo-agent/ai/providers/openai/chat", () => import("@dataforseo-agent/ai/providers/openai/chat")],
  ["@dataforseo-agent/ai/providers/openai/responses", () => import("@dataforseo-agent/ai/providers/openai/responses")],
  ["@dataforseo-agent/ai/providers/openai/images", () => import("@dataforseo-agent/ai/providers/openai/images")],
  ["@dataforseo-agent/ai/providers/openai-compatible", () => import("@dataforseo-agent/ai/providers/openai-compatible")],
  [
    "@dataforseo-agent/ai/providers/openai-compatible/responses",
    () => import("@dataforseo-agent/ai/providers/openai-compatible/responses"),
  ],
  ["@dataforseo-agent/ai/providers/openai-compatible/images", () => import("@dataforseo-agent/ai/providers/openai-compatible/images")],
  [
    "@dataforseo-agent/ai/providers/openai-compatible-responses",
    () => import("@dataforseo-agent/ai/providers/openai-compatible-responses"),
  ],
  ["@dataforseo-agent/ai/providers/openrouter", () => import("@dataforseo-agent/ai/providers/openrouter")],
  ["@dataforseo-agent/ai/providers/openrouter/decisions", () => import("@dataforseo-agent/ai/providers/openrouter/decisions")],
  ["@dataforseo-agent/ai/providers/openrouter/images", () => import("@dataforseo-agent/ai/providers/openrouter/images")],
  ["@dataforseo-agent/ai/providers/openrouter/responses", () => import("@dataforseo-agent/ai/providers/openrouter/responses")],
  ["@dataforseo-agent/ai/providers/togetherai", () => import("@dataforseo-agent/ai/providers/togetherai")],
  ["@dataforseo-agent/ai/providers/typesafe-ai/decisions", () => import("@dataforseo-agent/ai/providers/typesafe-ai/decisions")],
  ["@dataforseo-agent/ai/providers/venice", () => import("@dataforseo-agent/ai/providers/venice")],
  ["@dataforseo-agent/ai/providers/venice/responses", () => import("@dataforseo-agent/ai/providers/venice/responses")],
  ["@dataforseo-agent/ai/providers/vercel-ai-gateway", () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway")],
  ["@dataforseo-agent/ai/providers/vercel-ai-gateway/chat", () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway/chat")],
  [
    "@dataforseo-agent/ai/providers/vercel-ai-gateway/messages",
    () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway/messages"),
  ],
  [
    "@dataforseo-agent/ai/providers/vercel-ai-gateway/responses",
    () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway/responses"),
  ],
  [
    "@dataforseo-agent/ai/providers/vercel-ai-gateway/decisions",
    () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway/decisions"),
  ],
  ["@dataforseo-agent/ai/providers/vercel-ai-gateway/images", () => import("@dataforseo-agent/ai/providers/vercel-ai-gateway/images")],
  ["@dataforseo-agent/ai/providers/xai", () => import("@dataforseo-agent/ai/providers/xai")],
  ["@dataforseo-agent/ai/providers/xai/images", () => import("@dataforseo-agent/ai/providers/xai/images")],
  ["@dataforseo-agent/ai/providers/zai", () => import("@dataforseo-agent/ai/providers/zai")],
  ["@dataforseo-agent/ai/providers/zai/chat", () => import("@dataforseo-agent/ai/providers/zai/chat")],
  ["@dataforseo-agent/ai/providers/zai/images", () => import("@dataforseo-agent/ai/providers/zai/images")],
  ["@dataforseo-agent/ai/providers/zai-coding-plan", () => import("@dataforseo-agent/ai/providers/zai-coding-plan")],
  ["@dataforseo-agent/ai/providers/zai-coding-plan/chat", () => import("@dataforseo-agent/ai/providers/zai-coding-plan/chat")],
  ["@dataforseo-agent/ai/providers/zai-coding-plan/messages", () => import("@dataforseo-agent/ai/providers/zai-coding-plan/messages")],
  [
    "@dataforseo-agent/ai/providers/zai-coding-plan/responses",
    () => import("@dataforseo-agent/ai/providers/zai-coding-plan/responses"),
  ],
])

/** Native `@dataforseo-agent/ai/providers/*` entrypoints bundled with Core and loadable by name from config. */
export const builtinPackages: ReadonlySet<string> = new Set(builtins.keys())

export const loadPackage = Effect.fn("Provider.loadPackage")(function* (input: string, npm?: Npm.Interface) {
  const specifier = packageName(input)
  const builtin = builtins.get(specifier)
  if (builtin) return yield* importPackage(specifier, specifier, builtin)
  const resolved = yield* Effect.sync(() => {
    if (specifier.startsWith("file://") || specifier.startsWith("@dataforseo-agent/ai/")) return specifier
    try {
      return import.meta.resolve(specifier)
    } catch {
      return undefined
    }
  })
  if (resolved) return yield* importPackage(specifier, resolved)
  if (!npm) {
    return yield* new LoadError({
      package: specifier,
      cause: new Error(`Provider package ${specifier} is not installed`),
    })
  }
  const parts = specifier.split("/")
  const root = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier)
  const installed = yield* npm.add(root).pipe(Effect.mapError((cause) => new LoadError({ package: specifier, cause })))
  const entrypoint = yield* Effect.try({
    try: () => resolveModule(specifier, installed.directory),
    catch: (cause) => new LoadError({ package: specifier, cause }),
  })
  return yield* importPackage(specifier, entrypoint)
})

const settingsKeys = Struct.keys(Provider.Settings.schema.fields)
const providerOnlyKeys = settingsKeys.filter((key) => !(key in Model.Settings.schema.fields))

/** The provider options: every settings key DataForSEO Agent doesn't read itself. */
export function nativeSettings(settings: Settings) {
  return Struct.omit(settings, settingsKeys)
}

/** Settings a model inherits from its provider. */
export function modelSettings(settings: Settings | undefined) {
  return settings && Struct.omit(settings, providerOnlyKeys)
}

const decodeTimeout = Schema.decodeUnknownOption(HttpTimeout)

/** Applied to `headerTimeout` when provider settings leave it unset or invalid. */
export const DEFAULT_TIMEOUT_MS = 300_000

/**
 * Applied to `chunkTimeout` when provider settings leave it unset or invalid. Some providers, such as DeepSeek, have
 * specifically asked clients to allow at least 15 minutes, because their models can stream nothing for minutes while
 * they reason.
 */
export const DEFAULT_CHUNK_TIMEOUT_MS = 900_000

/** One timeout setting without a default; invalid values are dropped. */
export function timeout(value: unknown) {
  return Option.getOrUndefined(decodeTimeout(value))
}

/** Request timeouts from provider settings, resolved for every route. `timeout` has no default. */
export function timeouts(settings: Readonly<Record<string, unknown>>) {
  return {
    timeout: timeout(settings.timeout),
    headerTimeout: timeout(settings.headerTimeout) ?? DEFAULT_TIMEOUT_MS,
    chunkTimeout: timeout(settings.chunkTimeout) ?? DEFAULT_CHUNK_TIMEOUT_MS,
  }
}

const decodeEncoding = Schema.decodeUnknownOption(Provider.Encoding)

/** Request body encoding from provider or model settings; invalid values are dropped. */
export function encoding(settings: Readonly<Record<string, unknown>>) {
  return Option.getOrUndefined(decodeEncoding(settings.encoding))
}

export function mergeOverlay(
  base: Readonly<Record<string, unknown>> | undefined,
  overlay: Readonly<Record<string, unknown>> | undefined,
): Record<string, Json> | undefined {
  if (base === undefined) return overlay && decodeJsonRecord({ ...overlay })
  if (overlay === undefined) return decodeJsonRecord({ ...base })
  return decodeJsonRecord(mergeRecord(base, overlay))
}

function mergeRecord(
  base: Readonly<Record<string, unknown>>,
  overlay: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    new Set([...Object.keys(base), ...Object.keys(overlay)]).values().map((key): [string, unknown] => {
      const left = base[key]
      const right = overlay[key]
      if (right === undefined) return [key, left]
      if (isRecord(left) && isRecord(right)) return [key, mergeRecord(left, right)]
      return [key, right]
    }),
  )
}

export function mergeHeaders(
  base: Readonly<Record<string, string>> | undefined,
  overlay: Readonly<Record<string, string>> | undefined,
) {
  if (base === undefined) return overlay && { ...overlay }
  if (overlay === undefined) return { ...base }
  return Object.fromEntries(
    [...Object.entries(base), ...Object.entries(overlay)]
      .reduce((result, entry) => {
        result.set(entry[0].toLowerCase(), entry)
        return result
      }, new Map<string, [string, string]>())
      .values(),
  )
}

export const Request = Provider.Request
export type Request = Provider.Request

export const Compaction = Provider.Compaction
export type Compaction = Provider.Compaction

export const Cache = Provider.Cache
export type Cache = Provider.Cache

export const Transport = Provider.Transport
export type Transport = Provider.Transport

export const Settings = Provider.Settings
export type Settings = Provider.Settings

export const Info = Provider.Info
export type Info = Provider.Info

export type MutableInfo = DeepMutable<Info>

export { Event } from "@dataforseo-agent/schema/provider"

/** Provider metadata owns its drafts; model definitions remain immutable inputs. */
export type Definition = {
  readonly provider: Info
  readonly models: ReadonlyMap<Model.ID, Model.Info>
  readonly sourceConnection?: IntegrationConnection.Info
}

export interface Editor {
  readonly list: () => readonly Definition[]
  readonly get: (providerID: ID) => Definition | undefined
  readonly add: (definition: {
    readonly info: Info
    readonly models: readonly Model.Info[]
    readonly sourceConnection?: IntegrationConnection.Info
  }) => void
  readonly update: (providerID: ID, update: (provider: MutableInfo) => void) => void
  readonly remove: (providerID: ID) => void
  readonly models: {
    readonly set: (providerID: ID, models: readonly Model.Info[]) => void
    readonly update: (providerID: ID, modelID: Model.ID, update: (model: DeepMutable<Model.Info>) => void) => void
    readonly remove: (providerID: ID, modelID: Model.ID) => void
  }
}

export interface Snapshot {
  readonly records: ReadonlyMap<ID, Definition>
  readonly available: readonly Definition[]
  readonly providers: readonly Info[]
}

export interface Interface extends State.Transformable<Editor> {
  readonly get: (providerID: ID) => Effect.Effect<Info | undefined>
  readonly all: () => Effect.Effect<readonly Info[]>
  readonly available: () => Effect.Effect<readonly Info[]>
  /** Internal definition/access snapshot; raw model inventories never cross the HTTP API. */
  readonly snapshot: () => Effect.Effect<Snapshot>
}

export class Service extends Context.Service<Service, Interface>()("@dataforseo-agent/Provider") {}

// Every location references the same index for a shared immutable definition array.
const definitions = new WeakMap<readonly Model.Info[], Map<ID, ReadonlyMap<Model.ID, Model.Info>>>()
function index(providerID: ID, models: readonly Model.Info[]) {
  const indexes = definitions.get(models) ?? new Map<ID, ReadonlyMap<Model.ID, Model.Info>>()
  const cached = indexes.get(providerID)
  if (cached) return cached
  // Model shares these definitions without copying, so a foreign definition takes this provider's identity here.
  const result = freeze(
    new Map(models.map((model) => [model.id, model.providerID === providerID ? model : { ...model, providerID }])),
    true,
  )
  indexes.set(providerID, result)
  definitions.set(models, indexes)
  return result
}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const bus = yield* Bus.Service
    const integrations = yield* Integration.Service
    const location = yield* Location.Service
    const state = State.create<
      Map<
        ID,
        {
          provider: MutableInfo
          models: ReadonlyMap<Model.ID, Model.Info>
          sourceConnection?: IntegrationConnection.Info
        }
      >,
      Editor
    >({
      name: "provider",
      initial: () => new Map(),
      editor: (records) => {
        const maps = new WeakSet<ReadonlyMap<Model.ID, Model.Info>>()
        const models = new WeakSet<Model.Info>()
        const entry = (id: ID) => {
          const current = records.get(id)
          if (current) return current
          const added = { provider: Info.empty(id) as MutableInfo, models: new Map<Model.ID, Model.Info>() }
          records.set(id, added)
          maps.add(added.models)
          return added
        }
        const writable = (id: ID) => {
          const record = entry(id)
          if (maps.has(record.models)) return record.models as Map<Model.ID, Model.Info>
          const owned = new Map(record.models)
          record.models = owned
          maps.add(owned)
          return owned
        }
        return {
          list: () => Array.from(records.values()),
          get: (id) => records.get(id),
          add: (definition) => {
            records.set(definition.info.id, {
              provider: structuredClone(definition.info) as MutableInfo,
              models: index(definition.info.id, definition.models),
              sourceConnection: definition.sourceConnection,
            })
          },
          update: (id, update) => {
            const record = entry(id)
            update(record.provider)
            record.provider.id = id
            AISDKNative.rewrite(record.provider, {
              specifier: record.provider.package,
              providerID: id,
              canonical: record.provider.canonical,
            })
          },
          remove: (id) => {
            records.delete(id)
          },
          models: {
            set: (id, values) => {
              entry(id).models = index(id, values)
            },
            update: (providerID, modelID, update) => {
              const record = entry(providerID)
              const target = writable(providerID)
              const current = target.get(modelID)
              const model = // An earlier add/set can publish and freeze an owned model within this fold.
                (
                  current && models.has(current) && !Object.isFrozen(current)
                    ? current
                    : current
                      ? structuredClone(current)
                      : Model.Info.default(providerID, modelID)
                ) as DeepMutable<Model.Info>
              update(model)
              model.id = modelID
              model.providerID = providerID
              AISDKNative.rewrite(model, {
                specifier: model.package ?? record.provider.package,
                providerID,
                canonical: model.canonical ?? record.provider.canonical,
                modelID: model.modelID ?? modelID,
              })
              models.add(model)
              target.set(modelID, model)
            },
            remove: (providerID, modelID) => {
              if (!records.has(providerID)) return
              writable(providerID).delete(modelID)
            },
          },
        }
      },
      notify: () => notify,
    })
    // Registrations may outlive a borrowed service layer; their later disposal must
    // not query dependencies that have already closed.
    yield* Effect.addFinalizer(() => State.shutdown(state.reload()))
    let cached: { records: Snapshot["records"]; value: Snapshot } | undefined
    const snapshot = Effect.fn("Provider.snapshot")(function* () {
      while (true) {
        const revision = integrations.revision()
        const records = state.get()
        // Connection presence decides availability; resolving OAuth tokens belongs to execution.
        const connections = yield* integrations.list()
        // Either fold can disable a plugin that also contributed to the other domain.
        if (revision !== integrations.revision() || records !== state.get()) continue
        const byID = new Map(connections.map((integration) => [integration.id, integration]))
        const available = Array.from(records.values()).filter((record) => {
          if (record.provider.activation === "disabled") return false
          const integration = byID.get(record.provider.integrationID ?? Integration.ID.make(record.provider.id))
          // Never combine the previous account's discovered endpoints/models with a new connection.
          if (
            record.sourceConnection &&
            IntegrationConnection.key(record.sourceConnection) !==
              IntegrationConnection.key(integration?.connections[0])
          )
            return false
          if (record.provider.activation === "enabled") return true
          if (integration?.connections.length) return true
          return record.provider.integrationID === undefined && !integration
        })
        // A credential change that leaves the same definitions available is not a catalog change.
        if (
          cached?.records === records &&
          cached.value.available.length === available.length &&
          cached.value.available.every((record, index) => record === available[index])
        )
          return cached.value
        const value = freeze({ records, available, providers: available.map((record) => record.provider) }, true)
        cached = { records, value }
        return value
      }
    })
    let published: Snapshot | undefined
    const notify: Effect.Effect<void> = Effect.gen(function* () {
      const value = yield* snapshot()
      if (value === published) return
      published = value
      yield* bus.publish(
        Provider.Event.Updated,
        {},
        {
          location: { directory: location.directory, workspaceID: location.workspaceID },
        },
      )
    })
    yield* bus.subscribe([Integration.Event.Updated, Credential.Event.Switched]).pipe(
      Stream.runForEach(() => notify),
      Effect.forkScoped({ startImmediately: true }),
    )
    return Service.of({
      transform: state.transform,
      reload: state.reload,
      get: Effect.fn("Provider.get")((id) => Effect.sync(() => freeze(state.get().get(id)?.provider, true))),
      all: Effect.fn("Provider.all")(() =>
        Effect.sync(() => Array.from(state.get().values(), (record) => freeze(record.provider, true))),
      ),
      available: Effect.fn("Provider.available")(() => snapshot().pipe(Effect.map((value) => value.providers))),
      snapshot,
    })
  }),
)

export const node = makeLocationNode({ service: Service, layer, deps: [Bus.node, Integration.node, Location.node] })

const importPackage = Effect.fn("Provider.importPackage")(function* (
  specifier: string,
  entrypoint: string,
  load = () => importModule(entrypoint),
) {
  const module = yield* Effect.tryPromise({
    try: () => {
      const existing = packages.get(entrypoint)
      if (existing) return existing
      const loaded = load()
      packages.set(entrypoint, loaded)
      return loaded
    },
    catch: (cause) => new LoadError({ package: specifier, cause }),
  })
  if (typeof module !== "object" || module === null || typeof (module as { model?: unknown }).model !== "function") {
    return yield* new LoadError({
      package: specifier,
      cause: new Error(`Provider package ${specifier} does not export model(modelID, settings)`),
    })
  }
  return module as ProviderPackage.Definition
})
