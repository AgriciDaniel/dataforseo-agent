---
type: workflow
skill: bulk-domain-metrics
title: "Bulk Domain Metrics"
description: "Use when scoring a long list of domains at once: estimated organic traffic, link rank, referring domains and spam score."
modules: [labs, backlinks]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Bulk Domain Metrics

> Use when scoring a long list of domains at once: estimated organic traffic, link rank, referring domains and spam score.

## Trigger
Prospect lists, acquisition screening, or portfolio reporting. Inputs: up to thousands of domains.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- The domain list.
- Location and language for the traffic estimate.
- Sort or filter criterion (traffic, rank, spam).

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live` (traffic estimate, up to 1000 targets)
- `POST /v3/backlinks/bulk_ranks/live` (rank)
- `POST /v3/backlinks/bulk_referring_domains/live` (referring domains)
- `POST /v3/backlinks/bulk_spam_score/live` (spam score)

## Steps
1. Clean the list (domains without protocol), dedupe, split into batches of 1000.
2. Run the four bulk endpoints per batch.
3. Join results per domain and rank or filter by the user's criteria.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

D = domains.
- For each of the four endpoints: ceil(D/1000) x (task + item x D).

Cheapest mode: All four endpoints are Live only; one call per 1000 targets is the cheapest shape.

Typical run (500 domains through all four bulk endpoints): 1 x $0.012 + 500 x $0.00012 + 3 x $0.024 + 1500 x $0.000036 = $0.198 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
One table: domain, estimated traffic, rank, referring domains, spam score.

## Visuals
- `table`: all four metrics per domain. Fields: `items[].target`, `items[].metrics` (metrics.organic.etv), `items[].rank`, `items[].referring_domains`, `items[].spam_score`. Sort by the user criterion, top 50.
- `scatter`: domain rank vs estimated organic traffic. Fields: `items[].rank`, `items[].metrics` (metrics.organic.etv). X_label rank, y_label traffic; labels = domain; label outliers.

## Tell the user
- Top domains by the user's criterion.
- Outliers, such as high rank with low traffic, and high spam scores.
- That all four metrics are estimates.
- Next: [[backlink-audit]] on the shortlist.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- All four metrics are DataForSEO estimates.
- Mixing domains and URLs in one list changes what is measured; be consistent.
- For deep analysis of a shortlist use [[backlink-audit]].

Related: [[labs]] · [[backlinks]] · [[tech-stack-lead-lists]]
