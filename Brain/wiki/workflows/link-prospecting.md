---
type: workflow
skill: link-prospecting
title: "Link Prospecting"
description: "Use when building a scored list of sites to approach for links: domains that link to competitors but not to you, filtered by rank and spam score."
modules: [backlinks]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Link Prospecting

> Use when building a scored list of sites to approach for links: domains that link to competitors but not to you, filtered by rank and spam score.

## Trigger
A link-building campaign needs prospects. Inputs: your domain and up to 20 competitor domains.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Your domain and up to 20 competitors.
- Filters: minimum rank, maximum spam score.
- Prospect cap.

## Endpoints used (in order)
- `POST /v3/backlinks/domain_intersection/live` (referring domains shared by competitors)
- `POST /v3/backlinks/referring_domains/live` (your own referring domains, to exclude)
- `POST /v3/backlinks/bulk_ranks/live` (rank per prospect)
- `POST /v3/backlinks/bulk_spam_score/live` (spam score per prospect)

## Steps
1. Run `domain_intersection` on the competitors, excluding your domain, to list domains linking to them.
2. Pull your `referring_domains` and remove any prospect that already links to you.
3. Score the remaining prospects with `bulk_ranks` and `bulk_spam_score` (up to 1000 per call).
4. Drop high-spam and very low-rank domains; sort by rank and by how many competitors each prospect links to.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

C = competitors, P = prospects scored.
- task(`domain_intersection`) + item(`domain_intersection`) x rows (cap with `limit`).
- task(`referring_domains`) + item x rows.
- ceil(P/1000) x (task + item x P) for each of `bulk_ranks` and `bulk_spam_score`.

Cheapest mode: Backlinks is Live only; one `domain_intersection` call covers up to 20 targets; bulk scoring per 1000 prospects.

Typical run (intersection (500 rows), referring domains (100), bulk rank and spam for 500 prospects): 4 x $0.024 + 1600 x $0.000036 = $0.1536 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A ranked prospect list: domain, rank, spam score, competitors it links to, and an example linking page where available.

## Visuals
- `table`: prospects with rank, spam score and competitors linked. Fields: `items[].domain_intersection`, `items[].summary`, `items[].rank`, `items[].spam_score`. Sort by rank desc, top 50.
- `scatter`: rank vs spam score. Fields: `items[].rank`, `items[].spam_score`. lower_is_better on spam score; x_label rank, y_label spam score; flag high spam; labels = domain.

## Tell the user
- The shortlist: domains linking to two or more competitors, high rank, low spam.
- Why each prospect is on the list.
- That outreach is the user's job; the agent sends nothing.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Rank and spam score are DataForSEO model estimates.
- Set `include_subdomains` and the rank scale explicitly and keep them consistent.
- Rows are billed; cap with `limit` and filters before scoring.

Related: [[backlinks]] · [[competitor-gap-analysis]]
