---
type: workflow
skill: trends-research
title: "Trends Research"
description: "Use when checking whether interest in a topic is rising or falling, its seasonality, regional interest and demographics."
modules: [keywords-data, labs]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Trends Research

> Use when checking whether interest in a topic is rising or falling, its seasonality, regional interest and demographics.

## Trigger
Timing content or campaigns, validating a niche, or explaining a traffic change. Inputs: up to 5 keywords per comparison, location.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Up to 5 keywords per comparison.
- Location and date range.
- Source: Google Trends, DataForSEO Trends or both.

## Endpoints used (in order)
- `POST /v3/keywords_data/google_trends/explore/live` (Google Trends relative interest)
- `POST /v3/keywords_data/dataforseo_trends/explore/live` (DataForSEO Trends over time)
- `POST /v3/keywords_data/dataforseo_trends/subregion_interests/live` (interest by region)
- `POST /v3/keywords_data/dataforseo_trends/demography/live` (age and gender)
- `POST /v3/dataforseo_labs/google/historical_search_volume/live` (monthly volume history)

## Steps
1. Compare up to 5 keywords in Google Trends for the time range needed.
2. Add DataForSEO Trends explore for a second view; add subregion and demography if targeting matters.
3. Pull historical search volume for absolute monthly numbers.
4. Summarise direction, seasonality peaks, top regions and audience.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

C = keyword comparisons (5 keywords each).
- C x (task(`google_trends/explore`) + task(`dataforseo_trends/explore`) + optional subregion and demography tasks).
- Historical volume: task + item x keywords.

Cheapest mode: DataForSEO Trends explore ($0.0012); Google Trends in the Standard queue ($0.0027) instead of Live ($0.011).

Typical run (1 comparison in both sources plus historical volume for 5 keywords): $0.0027 + $0.0012 + $0.012 + 5 x $0.00012 = $0.0165 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Trend direction, seasonal peaks, regional and demographic split, and monthly volume history.

## Visuals
- `line`: relative interest over time, one series per keyword. Fields: `items[].data`, `items[].keywords`. Max 5 series, scale 0 to 100.
- `tilemap`: US interest by state, when the location is the United States. Fields: `items[].interests` (geo_name, values). x = state names from geo_name, one series per keyword (the first if several). Scale 0 to 100.
- `hbar`: interest by subregion for countries other than the US. Fields: `items[].interests` (geo_name, values). Sort desc, top 15.
- `grouped-bar`: interest by age and gender. Fields: `items[].demography`. One group per age band.

## Tell the user
- Trend direction and seasonal peaks.
- Regional differences.
- That trends are a 0 to 100 index, not search volume.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Trends values are relative (0 to 100), not search volume.
- Google Trends Live is limited system-wide to 250 tasks per minute.
- Max 5 keywords per Trends request.

Related: [[keywords-data]] · [[labs]] · [[keyword-research]]
