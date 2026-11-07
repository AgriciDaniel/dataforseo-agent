---
type: workflow
skill: rank-tracking
title: "Rank Tracking Pipeline"
description: "Use when tracking keyword positions over time for a keyword x location x device set; builds a scheduled SERP queue with webhooks and a position time series."
modules: [serp]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Rank Tracking Pipeline

> Use when tracking keyword positions over time for a keyword x location x device set; builds a scheduled SERP queue with webhooks and a position time series.

## Trigger
A defined tracking set is created or refreshed: each row is a `keyword` plus a `location_code` (or `location_name`/`location_coordinate`), `language_code`, and `device` (desktop/mobile). Cadence is fixed (usually daily or weekly) and a scheduler fires the run.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Keywords and the target domain.
- Location, language and device.
- Cadence and depth.

## Endpoints used (in order)
- `POST /v3/serp/google/organic/task_post` (Advanced result type) to enqueue the batch.
- `GET /v3/serp/google/organic/tasks_ready` to discover completed task ids (fallback to webhooks).
- `GET /v3/serp/google/organic/task_get/advanced/$id` to collect parsed SERPs.
- `POST /v3/appendix/webhook_resend` to recover missed pingbacks/postbacks.
- `GET /v3/appendix/user_data` for balance and daily-cost-limit monitoring.

## Steps
1. Build the targeting per row: resolve `location_code` and `language_code` from the locations/languages helper (see [[cap-locations-languages-targeting]]); pick `device` and optional `depth` (default 10, max 200).
2. Batch up to 100 rows into one `task_post` call (one billed task each, one HTTP request). Set `priority: 1` (Normal) for cheapest, or `priority: 2` (High) when same-day freshness matters. Attach a unique `tag` per keyword for routing.
3. Register delivery: set `postback_url` with `postback_data: "advanced"` to receive gzip-compressed parsed results, or `pingback_url` for a completion ping then `task_get`. Use `?id=$id&tag=$tag` macros so each callback self-identifies.
4. On webhook receipt (or via `tasks_ready` polling once per minute as fallback), fetch/decode the result. Each `result.items[]` is a typed SERP element.
5. Filter `items[]` where `type == "organic"` and `domain`/`url` matches the tracked target; read `rank_absolute` (true position incl. features) and `rank_group` (position within organic). Capture `rank_changes` if comparing snapshots and the `item_types` array for SERP-feature presence (featured_snippet, ai_overview, local_pack, etc.).
6. Persist a timestamped row per keyword (`result.datetime`, `check_url`, rank, feature flags). Standard results stay retrievable for 30 days, so re-collection within that window is free if a write fails.
7. Re-fire on the schedule (cron). For any task whose webhook never arrived, call `webhook_resend` with up to 100 ids (no double charge).
8. Poll `user_data` sparingly (limit 6/min) to watch `money.balance` and avoid the daily cost cap (error 40203).

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

K = tracked keyword rows (keyword x location x device), R = runs per month.
- Per run: K x task(`/v3/serp/google/organic/task_post`) at the chosen priority. Depth beyond the base block adds blocks; special operators multiply by 5.
- Monthly: per run x R. `tasks_ready`, `task_get` and webhook resend are free.
- Compare against K x task(`/v3/serp/google/organic/live/advanced`) to show the Live premium; recommend Live only for ad-hoc checks.
- Cadence: daily for priority terms, weekly for the long tail.

Cheapest mode: Standard queue (`task_post`, $0.0006 per SERP); Priority $0.0012; Live $0.002 only for ad hoc checks.

Typical run (100 keywords daily for 30 days, Standard queue): 100 x 30 x $0.0006 = $1.80 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A position time-series table (keyword, location, device, date, rank_absolute, rank_group, url, SERP-feature flags) feeding rank-trend charts, win/loss alerts, share-of-voice rollups, and SERP-feature monitoring. Pairs naturally with [[competitor-gap-analysis]] and [[content-brief]].

## Visuals
- `table`: keywords with current position, change and history. Fields: `items[].rank_absolute`, `items[].domain`, `items[].url`. Sparkline column of past positions, lower_is_better, sort by position asc.
- `distribution`: rank distribution of the tracked domain (add competitors as more series). Fields: `items[].metrics` (metrics.organic.pos_1, pos_2_3, pos_4_10, pos_11_20, pos_21_30 and up). x = buckets best first, one series per domain.
- `heatmap`: position by keyword and run when there are 3 or more runs. Fields: `items[].rank_absolute`. rows = keywords, cols = run dates, lower_is_better, null where not ranking.
- `line`: average position over runs. Fields: `items[].rank_absolute`. lower_is_better; invert the axis; at least 3 runs.

## Tell the user
- Average position and its change.
- Winners, losers, and keywords entering or leaving the top 10.
- SERP feature changes.
- Next: [[content-brief]] for the losers.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Keyword special operators (`site:`, `filetype:`, `allinanchor:`, etc.) trigger a 5x keyword-cost multiplier; strip them from tracked terms unless intended.
- Standard results expire after 30 days; requesting them later returns error 40403. Live results are never stored, so a dropped Live response is lost.
- Rate ceiling is 10,000 calls/min (account limit) and max 100 tasks per `task_post`; Live SERP also has a 120s timeout.
- Do not engineer concurrency to beat the queue. DataForSEO explicitly advises Standard + High priority over Live for bulk; webhooks unlock 100,000+ tasks/day.
- `device: mobile` and `desktop` are different SERPs; track them as separate rows, not one.
