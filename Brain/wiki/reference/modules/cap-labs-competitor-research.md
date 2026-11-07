---
type: concept
title: "Labs Competitor Research (Capability)"
domain: dataforseo
subdomain: labs
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, labs, competitor-research]
related:
  - "[[cap-labs-keyword-research]]"
  - "[[cap-labs-market-analysis]]"
  - "[[cap-backlinks-api]]"
  - "[[competitor-gap-analysis]]"
prices_as_of: 2026-11-06
confidence: evidence-based
---

# Labs Competitor Research (Capability)

> The DataForSEO Labs competitor endpoints map who ranks for what: SERP competitors, ranked keywords, domain and page intersections, rank overviews, traffic estimates, and the Amazon / Google Play / App Store equivalents, all from a pre-indexed database. Sits under [[index|DataForSEO Brain]] -> [[index|Concepts]].

## Overview
Where the keyword-research family expands a seed, the competitor family analyzes domains, pages, ASINs, and apps. It answers "who else ranks for my keywords", "what does this domain rank for", "which keywords do two domains share", and "how much traffic does this domain or app get". Like all of Labs, the data is pre-indexed (not a live SERP scrape), updated periodically, with historical series available from October 2020 onward. All endpoints are Live POST calls under `/v3/dataforseo_labs/{engine}/{function}/live`.

## What it covers
- `/v3/dataforseo_labs/google/serp_competitors/live` - domains ranking for a set of keywords (up to 200) with their SERP positions and visibility.
- `/v3/dataforseo_labs/google/competitors_domain/live` - competitor domains that share SERPs with a target, with organic and paid metrics.
- `/v3/dataforseo_labs/google/ranked_keywords/live` - every keyword a domain or page ranks for, with its SERP element and volume.
- `/v3/dataforseo_labs/google/domain_intersection/live` and `/v3/dataforseo_labs/google/page_intersection/live` - keywords two or more targets both rank for (link/keyword gap analysis).
- `/v3/dataforseo_labs/google/relevant_pages/live` - a domain's pages with ranking distribution and estimated traffic.
- `/v3/dataforseo_labs/google/domain_rank_overview/live` and `/v3/dataforseo_labs/google/subdomains/live` - ranking distribution and traffic for a domain or its subdomains.
- `/v3/dataforseo_labs/google/historical_rank_overview/live` and `/v3/dataforseo_labs/google/historical_serps/live` - weekly historical ranking distribution and SERP snapshots.
- `/v3/dataforseo_labs/google/bulk_traffic_estimation/live` and `/v3/dataforseo_labs/google/historical_bulk_traffic_estimation/live` - estimated monthly traffic for up to 1000 domains/pages.
- Amazon: `product_competitors`, `ranked_keywords`, `product_keyword_intersections`, `product_rank_overview`. Apps: `apple/app_competitors`, `apple/app_intersection`, `apple/bulk_app_metrics`, and the `google/app_*` equivalents (up to 1000 apps in bulk).

## Key parameters / inputs
| field | notes |
|---|---|
| target / targets | single domain or array of domains/pages; bulk_traffic_estimation takes up to 1000 targets |
| keywords / keyword | competitor discovery seeds (serp_competitors max 200) |
| asin / asins, app_id / app_ids | Amazon ASINs and app ids; intersection endpoints cap at 20, bulk at 1000 |
| location_code / language_code | required location and language identifiers |
| intersections | toggles keyword-intersection filtering |
| include_clickstream_data | doubles cost; default false |
| filters / order_by / limit | max 8 filters, max 3 sort rules, limit up to 1000 |

## Response / what you get back
Domain metrics arrive under `metrics.organic.*` and `metrics.paid.*`, including `metrics.organic.count`, `metrics.organic.etv` (estimated traffic volume), and the position brackets `metrics.organic.pos_1` through `pos_91_100`. `full_domain_metrics` covers all of a domain's keywords. Per-keyword ranking detail comes through `ranked_serp_element` and `avg_position`. Intersection endpoints return `intersections` (count of shared keywords) and `intersection_result` (per-target SERP data), each keyword carrying `keyword_data.keyword_info` and `search_volume`.

## Cost & method notes
- All endpoints are Live; per-request billing. serp_competitors, competitors_domain, ranked_keywords, domain_intersection, relevant_pages, subdomains, keywords_for_site, domain_rank_overview and bulk_traffic_estimation cost $0.012 per task + $0.00012 per item; the historical endpoints cost more: historical_rank_overview and historical_bulk_traffic_estimation $0.12 + $0.0012 per item, historical_serps $0.00012 per SERP (catalog, 2026-11-06).
- `etv` is computed as the product of click-through rate and search volume; `clickstream_etv` is the clickstream-based alternative.

## When to use / how it fits
This is the spine of [[competitor-gap-analysis]] (domain intersection + ranked keywords + backlinks intersection + technologies) and supports [[content-brief]] and [[ecommerce-product-research]]. Pair domain intersection here with [[cap-backlinks-api]] intersection for a full gap picture, and route jobs via [[which-api-for-which-job]].

## Gotchas / limits
- 10000 API calls/min (raised from 2000 on 2026-10-19 per the DataForSEO updates feed), max 30 simultaneous requests.
- Historical rank/traffic series start October 1, 2020; clickstream data from May 2024; `historical_serps` covers a 12-month window with `keyword` up to 700 chars.
- Amazon endpoints are limited to a handful of marketplaces; App Store and Google Play endpoints are US/English only.
- Traffic and rank figures are estimates from a pre-indexed database, not measured analytics; treat them as directional, not exact.

## Related
- [[cap-labs-keyword-research]]
- [[cap-labs-market-analysis]]
- [[cap-backlinks-api]]
- [[cap-domain-analytics]]
- [[cap-serp-api]]
- [[cap-platform-architecture]]
- [[cap-queue-priority-cost-model]]
- [[plat-google-search]]
- [[plat-amazon-marketplace]]
- [[competitor-gap-analysis]]
- [[dec-labs-vs-live-apis]]
- [[which-api-for-which-job]]
- [[index]]
- [[index]]

## Sources
- https://docs.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live/ (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/dataforseo_labs/google/domain_intersection/live/ (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/dataforseo_labs/google/bulk_traffic_estimation/live/ (retrieved 2026-06-26)
