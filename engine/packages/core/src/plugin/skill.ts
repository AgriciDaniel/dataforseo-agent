/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill.js"

import { define } from "@dataforseo-agent/plugin/effect/plugin"
import { Effect } from "effect"
import { AbsolutePath } from "../schema.js"
import { Skill } from "../skill.js"
import dfaContent from "./skill/dataforseo-agent.md" with { type: "text" }

export const DataForSEOAgentContent = dfaContent

export const DataForSEOAgentDescription =
  "Use this skill for any question about DataForSEO Agent itself (the app, not the DataForSEO API), including how it works, configuring it, troubleshooting it, developing plugins or integrations, its SDK, clients, server, or API. Also use it for its agents, commands, skills, tools, permissions, MCP servers, providers, models, themes, keybinds, formatters, the CLI and the TUI."

export const Plugin = define({
  id: "dataforseo-agent.skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((editor) => {
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("dataforseo-agent"),
          name: Skill.Name.make("DataForSEO Agent"),
          description: DataForSEOAgentDescription,
          path: AbsolutePath.make("skill://dataforseo-agent/SKILL.md"),
          content: DataForSEOAgentContent,
        }),
      )
    })
  }),
})
