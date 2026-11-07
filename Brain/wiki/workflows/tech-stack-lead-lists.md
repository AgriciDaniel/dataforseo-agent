---
type: workflow
skill: tech-stack-lead-lists
title: "Tech Stack Lead Lists"
description: "Use when building a list of websites that use a given technology (CMS, ecommerce platform, analytics tool), with size signals for prioritising."
modules: [domain-analytics, labs]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Tech Stack Lead Lists

> Use when building a list of websites that use a given technology (CMS, ecommerce platform, analytics tool), with size signals for prioritising.

## Trigger
Sales or partnership prospecting, for example all shops on a given platform in a country. Inputs: technology name or path, country or language filters.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Technology name or path.
- Country or language filters.
- Minimum traffic and list size.

## Endpoints used (in order)
- `POST /v3/domain_analytics/technologies/technologies_summary/live` (how many domains use it, by country)
- `POST /v3/domain_analytics/technologies/domains_by_technology/live` (the domain list)
- `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live` (traffic estimate per domain)

## Steps
1. Size the market with `technologies_summary` for the technology.
2. Pull domains with `domains_by_technology`, filtered by country or language and sorted by domain rank; page with `offset`.
3. Estimate organic traffic for the list with `bulk_traffic_estimation` (up to 1000 targets per call).
4. Rank leads by traffic and filter out tiny or inactive sites.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

D = domains returned.
- task + item x rows for `technologies_summary` and for `domains_by_technology` (set `limit`).
- ceil(D/1000) x (task + item x D) for `bulk_traffic_estimation`.

Cheapest mode: Live only; the technology endpoints charge $0.0012 per item, so filter in `domains_by_technology` and cap `limit`.

Typical run (summary, 500 domains, traffic estimates for 500): 2 x $0.012 + 501 x $0.0012 + $0.012 + 500 x $0.00012 = $0.6972 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A lead list: domain, technology, country, domain rank, estimated traffic.

## Visuals
- `table`: leads with technology, country and estimated traffic. Fields: `items[].domain`, `items[].technologies`, `items[].metrics` (metrics.organic.etv). Sort by traffic desc, top 50.
- `hbar`: domains using the technology per country. Fields: `countries` (technologies_summary). Sort desc, top 15.

## Tell the user
- The lead list sorted by traffic.
- Counts by country.
- That technology detection can miss or lag.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Detection reflects the last crawl and can miss server-side tools.
- `limit` plus `offset` must stay under 10000 per query; narrow with filters.
- Traffic is a Labs estimate.

Related: [[domain-analytics]] · [[labs]] · [[bulk-domain-metrics]]
