---
type: concept
title: "Data Collection Methodology"
domain: dataforseo
subdomain: market
status: stable
created: 2026-06-26
updated: 2026-06-26
tags: [dataforseo, market, data-sourcing]
related:
 - "[[cap-platform-architecture]]"
 - "[[cap-databases]]"
 - "[[cap-trends-and-clickstream]]"
confidence: evidence-based
---

# Data Collection Methodology

> Where DataForSEO's numbers come from: its own SERP scraper farm, its own backlink crawler, Google Ads + Bing Ads keyword data, and clickstream panels, delivered as both live scrapes and large stored databases. Sits under [[index|DataForSEO Brain]] → [[index|Concepts]].

## Overview
DataForSEO is an API-first data provider that runs its own collection infrastructure rather than reselling a single panel. It scrapes "only publicly available information from SERPs," crawls the web for backlinks "each second nonstop," sources keyword volume from Google Ads and Bing Ads, and refines volume with clickstream. Output is offered both live (fresh scrape) and via large pre-indexed databases, so cost and freshness can be traded off per query. Understanding the source lineage explains accuracy, freshness, and why DataForSEO is cheaper than scraping middleware.

## What it covers
- Own SERP scraping: in-house scraper farm; "scrapes only publicly available information from SERPs" and supplies it structured.
- Own backlink crawler: crawls "the web each second nonstop," feeding the Backlinks API.
- Keyword source: Google Ads + Bing Ads services; the keyword index is "collected using Google Ads and Bing Ads services."
- Clickstream: own and partner panels, used to refine search volume (the `use_clickstream`/`include_clickstream_data` options).
- Delivery: both live scrape and large stored databases (the pre-indexed Databases product). See [[cap-databases]].

## Key parameters / inputs
- `use_clickstream` / `include_clickstream_data` - select clickstream-refined volume (doubles Labs request cost when enabled).
- Choice of live SERP/Keywords vs Labs/Databases selects fresh-scrape vs stored data.
- DataForSEO Search Volume re-distributes Google Ads buckets using Bing Ads or clickstream counts.

## Response / what you get back
- Official "Our Data" live counters (2026-06-26): ~8.08B Google keywords, ~4.35B Bing keywords; backlinks index ~1.96T live backlinks across ~197.8B live pages and ~681.7M backlink domains; ~544M stored Google SERPs.
- Note a flagged index discrepancy: vendor pages have cited ~2.02T live backlinks / 289.5M domains while the live counter showed ~1.96T / ~681M - the live counter is the more current figure.
- Keyword volume can be returned raw (Google Ads), Bing-refined, or clickstream-refined.

## Cost & method notes
Live SERP/Keywords cost more and are fresher; Labs/Databases are pre-indexed and cheaper (Labs "is not a scraper" - it queries a pre-computed database of 8B+ keywords). Practitioner estimates put routing non-fresh queries to Labs at ~60-70% cheaper (third-party estimate, not official). Update cycles: SERP/app listings every 60 and 90 days; keyword data monthly; historical SERP snapshots from Aug 2021; historical keyword data from 2019. See [[cap-queue-priority-cost-model]] and [[dec-labs-vs-live-apis]].

## When to use / how it fits
Use this to judge data freshness and accuracy when choosing endpoints in [[which-api-for-which-job]] and [[dataforseo-vs-ahrefs-semrush-moz]]. It explains the volume choices in [[keyword-research]] and the lineage behind [[cap-keywords-data-api]] and [[cap-backlinks-api]].

## Gotchas / limits
- Default plain search volume mirrors Google Keyword Planner averages unless you opt into the clickstream-refined endpoint.
- Tool-to-tool volume discrepancies commonly run 30%-200% because clickstream panels are samples, not censuses - treat volumes as relative indicators.
- DataForSEO's backlink/keyword index is smaller than Ahrefs (35T) / Semrush (43T) backlinks; link-depth-critical work may still favor those. See [[dataforseo-vs-ahrefs-semrush-moz|Ahrefs]], [[dataforseo-vs-ahrefs-semrush-moz|Semrush]].
- Upstream Google Ads bucketing (~80 logarithmic values) is the root cause the DataForSEO Search Volume metric tries to break. See [[ent-google-ads-keyword-planner]].

- Clickstream is sourced from own and partner panels. See [[ent-clickstream-data]].

## Related
- [[index]]
- [[index]]
- [[cap-platform-architecture]]
- [[cap-databases]]
- [[cap-trends-and-clickstream]]
- [[cap-keywords-data-api]]
- [[cap-backlinks-api]]
- [[ent-dataforseo]]
- [[ent-clickstream-data]]
- [[ent-google-ads-keyword-planner]]
- [[dataforseo-vs-ahrefs-semrush-moz]]
- [[dec-labs-vs-live-apis]]

## Sources
- https://dataforseo.com/our-data (retrieved 2026-06-26)
- https://dataforseo.com/apis/backlinks-api (retrieved 2026-06-26)
- https://dataforseo.com/blog/dataforseo-search-volume-precision-in-our-apis (retrieved 2026-06-26)
- https://dataforseo.com/apis/clickstream-data-api (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/databases/overview/ (retrieved 2026-06-26)
