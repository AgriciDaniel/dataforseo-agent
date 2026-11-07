---
type: module
module: labs
title: "DataForSEO Labs API"
agent_description: "Use for cheap pre-indexed keyword research and competitive intelligence: keyword ideas, suggestions, related keywords, difficulty, intent, ranked keywords, competitors, domain and page intersections, traffic estimates, categories, Amazon and app keywords."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# DataForSEO Labs API

## Purpose
Analytics over DataForSEO's own pre-indexed keyword and SERP database. No live scraping, so it is fast and cheap per item, but data is periodic rather than real time.

## Use when
- Expanding seeds into keyword ideas, scoring difficulty and intent in bulk (up to 1000 per call).
- Finding who ranks for what: ranked keywords, SERP competitors, domain and page intersections, rank overviews, bulk traffic estimation.
- Market sizing by Google product category; Amazon keyword demand; App Store and Google Play keyword rankings.

## Do not use when
- You need today's exact SERP or AI Overview: use [[serp]].
- You need Google Ads ground-truth volume or bids for ad buying: confirm in [[keywords-data]].

## Defaults
- Live only (there is no queue); keep within 30 simultaneous requests.
- Leave `include_clickstream_data` off unless demographics or clickstream volume are asked for (it about doubles the cost).
- Use `limit` and filters to cap returned items, since items are billed.

## Gotchas
- Historical series start October 2020; clickstream data from May 2024.
- App keyword endpoints are US and English only; Amazon related keywords cover only a few marketplaces.
- `domain_intersection` takes exactly two targets; for many competitors run pairwise or start with `competitors_domain`.
- Use `offset_token` beyond 10000 results.
- Traffic and rank figures are model estimates; label them that way.
- Not every Labs Google endpoint is $0.012 + $0.00012: `historical_rank_overview`, `historical_bulk_traffic_estimation` and `domain_metrics_by_categories` cost $0.12 + $0.0012 per item or domain (pricing page, checked 2026-11-06; live test billed $0.1212 for one domain). Read the catalog entry.

## Search volume fields
- `keyword_info.search_volume`: DataForSEO documents it as "average monthly search volume rate", the approximate number of searches on google.com. The docs give no averaging period ([keyword_overview](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live/) and [keyword_ideas](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live/) docs, checked 2026-11-06).
- `keyword_info.monthly_searches[]`: per month `year`, `month`, `search_volume`, "as available for the past twelve months" (same pages).
- They are separate figures. `search_volume` is not the mean of `monthly_searches`: in a 2026-11-06 QA file the headline was 201,000, equal to the latest month, while the 12-month mean was 181,017 (`research/qa-report.md`, Round D rerun).
- Rule: call it "search volume" (or "monthly search volume"), never "the 12-month average" or any other period. When an average is needed, compute it from `monthly_searches` and name the months used.

Reference: [[cap-labs-keyword-research]], [[cap-labs-competitor-research]], [[cap-labs-market-analysis]].
