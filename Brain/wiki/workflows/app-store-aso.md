---
type: workflow
skill: app-store-aso
title: "App Store Optimization"
description: "Use when doing ASO for an App Store or Google Play app: keyword rankings, competitors, keyword gaps, store search results and reviews."
modules: [labs, app-data]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# App Store Optimization

> Use when doing ASO for an App Store or Google Play app: keyword rankings, competitors, keyword gaps, store search results and reviews.

## Trigger
An app publisher wants to improve store visibility. Inputs: app id (numeric for App Store, package name for Google Play), target keywords, location.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- App id (numeric for App Store, package name for Google Play) and store.
- Target keywords, location and language.
- How many competitors and review blocks to pull.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/apple/keywords_for_app/live` or `/google/keywords_for_app/live` (keywords the app ranks for)
- `POST /v3/dataforseo_labs/apple/app_competitors/live` or `/google/app_competitors/live` (competing apps)
- `POST /v3/dataforseo_labs/apple/app_intersection/live` (keywords shared across apps)
- `POST /v3/app_data/apple/app_searches/task_post` or `/google/app_searches/task_post` (live store search results)
- `POST /v3/app_data/apple/app_reviews/task_post` (reviews; Google Play has the same shape)

## Steps
1. Pull `keywords_for_app` for the app (US and English only in Labs).
2. Find competitors with `app_competitors`; run `app_intersection` on the app and its top competitors to find keyword gaps.
3. Check live store rankings for priority keywords with `app_searches`.
4. Pull recent `app_reviews` for feature requests and complaints.
5. Recommend title, subtitle and keyword changes plus review-driven fixes.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- Labs: task + item x rows for each Labs endpoint used.
- Store searches: K x task(`app_searches`) per SERP (App Store blocks of 100, Google Play blocks of 30).
- Reviews: blocks x task(`app_reviews`) (App Store 25 per block, Google Play 150).

Cheapest mode: Labs app endpoints are Live only; App Data store searches and reviews in the Standard queue (`task_post`).

Typical run (Keywords for app (100), competitors (20), intersection (100), 10 store searches, 4 review blocks): 3 x $0.012 + 220 x $0.00012 + 10 x $0.0012 + 4 x $0.00075 = $0.0774 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Keyword ranking table, competitor keyword gaps, live positions for priority keywords, and review themes.

## Visuals
- `table`: keywords the app ranks for with position and volume. Fields: `items[].keyword_data`, `items[].ranked_serp_element`. lower_is_better on position; sort by volume desc, top 25.
- `table`: keyword gaps across the app and competitors. Fields: `items[].keyword_data`, `items[].intersection_result`. Sort by volume desc, top 25.
- `hbar`: review rating distribution. Fields: `items[].rating` (app_reviews task_get). Bars 5 to 1 stars, unit reviews.

## Tell the user
- Keywords the app ranks for, with positions.
- Keywords competitors rank for that the app does not.
- Review themes and the rating trend.
- That Labs app data covers the US in English only.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Labs app endpoints are US and English only.
- App ids differ by store.
- Store depth and billing blocks differ by store.

Related: [[labs]] · [[app-data]]
