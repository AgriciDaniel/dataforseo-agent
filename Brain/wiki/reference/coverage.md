---
type: meta
title: "DataForSEO Brain - Operator Dashboard"
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, meta, dashboard, health]
prices_as_of: 2026-11-06
confidence: practitioner
---

# DataForSEO Brain - Operator Dashboard

> Module coverage, live-test status, and the cost cheat-sheet. Hub: [[index|Master Index]] · [[index|Brain Home]] · [[hot|Hot]].


## Module coverage matrix
Every module has a capability concept note, raw endpoint docs, and (where accessible) a live fixture.

| Module | Concept note | Live-tested status |
|---|---|---|
| SERP | [[cap-serp-api]], [[cap-serp-google-verticals]], [[cap-serp-non-google-engines]] | yes (organic/maps/bing/youtube/news/images) |
| Keywords Data | [[cap-keywords-data-api]], [[cap-trends-and-clickstream]] | yes (Ads volume, Trends, clickstream) |
| DataForSEO Labs | [[cap-labs-keyword-research]], [[cap-labs-competitor-research]], [[cap-labs-market-analysis]] | yes (20 endpoints) |
| Backlinks | [[cap-backlinks-api]], [[cap-backlinks-bulk-metrics]] | yes (summary + bulk_ranks re-probed 2026-07-08) |
| OnPage | [[cap-onpage-api]] | yes (instant_pages) |
| Domain Analytics | [[cap-domain-analytics]] | yes (technologies, whois) |
| Content Analysis | [[cap-content-analysis-api]] | yes (search, summary) |
| Merchant | [[cap-merchant-api]] | partial (Shopping is Standard-only) |
| App Data | [[cap-app-data-api]] | documented |
| Business Data | [[cap-business-data-api]] | yes (business listings) |
| AI Optimization | [[cap-ai-optimization-api]], [[cap-llm-mentions-visibility]] | LLM Responses live (4 models); LLM Mentions search live 2026-07-08 |
| Databases | [[cap-databases]] | documented (bulk delivery) |

## Cost cheat-sheet (live-observed 2026-06-26, before the 2026-07-01 repricing; relative guidance only)
| Tier | Example | Cost |
|---|---|---|
| Cheapest | OnPage instant_pages | $0.00015 per page |
| Cheap | DataForSEO Labs | $0.012 per task + $0.00012 per item |
| Cheap | SERP Live Advanced (depth 10) | $0.002 |
| Medium | Content Analysis | $0.024 per task + $0.000036 per row |
| Higher | Keywords Data Google Ads ([[ent-google-ads-keyword-planner]]) | $0.06 Standard, $0.09 Live per task |
| Higher | Whois overview | $0.12 per task + $0.0012 per item |
| Highest | Clickstream DataForSEO Search Volume ([[ent-clickstream-data]]) | $0.18 per task |

Full ledger: `.raw/sources/dataforseo-research/_cost-log.json`; 2026-07-08 Backlinks and LLM Mentions re-probe ledger: `.raw/sources/dataforseo-research/_cost-log-2026-07-08-reprobe.json`. Strategy: [[dec-cost-control-strategy]].

## Navigation
[[index]] · [[index]] · [[index]] · [[index]] · [[index]] · [[index]]

## Refresh
Monthly for endpoint, parameter, and pricing drift. Prices are overdue: last verified 2026-06-26.
Most volatile: [[cap-ai-optimization-api]] and SERP feature coverage in [[cap-serp-google-verticals]].
