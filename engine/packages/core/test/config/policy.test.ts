import { describe, expect } from "bun:test"
import { Document, Event, Info, type Entry } from "@dataforseo-agent/schema/config"
import { ConfigPolicy } from "@dataforseo-agent/schema/config/policy"
import { Permission } from "@dataforseo-agent/schema/permission"
import { Config } from "@dataforseo-agent/core/config"
import { Integration } from "@dataforseo-agent/core/integration"
import { ConfigPolicyPlugin } from "@dataforseo-agent/core/config/plugin/policy"
import { Bus } from "@dataforseo-agent/core/bus"
import { Plugin } from "@dataforseo-agent/core/plugin"
import { PluginHooks } from "@dataforseo-agent/core/plugin/hooks"
import { PluginHost } from "@dataforseo-agent/core/plugin/host"
import { Provider } from "@dataforseo-agent/core/provider"
import { Session } from "@dataforseo-agent/core/session"
import { Credential } from "@dataforseo-agent/core/credential"
import { ConfigIntegration } from "@dataforseo-agent/core/config/integration"
import { WebSearch } from "@dataforseo-agent/core/websearch"
import { WebSearchExa } from "@dataforseo-agent/core/plugin/websearch/exa"
import { WebSearchTinyFish } from "@dataforseo-agent/core/plugin/websearch/tinyfish"
import { Effect, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { waitUntil } from "../lib/eventually"
import { testEffect } from "../lib/effect"
import { organizationPolicy } from "../fixture/policy"
import { PluginTestLayer } from "../plugin/fixture"

const it = testEffect(PluginTestLayer)
const decode = Schema.decodeUnknownSync(Info)

const document = (...policies: ConfigPolicy.Info[]) => new Document({ type: "document", info: decode({ policies }) })
const provider = (effect: ConfigPolicy.Effect, resource: string): ConfigPolicy.Info => ({
  action: "provider.use",
  resource,
  effect,
})
const tool = (effect: ConfigPolicy.Effect, resource: string): ConfigPolicy.Info => ({
  action: "tool.use",
  resource,
  effect,
})

const integration = (
  action: "integration.connect" | "integration.use",
  effect: ConfigPolicy.Effect,
  resource: string,
): ConfigPolicy.Info => ({ action, resource, effect })

const accountCredential = (account: string) =>
  Credential.OAuth.make({
    type: "oauth",
    methodID: Integration.MethodID.make("device"),
    access: "access",
    refresh: "refresh",
    expires: Number.MAX_SAFE_INTEGER,
    metadata: { accountID: account },
  })

const addPlugin = Effect.fn(function* (entries: Entry[]) {
  const plugin = yield* Plugin.Service
  const host = yield* PluginHost.make(plugin, "test")
  yield* ConfigPolicyPlugin.Plugin.effect(host).pipe(Effect.provide(Config.testLayer(entries)))
})

const evaluate = Effect.fn(function* (action: string, resources: string[], effect: Permission.Effect = "allow") {
  const hooks = yield* PluginHooks.Service
  const event = yield* hooks.trigger("permission", "evaluate", {
    sessionID: Session.ID.make("ses_policy"),
    action,
    resources,
    effect,
  })
  return { effect: event.effect, message: event.message }
})

describe("ConfigPolicyPlugin.Plugin", () => {
  it.effect("preserves last-match precedence for tool.use without granting approvals", () =>
    Effect.gen(function* () {
      yield* addPlugin([
        document(tool("deny", "shell:*"), tool("allow", "shell:git *"), tool("deny", "shell:git push *")),
      ])
      expect((yield* evaluate("shell", ["git status"], "ask")).effect).toBe("ask")
      expect((yield* evaluate("shell", ["git push origin main"])).effect).toBe("deny")
      expect((yield* evaluate("shell", ["ls"])).effect).toBe("deny")
      expect((yield* evaluate("edit", ["notes.md"])).effect).toBe("allow")
    }),
  )

  it.effect("organization tool.use policy overrides authored policy", () =>
    Effect.gen(function* () {
      yield* addPlugin([organizationPolicy([tool("deny", "shell:*")], "Acme"), document(tool("allow", "shell:*"))])
      expect(yield* evaluate("shell", ["ls"])).toEqual({ effect: "deny", message: "Blocked by Acme's policy" })
    }),
  )

  it.effect("filters plugin-provided providers with ordered wildcard policies", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      yield* catalog.transform((catalog) => {
        catalog.update(Provider.ID.openai, () => {})
        catalog.update(Provider.ID.anthropic, () => {})
        catalog.update(Provider.ID.make("company-internal"), () => {})
      })
      yield* addPlugin([
        document(provider("deny", "*"), provider("allow", "anthropic"), provider("allow", "company-*")),
      ])

      expect(yield* catalog.get(Provider.ID.openai)).toBeUndefined()
      expect(yield* catalog.get(Provider.ID.anthropic)).toBeDefined()
      expect(yield* catalog.get(Provider.ID.make("company-internal"))).toBeDefined()
    }),
  )

  it.effect("prevents project policy from overriding user-global policy", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      yield* catalog.transform((catalog) => catalog.update(Provider.ID.openai, () => {}))
      yield* addPlugin([document(provider("deny", "openai")), document(provider("allow", "openai"))])

      expect(yield* catalog.get(Provider.ID.openai)).toBeUndefined()
    }),
  )

  it.live("reloads changed policies", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      const bus = yield* Bus.Service
      const test = yield* Config.Test
      const plugin = yield* Plugin.Service
      const host = yield* PluginHost.make(plugin, "test")
      yield* catalog.transform((catalog) => catalog.update(Provider.ID.openai, () => {}))
      yield* ConfigPolicyPlugin.Plugin.effect(host)
      expect(yield* catalog.get(Provider.ID.openai)).toBeUndefined()

      yield* test.setEntries([document(provider("allow", "openai"))])
      yield* bus.publish(Event.Updated, {})
      yield* waitUntil(catalog.get(Provider.ID.openai).pipe(Effect.map((provider) => provider !== undefined)))
    }).pipe(Effect.provide(Config.testLayer([document(provider("deny", "openai"))]))),
  )

  it.effect("denies permissions matched as action:resource", () =>
    Effect.gen(function* () {
      yield* addPlugin([document(tool("deny", "shell:git push *"))])

      expect(yield* evaluate("shell", ["git push"])).toEqual({
        effect: "deny",
        message: "Blocked by configuration policy",
      })
      expect(yield* evaluate("shell", ["git push origin main"])).toEqual({
        effect: "deny",
        message: "Blocked by configuration policy",
      })
      // Compound commands check several resources; any denied resource denies the operation.
      expect((yield* evaluate("shell", ["git status", "git push"])).effect).toBe("deny")
      expect(yield* evaluate("shell", ["git status"])).toEqual({ effect: "allow", message: undefined })
      expect(yield* evaluate("edit", ["git push"])).toEqual({ effect: "allow", message: undefined })
    }),
  )

  it.effect("turns an ask into a deny but never grants", () =>
    Effect.gen(function* () {
      yield* addPlugin([document(tool("deny", "webfetch:*"), tool("allow", "shell:*"))])

      expect((yield* evaluate("webfetch", ["https://example.com"], "ask")).effect).toBe("deny")
      expect((yield* evaluate("shell", ["ls"], "ask")).effect).toBe("ask")
    }),
  )

  it.effect("lets a later allow lift an earlier broad deny", () =>
    Effect.gen(function* () {
      yield* addPlugin([document(tool("deny", "shell:*"), tool("allow", "shell:git status *"))])

      expect((yield* evaluate("shell", ["git status --short"])).effect).toBe("allow")
      expect((yield* evaluate("shell", ["rm -rf /"])).effect).toBe("deny")
    }),
  )

  it.effect("denies every permission with a bare wildcard", () =>
    Effect.gen(function* () {
      yield* addPlugin([document(tool("deny", "*"))])

      expect((yield* evaluate("question", ["*"])).effect).toBe("deny")
      expect((yield* evaluate("read", ["/tmp/notes.txt"])).effect).toBe("deny")
      expect((yield* evaluate("github_delete_repository", ["*"])).effect).toBe("deny")
    }),
  )

  it.effect("lets organization provider statements override authored documents", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      yield* catalog.transform((catalog) => {
        catalog.update(Provider.ID.openai, () => {})
        catalog.update(Provider.ID.anthropic, () => {})
        catalog.update(Provider.ID.make("acme"), () => {})
      })
      yield* addPlugin([
        organizationPolicy([provider("deny", "*"), provider("allow", "acme")]),
        document(provider("allow", "anthropic")),
      ])

      expect(yield* catalog.get(Provider.ID.anthropic)).toBeUndefined()
      expect(yield* catalog.get(Provider.ID.openai)).toBeUndefined()
      expect(yield* catalog.get(Provider.ID.make("acme"))).toBeDefined()
    }),
  )

  it.effect("lets an organization allow restore a provider denied by the user", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      yield* catalog.transform((catalog) => catalog.update(Provider.ID.openai, () => {}))
      yield* addPlugin([organizationPolicy([provider("allow", "openai")]), document(provider("deny", "openai"))])

      expect(yield* catalog.get(Provider.ID.openai)).toBeDefined()
    }),
  )

  for (const input of [
    { organization: "Acme", message: "Blocked by Acme's policy" },
    { organization: undefined, message: "Blocked by your organization's policy" },
  ])
    it.effect(`names the organization when its permission statement decides: ${input.organization}`, () =>
      Effect.gen(function* () {
        yield* addPlugin([
          organizationPolicy([tool("deny", "shell:sudo *")], input.organization),
          document(tool("allow", "shell:*")),
        ])

        expect(yield* evaluate("shell", ["sudo ls"])).toEqual({ effect: "deny", message: input.message })
        expect((yield* evaluate("shell", ["ls"])).effect).toBe("allow")
      }),
    )

  it.live("rebuilds the catalog when the organization's policy changes", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      const bus = yield* Bus.Service
      const test = yield* Config.Test
      const host = yield* PluginHost.make(yield* Plugin.Service, "test")
      const acme = Integration.ID.make("acme")
      yield* catalog.transform((catalog) => catalog.update(Provider.ID.openai, () => {}))
      yield* ConfigPolicyPlugin.Plugin.effect(host)
      expect(yield* catalog.get(Provider.ID.openai)).toBeDefined()

      yield* test.integration?.(acme, organizationPolicy([provider("deny", "openai")])) ?? Effect.void
      yield* bus.publish(Event.Updated, {})
      yield* waitUntil(catalog.get(Provider.ID.openai).pipe(Effect.map((provider) => provider === undefined)))

      yield* test.integration?.(acme, undefined) ?? Effect.void
      yield* bus.publish(Event.Updated, {})
      yield* waitUntil(catalog.get(Provider.ID.openai).pipe(Effect.map((provider) => provider !== undefined)))
    }).pipe(Effect.provide(Config.testLayer())),
  )
})

describe("integration policy", () => {
  it.effect("keeps an integration's account out of a bare-ID allow", () =>
    Effect.gen(function* () {
      const catalog = yield* Provider.Service
      const credentials = yield* Credential.Service
      yield* credentials.create({
        integrationID: Integration.ID.make("acme"),
        value: accountCredential("acc_other"),
      })
      yield* catalog.transform((catalog) => {
        catalog.update(Provider.ID.make("acme"), () => {})
        catalog.update(Provider.ID.anthropic, () => {})
      })
      yield* addPlugin([
        document(
          integration("integration.use", "deny", "*"),
          integration("integration.use", "allow", "anthropic"),
          integration("integration.use", "allow", "acme"),
        ),
      ])
      expect(yield* catalog.get(Provider.ID.anthropic)).toBeDefined()
      // `acme` names only account-less use; a connected account needs `acme#*` or its own ID.
      expect(yield* catalog.get(Provider.ID.make("acme"))).toBeUndefined()
    }),
  )

  for (const effect of ["allow", "deny"] as const)
    it.effect(`decides a well-known origin's providers by the origin: ${effect}`, () =>
      Effect.gen(function* () {
        const catalog = yield* Provider.Service
        const origin = Integration.ID.make("https://ai.acme.com")
        yield* catalog.transform((catalog) => {
          catalog.update(Provider.ID.make("acme-gateway"), (provider) => {
            provider.activation = "enabled"
          })
          catalog.update(Provider.ID.make("my-llm"), (provider) => {
            provider.activation = "enabled"
          })
        })
        yield* addPlugin([
          document(
            integration("integration.use", "deny", "*"),
            integration("integration.use", effect, "https://ai.acme.com"),
          ),
          new ConfigIntegration.WellKnownDocument({
            type: "document",
            integrationID: origin,
            info: decode({
              providers: { "acme-gateway": { package: "@dataforseo-agent/ai/providers/openai-compatible", models: {} } },
            }),
          }),
          new Document({
            type: "document",
            info: decode({
              providers: { "my-llm": { package: "@dataforseo-agent/ai/providers/openai-compatible", models: {} } },
            }),
          }),
        ])
        expect(yield* catalog.get(Provider.ID.make("acme-gateway"))).toEqual(
          effect === "allow" ? expect.anything() : undefined,
        )
        expect(yield* catalog.get(Provider.ID.make("my-llm"))).toBeUndefined()
      }),
    )

  it.effect("removes built-in and plugin web search providers that websearch.use denies", () =>
    Effect.gen(function* () {
      const websearch = yield* WebSearch.Service
      const host = yield* PluginHost.make(yield* Plugin.Service, "test")
      // TinyFish needs no API key, so it is offered until a policy removes it.
      yield* Effect.all([WebSearchExa.Plugin.effect(host), WebSearchTinyFish.Plugin.effect(host)]).pipe(
        Effect.provide(FetchHttpClient.layer),
      )
      yield* host.websearch.transform((editor) =>
        editor.add({ id: WebSearch.ID.make("acme-search"), name: "Acme Search", execute: () => Effect.succeed([]) }),
      )
      yield* addPlugin([
        document(
          { action: "websearch.use", resource: "*", effect: "deny" },
          { action: "websearch.use", resource: "exa", effect: "allow" },
        ),
      ])
      expect((yield* websearch.providers()).map((item): string => item.id)).toEqual(["exa"])
    }),
  )

  it.effect("converts legacy statements in Console config before enforcement sees them", () =>
    Effect.sync(() => {
      const remote = Schema.decodeUnknownSync(ConfigIntegration.Remote)({
        policies: [
          { action: "integration.use", resource: "mcp:*", effect: "deny" },
          { action: "integration.use", resource: "skill:deploy", effect: "deny" },
          { action: "future.action", resource: "*", effect: "deny" },
        ],
      })
      expect(remote.policies).toEqual([
        { action: "mcp.use", resource: "*", effect: "deny" },
        { action: "skill.use", resource: "deploy", effect: "deny" },
      ])
    }),
  )
})
