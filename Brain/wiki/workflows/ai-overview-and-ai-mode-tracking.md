---
type: workflow
skill: ai-overview-and-ai-mode-tracking
title: "AI Overview and AI Mode Tracking"
description: "Use when tracking whether and how Google AI Overview and AI Mode answer a set of keywords, which sources they cite, and whether a brand appears."
modules: [serp, ai-optimization]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# AI Overview and AI Mode Tracking

> Use when tracking whether and how Google AI Overview and AI Mode answer a set of keywords, which sources they cite, and whether a brand appears.

## Trigger
A brand wants to know its presence in Google's generative answers for its money keywords. Inputs: keyword set, location, language, target domain or brand.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Keyword set and the brand or domain to look for.
- Location, language and device.
- Surfaces: AI Overview, AI Mode or both, and runs per month.

## Endpoints used (in order)
- `POST /v3/serp/google/organic/task_post` with `load_async_ai_overview: true` (AI Overview inside organic SERPs)
- `POST /v3/serp/google/ai_mode/live/advanced` (AI Mode answers)
- `POST /v3/ai_optimization/llm_mentions/search_mentions/live` with `platform: google` (optional, mentions database for AI Overview)

## Steps
1. Queue organic tasks for the keyword set with `load_async_ai_overview: true` and the `advanced` result type.
2. Collect results and extract `ai_overview` items and their references; record whether the target domain is cited.
3. For keywords where AI Mode matters, call `ai_mode/live/advanced` and read `ai_overview_reference` citations.
4. Optionally query LLM Mentions (`platform: google`) for the brand to see mentions beyond the tracked keywords.
5. Store per keyword and date: AI Overview present, cited, position of citation, AI Mode cited.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

K = keywords, R = runs per month.
- AI Overview: K x R x task(`google/organic/task_post`) x 2 (the async AI Overview add-on costs one extra base price).
- AI Mode: K_m x R x task(`google/ai_mode/live/advanced`) for the subset K_m that needs it.
- Optional mentions: task(`search_mentions`) + item(`search_mentions`) x rows.

Cheapest mode: Standard queue for both: organic `task_post` ($0.0006, doubled by the AI Overview add-on) and `serp/google/ai_mode/task_post` ($0.0012) instead of AI Mode Live ($0.004).

Typical run (50 keywords with AI Overview weekly plus 10 keywords in AI Mode weekly, Standard queue, one month): 50 x 4 x 2 x $0.0006 + 10 x 4 x $0.0012 = $0.288 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Per keyword and run: AI Overview present or not, sources cited, whether the brand is cited, and the same for AI Mode; trend over runs.

## Visuals
- `table`: keyword by run with AI Overview present, brand cited, citation position. Fields: `items[].type` (ai_overview), `items[].items`, `items[].rank_absolute`. One row per keyword, newest run first.
- `line`: share of tracked keywords where the brand is cited, per run. Fields: `items[].type`, `items[].items`. Unit percent, at least 3 runs.
- `share-bar`: domains cited in AI Overview and AI Mode answers. Fields: `items[].sources` (search_mentions), `items[].items`. Top 8, rest grouped as other.

## Tell the user
- Share of keywords that show an AI Overview or AI Mode answer.
- Share of those that cite the brand, and which domains are cited instead.
- Change against the previous run.
- That AI answers vary between runs; one run is a sample.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- AI Overview does not appear for every query or every run; track presence rate, not just citations.
- AI Mode is a separate, higher price tier; sample it rather than running every keyword.
- LLM Mentions `google` data covers AI Overview, not AI Mode.

Related: [[serp]] · [[ai-optimization]] · [[ai-visibility-tracking]]
