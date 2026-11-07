---
type: workflow
skill: ppc-keyword-planning
title: "PPC Keyword Planning"
description: "Use when planning a Google Ads or Microsoft Ads campaign: keyword ideas with bids, volume, and traffic and cost forecasts."
modules: [keywords-data]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# PPC Keyword Planning

> Use when planning a Google Ads or Microsoft Ads campaign: keyword ideas with bids, volume, and traffic and cost forecasts.

## Trigger
A new paid search campaign or a budget forecast. Inputs: seed keywords or a landing page, location, language, bid assumptions.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Seed keywords or a landing page.
- Location and language.
- Bid and daily budget assumptions, match type.

## Endpoints used (in order)
- `POST /v3/keywords_data/google_ads/keywords_for_keywords/task_post` (ideas with bids)
- `POST /v3/keywords_data/google_ads/search_volume/task_post` (volume, CPC, competition for the final list)
- `POST /v3/keywords_data/google_ads/ad_traffic_by_keywords/live` (clicks and cost forecast for a bid and match type)
- `POST /v3/keywords_data/bing/audience_estimation/live` (optional, Microsoft Ads audience size)

## Steps
1. Expand seeds with `keywords_for_keywords` (up to 20 seeds).
2. Shortlist and get volume, CPC, bid ranges and competition with `search_volume` (up to 1000 keywords per task).
3. Forecast clicks and cost with `ad_traffic_by_keywords` for the planned `bid` and `match` type.
4. Optionally size a Microsoft Ads audience with `audience_estimation`.
5. Group into ad groups and set a budget from the forecast.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- Each Google Ads call is one flat task price regardless of keyword count (up to the endpoint maximum): task(`keywords_for_keywords`) + task(`search_volume`) + task(`ad_traffic_by_keywords`) per bid scenario.
- Queue (`task_post`) is cheaper than Live for these endpoints.

Cheapest mode: Standard queue (`task_post`, $0.06 per task) instead of Live ($0.09); one task covers up to the endpoint's keyword maximum.

Typical run (keywords for keywords, search volume and ad traffic, Standard queue): 3 x $0.06 = $0.18 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Ad groups with keywords, volume, CPC and bid ranges, plus a clicks and cost forecast per scenario.

## Visuals
- `table`: keywords with volume, CPC and competition. Fields: `keyword`, `search_volume`, `cpc`, `competition`. Sort by volume desc, top 30.
- `grouped-bar`: forecast impressions per bid scenario. Fields: `bid`, `match`, `impressions` (ad_traffic_by_keywords). One group per scenario.
- `kpi`: Microsoft Ads audience estimate. Fields: `est_audience_size`, `est_clicks`, `est_spend`. Values [current].

## Tell the user
- The keyword list with CPC and competition.
- Forecast clicks and cost at the user's bid.
- Suggested ad groups.
- That forecasts are Google Ads estimates.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Google Ads Live is limited to 12 requests per minute per account.
- Ads volume is bucketed and grouped for similar keywords.
- Forecasts are Google's estimates, not guarantees.

Related: [[keywords-data]] · [[keyword-research]]
