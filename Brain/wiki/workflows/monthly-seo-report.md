---
type: workflow
skill: monthly-seo-report
title: "Monthly SEO Report"
description: "Use when building a monthly SEO report for one domain: organic traffic and keyword positions, top keywords, backlinks and new and lost links, with charts and month over month change."
modules: [labs, backlinks, serp]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-07
tags: [dataforseo, workflow, skill]
---

# Monthly SEO Report

> Use when building a monthly SEO report for one domain: organic traffic and keyword positions, top keywords, backlinks and new and lost links, with charts and month over month change.

## Trigger
A client or owner wants the monthly picture of one site: "how did we do this month". Run once a month, ideally on the same day.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Domain (without protocol).
- Location and language of the market that matters.
- Whether to include the 12 month history (adds about $0.13) and any tracked keywords from [[rank-tracking]].
- Last month's report, if one exists, for the comparison.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/domain_rank_overview/live` (estimated organic traffic, keyword count, position buckets)
- `POST /v3/dataforseo_labs/google/historical_rank_overview/live` (optional: the same metrics per month, for the trend)
- `POST /v3/dataforseo_labs/google/ranked_keywords/live` (top keywords with position and estimated traffic; `limit` 100, `order_by` etv desc)
- `POST /v3/backlinks/summary/live` (rank, backlinks, referring domains, spam score)
- `POST /v3/backlinks/timeseries_new_lost_summary/live` (new and lost backlinks and referring domains, `group_range` month)

## Steps
1. Confirm domain, location and language; check the balance with the free `GET /v3/appendix/user_data`.
2. Give the estimate below, then run; the app's request prompt approves each paid call ([[budget-gates]]).
3. Run `domain_rank_overview`, then `historical_rank_overview` if wanted (`date_from` 12 months back).
4. Run `ranked_keywords` sorted by estimated traffic, top 100.
5. Run Backlinks `summary` and `timeseries_new_lost_summary` for the last 12 months.
6. Compare with last month: from history if pulled, otherwise from the previous report.
7. Draw the visuals, then write the summary.

## Cost estimate
Notation: `task(x)` is the catalog per-task price of endpoint x; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- Labs: task + item x items for each Labs call; `historical_rank_overview` has its own higher price ($0.12 + $0.0012 per month).
- Backlinks: $0.024 per request + $0.000036 per returned row ([[backlinks]]).

Cheapest mode: all five endpoints are Live only. Skip the history call and compare with last month's saved report to save about $0.13.

Typical run (all five calls, 12 months of history, 100 keywords): $0.012 + 1 x $0.00012 + $0.12 + 12 x $0.0012 + $0.012 + 100 x $0.00012 + 2 x $0.024 + 13 x $0.000036 = $0.22899 (list prices from `research/endpoints.json`, checked 2026-11-06). Without history: about $0.085.

## Output
A one page report: headline numbers with change, traffic trend, position distribution, top keywords, link growth, and three to five actions.

## Visuals
- `kpi`: estimated traffic, ranked keywords, referring domains, domain rank, each with last month. Fields: `items[].metrics` (organic.etv, organic.count), `referring_domains`, `rank`. Previous values from history or last report.
- `line`: estimated organic traffic and keyword count per month. Fields: `items[].year`, `items[].month`, `items[].metrics` (organic.etv, organic.count). Only when history was pulled.
- `share-bar`: keywords by position bucket. Fields: `items[].metrics` (organic.pos_1, organic.pos_2_3, organic.pos_4_10, organic.pos_11_20). Unit keywords.
- `table`: top keywords. Fields: `items[].keyword_data` (keyword, keyword_info.search_volume), `items[].ranked_serp_element` (serp_item.rank_group, serp_item.etv, serp_item.url). lower_is_better on position; sort by etv desc, top 20.
- `diverging-bar`: new against lost referring domains per month. Fields: `items[].date`, `items[].new_referring_domains`, `items[].lost_referring_domains`. lower_is_better on the lost series.

## Tell the user
- The headline: traffic and keywords up or down, by how much, and the likely reason.
- Biggest keyword winners and losers, and pages that drive the most traffic.
- Link growth: net referring domains and anything unusual.
- Three to five actions for next month.
- That traffic and positions are Labs estimates, not Search Console data.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Keep location, language and `include_subdomains` identical every month, or the comparison breaks.
- Labs data refreshes on its own schedule; a month's change can lag real traffic.
- For exact tracked positions use [[rank-tracking]] data; Labs positions are from its own crawl.

Related: [[labs]] · [[backlinks]] · [[rank-tracking]] · [[backlink-audit]] · [[competitor-gap-analysis]]
