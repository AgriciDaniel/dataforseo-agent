export * as ChartTool from "./chart.js"

import { ToolFailure } from "@dataforseo-agent/ai/effect"
import type { Context } from "@dataforseo-agent/plugin/effect/plugin"
import { Effect, Schema } from "effect"
import { readFileSync, statSync } from "node:fs"
import path from "node:path"
import { Global } from "@dataforseo-agent/util/global"
import { ChartTypes, render, toText, validate, type Spec } from "@dataforseo-agent/util/chart"
import DESCRIPTION from "../chart.txt"

export const name = "chart"

const Series = Schema.Struct({
  name: Schema.String,
  lower_is_better: Schema.optional(Schema.NullOr(Schema.Boolean)).annotate({
    description: "Set for metrics that improve when they go down (lost links, cost, position)",
  }),
  labels: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))).annotate({
    description: "Scatter only: one name per point (keyword or domain), shown on hover",
  }),
  values: Schema.Array(Schema.Unknown).annotate({
    description: "Numbers (or null). Table cells may be strings or number arrays (sparklines). Scatter values are [x, y] pairs.",
  }),
})

export const Input = Schema.Struct({
  type: Schema.Literals(ChartTypes).annotate({ description: "Chart type" }),
  title: Schema.optional(Schema.NullOr(Schema.String)),
  subtitle: Schema.optional(Schema.NullOr(Schema.String)),
  x: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))).annotate({ description: "Category labels" }),
  series: Schema.optional(Schema.NullOr(Schema.Array(Series))),
  unit: Schema.optional(Schema.NullOr(Schema.String)),
  sort: Schema.optional(Schema.NullOr(Schema.Literals(["asc", "desc", "none"]))),
  limit: Schema.optional(Schema.NullOr(Schema.Number)),
  x_label: Schema.optional(Schema.NullOr(Schema.String)),
  y_label: Schema.optional(Schema.NullOr(Schema.String)),
  log: Schema.optional(Schema.NullOr(Schema.Union([Schema.Boolean, Schema.Literal("auto")]))),
  rows: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  cols: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  values: Schema.optional(Schema.NullOr(Schema.Array(Schema.Array(Schema.Union([Schema.Number, Schema.Null]))))),
  lower_is_better: Schema.optional(Schema.NullOr(Schema.Boolean)),
  center: Schema.optional(Schema.NullOr(Schema.Array(Schema.Number))).annotate({
    description: "Geogrid: [row, col] of the business location",
  }),
  source: Schema.optional(Schema.NullOr(Schema.String)).annotate({ description: "Endpoint and actual cost, shown under the chart" }),
  workflow: Schema.optional(Schema.NullOr(Schema.String)).annotate({
    description: "The workflow this chart belongs to (its name in \"Visuals by workflow\"), so its default views are checked",
  }),
  skip_defaults_reason: Schema.optional(Schema.NullOr(Schema.String)).annotate({
    description: "Only when deliberately not drawing the workflow's remaining default views: why",
  }),
})

// DataForSEO Agent: default chart types per workflow, written by tools/bridge.py next to the config.
// Re-read when the file changes (the bridge regenerates it), and never cache a missing file.
let visualsCache: { mtime: number; value: Record<string, string[]> } | undefined
function workflowDefaults(workflow: string): string[] | undefined {
  try {
    const file = path.join(process.env.DATAFORSEO_AGENT_CONFIG_DIR ?? Global.Path.config, "visuals.json")
    const mtime = statSync(file).mtimeMs
    if (visualsCache?.mtime !== mtime)
      visualsCache = { mtime, value: JSON.parse(readFileSync(file, "utf8")) as Record<string, string[]> }
    return visualsCache.value[workflow]
  } catch {
    return undefined
  }
}
// Types drawn so far, per session and workflow.
const drawn = new Map<string, Set<string>>()

/** Returns an error message when this chart skips ahead of the workflow's default views, else undefined. */
export function checkDefaults(
  key: string,
  type: string,
  defaults: readonly string[] | undefined,
  skipReason: string | undefined,
): string | undefined {
  if (!defaults || defaults.length === 0) return undefined
  const seen = drawn.get(key) ?? new Set<string>()
  const missing = [...new Set(defaults)].filter((t) => !seen.has(t) && t !== type)
  if (!defaults.includes(type) && missing.length > 0 && !skipReason)
    return `Chart not drawn: draw this workflow's default views first (${missing.join(", ")}), then this ${type}. If you are deliberately leaving some out, call again with skip_defaults_reason and end your answer with "Not drawn: <type> (reason)" for each.`
  seen.add(type)
  drawn.set(key, seen)
  return undefined
}

export const Output = Schema.Struct({ text: Schema.String })

export const Plugin = {
  id: "dataforseo.tool.chart",
  effect: Effect.fn("ChartTool.Plugin")(function* (ctx: Context) {
    yield* ctx.tool
      .transform((editor) => {
        editor.add({
          name,
          options: { codemode: false },
          description: DESCRIPTION,
          input: Input,
          output: Output,
          execute: (input, context) =>
            Effect.gen(function* () {
              const { workflow, skip_defaults_reason, ...rest } = input
              const spec = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null)) as unknown as Spec
              const errors = validate(spec)
              if (errors.length) return yield* new ToolFailure({ message: `Chart not drawn: ${errors.join(" ")}` })
              const defaults = workflow ? workflowDefaults(workflow) : undefined
              const order = checkDefaults(
                `${context.sessionID}:${workflow ?? ""}`,
                spec.type,
                defaults,
                skip_defaults_reason ?? undefined,
              )
              if (order) return yield* new ToolFailure({ message: order })
              const text = yield* Effect.try({
                try: () => toText(render(spec, 100)),
                catch: (error) => new ToolFailure({ message: `Chart not drawn: ${String(error)}`, error }),
              })
              const left = defaults ? defaults.filter((t) => !drawn.get(`${context.sessionID}:${workflow}`)?.has(t)) : []
              const note = left.length
                ? `\n\nWorkflow ${workflow} defaults not drawn yet: ${[...new Set(left)].join(", ")}. Draw them, or end your answer with "Not drawn: <type> (reason)" for each.`
                : ""
              return { output: { text: text + note }, content: text + note, metadata: { spec } }
            }),
        })
      })
      .pipe(Effect.orDie)
  }),
}
