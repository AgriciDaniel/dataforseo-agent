---
type: workflow
skill: serp-snapshot
title: "SERP Snapshot"
description: "Use when someone wants to see the current Google results page for a keyword, location and device, optionally with a screenshot and an AI summary of the page."
modules: [serp]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# SERP Snapshot

> Use when someone wants to see the current Google results page for a keyword, location and device, optionally with a screenshot and an AI summary of the page.

## Trigger
A one-off question such as "what ranks for X in Y right now", a client screenshot, or a quick look before a content decision. Inputs: keyword, location, language, device.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Keyword.
- Location, language and device.
- Depth and add-ons (screenshot, AI summary).

## Endpoints used (in order)
- `POST /v3/serp/google/organic/live/advanced` (the parsed SERP)
- `POST /v3/serp/screenshot` (optional image of the same SERP, by `task_id`)
- `POST /v3/serp/ai_summary` (optional LLM summary of the same SERP, by `task_id`)

## Steps
1. Resolve `location_code` and `language_code`; pin `device`.
2. Call organic `live/advanced` with `depth` at the base block. Add `load_async_ai_overview` only if AI Overview matters (extra charge).
3. Read `item_types` to list the features present, then the organic items (`rank_absolute`, `domain`, `url`, `title`).
4. If the user wants an image, call `screenshot` with the returned task `id` (the source task must be recent).
5. If the user wants a narrative, call `ai_summary` with the task `id` and a short `prompt`.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- 1 x task(`google/organic/live/advanced`), plus one extra base price per add-on enabled and per extra block of depth.
- Optional: task(`serp/screenshot`) and task(`serp/ai_summary`).
- For more than a handful of keywords, use the Standard queue instead (see [[rank-tracking]]).

Cheapest mode: Live ($0.002) for one keyword right now; the Standard queue ($0.0006) when a few minutes is fine.

Typical run (1 SERP Live plus a screenshot): $0.002 + $0.004 = $0.006 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A short table of the top results and the SERP features present, plus the screenshot and summary if requested.

## Visuals
- `table`: ranked results. Fields: `items[].rank_absolute`, `items[].type`, `items[].domain`, `items[].title`. Rank order, top 20.
- `share-bar`: SERP feature types present. Fields: `items[].type`. Count of items per type, unit percent.

## Tell the user
- Top results and SERP features present.
- Where the user's domain ranks, if given.
- Next: [[rank-tracking]] to follow it over time.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Live results are not stored; save the response if the user may want it later.
- Special operators (`site:`, `filetype:`) multiply the charge by 5.
- Desktop and mobile SERPs differ; say which one you pulled.

Related: [[serp]] · [[rank-tracking]]
