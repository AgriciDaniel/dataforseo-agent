import { Effect } from "effect"
import { define } from "@dataforseo-agent/plugin/effect/plugin"

export const ZenmuxPlugin = define({
  id: "dataforseo-agent.provider.zenmux",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.provider.transform((evt) => {
      for (const item of evt.list()) {
        if (item.provider.package !== "@dataforseo-agent/ai/providers/openai-compatible") continue
        if (item.provider.settings?.baseURL !== "https://zenmux.ai/api/v1") continue
        evt.update(item.provider.id, (provider) => {
          provider.headers = {
            "HTTP-Referer": "https://github.com/AgriciDaniel/dataforseo-agent",
            "X-Title": "DataForSEO Agent",
            ...provider.headers,
          }
        })
      }
    })
  }),
})
