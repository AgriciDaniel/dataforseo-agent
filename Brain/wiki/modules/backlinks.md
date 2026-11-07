---
type: module
module: backlinks
title: "Backlinks API"
agent_description: "Use for link intelligence from DataForSEO's own backlink index: summaries, backlink lists, anchors, referring domains and networks, competitors, link gaps, new and lost links, and bulk rank and spam metrics for up to 1000 targets."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Backlinks API

## Purpose
Link profiles from DataForSEO's continuously crawled backlink index for any domain, subdomain or URL.

## Use when
- Auditing a profile: summary, referring domains, anchors, new and lost links, history.
- Link gaps: who links to competitors but not to the target (`domain_intersection`, `page_intersection`).
- Scoring a list: bulk ranks, spam scores, backlink and referring-domain counts for up to 1000 targets in one call.

## Do not use when
- The deliverable depends on the deepest possible link index (Ahrefs and Semrush report larger indexes); say so, see [[dataforseo-vs-ahrefs-semrush-moz]].

## Defaults
- Bulk endpoints first to triage a list, then per-target endpoints for the shortlist.
- Set `include_subdomains`, `include_indirect_links`, `exclude_internal_backlinks` and `rank_scale` explicitly and keep them identical across runs.
- Cap rows with `limit` and filters; rows are billed.

## Billing: per request plus per returned row
- Every paid Backlinks endpoint: cost = $0.024 per request + $0.000036 x rows returned (catalog `price.tiers`, "Per task + per row"; [pricing page](https://dataforseo.com/pricing/backlinks/backlinks), checked 2026-11-06).
- A row is one object in the result: one backlink, referring domain, anchor, page or bulk target ([help center](https://dataforseo.com/help-center/backlinks-api-pricing-explained), retrieved 2026-06-26).
- Rows are billed as returned. `limit` only caps the worst case: a call with `limit` 1000 that returns 240 rows costs $0.024 + 240 x $0.000036 = $0.03264. Billed costs match: `summary/live` (1 row) $0.024036, `bulk_ranks/live` (2 targets) $0.024072 (2026-07-08 probe, `.raw/.../_cost-log-2026-07-08-reprobe.json`).
- Worked example, 5000 backlinks of one domain: 5 requests of 1000 rows = 5 x $0.024 + 5000 x $0.000036 = $0.12 + $0.18 = $0.30. Estimate with `limit` as the maximum, report the billed `tasks[].cost`.
- Free: `index`, `available_filters`, `errors`, `id_list`.

## Gotchas
- Live only, pay-as-you-go since 2026-07-01 (no subscription; 40204 is legacy here).
- Rank (0 to 1000 by default, PageRank-style with damping 0.5) and spam score (0 to 100) are DataForSEO model estimates, not Google signals.
- History from January 2019; new and lost fields only from May 2021.
- `offset` up to 20000; bulk new and lost windows max 365 days; `bulk_pages_summary` max 100 distinct domains.
- List endpoints (`backlinks`, `anchors`, `referring_domains`, `referring_networks`, `domain_pages`, `domain_pages_summary`, `competitors`, `domain_intersection`, `page_intersection`) return at most 1000 items per request (`limit` max 1000, default 100). Larger pulls paginate: `offset` in steps of `limit`, or `search_after_token` on `backlinks/live` (the only list endpoint that has it; use it for pulls beyond the `offset` ceiling). Requests = ceil(rows wanted / 1000); price each request as task plus rows.

Reference: [[cap-backlinks-api]], [[cap-backlinks-bulk-metrics]].
