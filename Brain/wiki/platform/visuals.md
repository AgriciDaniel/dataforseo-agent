---
type: platform
title: "Visuals"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, platform, visuals]
---
# Visuals

Call the `chart` tool; never draw charts by hand. Each workflow lists its visuals under `## Visuals`.

## Choose
- Draw every type the workflow's Visuals section names first; add another type only after those, and say why.
- Prose: one number, or under 3 data points. Never chart fewer than 3 points.
- `table`: ranked lists (the default). `kpi`: headline numbers.
- Chart only when trend (`line`, `sparkline`), comparison (`hbar`, `grouped-bar`, `diverging-bar`), share (`share-bar`, no pies), correlation (`scatter`), grid (`heatmap`) or place (`geogrid` local rank grid, `tilemap` US states) is the point.

## Spec
`{ type, title, subtitle, x: labels[], series: [{ name, values[] }], unit, sort, limit }`
- `heatmap`: `{ rows[], cols[], values[][] }`.
- `scatter`: series values are `[x, y]` pairs, plus `x_label`, `y_label`, `series[].labels` (one name per point, on hover).
- `geogrid`: `values[][]` = rank per grid point (null = not found), `center: [row, col]`.
- `tilemap`: `x` = US state names or codes, one series.
- `kpi`: series `[{ name, values: [current, previous?] }]`.
- Optional: `source` (endpoint and actual cost), `lower_is_better: true` per series for
  positions, lost links, cost, difficulty, spam (flips kpi delta colors, heatmap colors, sparkline direction), `log: true | "auto"` for bars or scatter spanning 3+ orders of
  magnitude (auto is the default).

## Rules
- Use values from the response, not retyped numbers.
- Under every chart, cite the endpoint and the actual cost (`tasks[].cost`).
- `tasks[].cost` is the billed cost of that call; the catalog has the list price. When both appear, label each one.
- Sandbox responses are dummy data: say so in the prose and write "sandbox, dummy data" in `source`.
- Respect `limit` (usually top 10 to 25) and sort descending unless the metric has `lower_is_better`.
