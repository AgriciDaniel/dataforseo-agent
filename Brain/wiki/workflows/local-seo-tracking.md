---
type: workflow
skill: local-seo-tracking
title: "Local SEO Tracking"
description: "Use when tracking local pack and Google Maps rankings per location and pulling the Business Profile and review signals behind them."
modules: [serp, business-data]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Local SEO Tracking

> Use when tracking local pack and Google Maps rankings per location and pulling the Business Profile and review signals behind them.

## Trigger
A multi-location business (or a local-pack target) needs ranking visibility: a "near me" tracking program, a new storefront launch, or a reputation review. Inputs are a keyword set, a list of `location_coordinate` points (lat,lon,zoom), and the business identity (name/CID).

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Keywords and grid points or locations.
- Business name or `cid`.
- Device and cadence.

## Endpoints used (in order)
- `POST /v3/serp/google/local_finder/live/advanced` (Local Finder pack ranks).
- `POST /v3/serp/google/maps/live/advanced` (Maps results by coordinate).
- `POST /v3/business_data/google/my_business_info/task_post` then `task_get/$id` (or `/live`).
- `POST /v3/business_data/google/reviews/task_post` then `task_get/$id` (review stream).
- `POST /v3/business_data/google/my_business_updates/task_post` (profile change monitoring).

## Steps
1. Define the geo grid: for each tracked location set a `location_coordinate` (`latitude,longitude,zoom`) so rankings reflect a real searcher position, not a city centroid. Pick `device` and `language_code`.
2. Pull pack ranks: call `local_finder/live/advanced` (default 20 desktop / 10 mobile, max 100) and/or `maps/live/advanced` per keyword x coordinate. Optionally filter with `min_rating` or `time_filter` (e.g. `open_now`).
3. Parse `result.items[]` where `type == "local_pack"`: read `rank_absolute`, `rank_group`, `title`, `rating` (value, votes_count), `cid`, `phone`, `domain`. Match `cid`/`title` to your tracked business to record its pack position per location.
4. Enrich the profile: feed the matched `cid`/keyword to `my_business_info` to capture `address`, `phone`, `work_time`, `category`, `attributes`, `place_id`, and `rating` for NAP and profile-completeness checks.
5. Pull reviews via `reviews` (task-based) for the review stream (rating, text, timestamp, owner responses) to compute volume, average rating, and recency.
6. Watch for drift: schedule `my_business_updates` to catch profile edits, and re-run the pack queries on cadence to chart per-location position.
7. Roll up: build a location x keyword grid of pack position plus rating/review velocity for each storefront.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

L = grid points, K = keywords, R = runs.
- Ranks: L x K x R x task(`maps` or `local_finder`) for the chosen mode (one task per request; extra result blocks cost more).
- Profile: task(`my_business_info/task_post`) per tracked business per run.
- Reviews: task(`reviews/task_post`) per business, scaled by review blocks requested via `depth`.
- Re-collection within 30 days is free.

Cheapest mode: Maps and Local Finder in the Standard queue (`task_post`, $0.0006) instead of Live ($0.002).

Typical run (5 keywords on a 9 point grid, weekly for a month, plus profile info each run, Standard queue): 5 x 9 x 4 x $0.0006 + 4 x $0.0015 = $0.114 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A per-location local visibility dashboard: pack position by keyword and coordinate, profile completeness/NAP record, review volume and average rating trend, and a profile-change log. Complements [[rank-tracking]] for organic positions.

## Visuals
- `table`: position per keyword and location. Fields: `items[].rank_group`, `items[].domain`, `items[].title`. One row per keyword, sparkline column of past positions, lower_is_better.
- `line`: position over runs for the tracked business. Fields: `items[].rank_group`. lower_is_better; invert the axis; at least 3 runs.
- `geogrid`: the business's rank at each grid point, one chart per keyword. Fields: `items[].rank_group` of the item whose `items[].cid` (or `items[].place_id`, else `items[].domain`) matches the business, one Maps or Local Finder request per `location_coordinate`. Arrange the points by latitude (rows, north first) and longitude (cols, west first) into `values[][]`; null when the business is not in the results; `center` = [row, col] of the business's own location. lower_is_better.

## Tell the user
- Average position across the grid and where the business is in the top 3.
- Competitors that beat it, by area.
- Change against the previous run.
- Next: [[google-business-profile-audit]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- A `location_coordinate` without a zoom level, or a coarse city `location_name`, blurs local results; use precise lat,lon,zoom for trustworthy tracking.
- Local Finder/Maps are one task per request (no 100-task batching like organic); plan throughput around the per-location call count.
- Business Data review pulls are task-based; budget for the post-then-collect latency rather than expecting instant data.
- Mobile and desktop local packs differ in size (10 vs 20) and order; track them separately.
- `min_rating` ranges differ by device (3.5-4.5 desktop, 2-4.5 mobile); a filter that works on desktop may be invalid on mobile.
