---
type: workflow
skill: backlink-audit
title: "Backlink Audit"
description: "Use when auditing a domain's backlink profile: headline metrics, referring domains, anchors, link velocity and spam, ending in a cleanup and reclamation list."
modules: [backlinks]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Backlink Audit

> Use when auditing a domain's backlink profile: headline metrics, referring domains, anchors, link velocity and spam, ending in a cleanup and reclamation list.

## Trigger
A domain needs a link-health review: a penalty investigation, an M&A due-diligence check, a quarterly health snapshot, or a competitor link comparison. Input is a single `target` (domain, subdomain, or full page URL).

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Target: domain, subdomain or URL.
- Whether to include subdomains and indirect links.
- Competitors to compare (optional) and row caps.

## Endpoints used (in order)
- `POST /v3/backlinks/summary/live` (profile overview).
- `POST /v3/backlinks/referring_domains/live` (the referring-domain roster).
- `POST /v3/backlinks/anchors/live` (anchor-text distribution).
- `POST /v3/backlinks/bulk_new_lost_backlinks/live` (link velocity / churn).
- `POST /v3/backlinks/bulk_spam_score/live` (spam score for up to 1,000 targets).
- `POST /v3/backlinks/history/live` and `/timeseries_summary/live` (trend context).

## Steps
1. Run `summary` on the `target`. Read `backlinks`, `referring_domains`, `referring_main_domains`, `rank`, `backlinks_spam_score`, `broken_backlinks`, and the distribution objects (`referring_links_types`, `referring_links_attributes`, `referring_links_tld`, `referring_links_countries`). Set `backlinks_status_type` to `live`, `lost`, or `all` depending on scope.
2. Pull the referring-domain roster with `referring_domains` (default 100, max 1,000 per request; page with `offset`). Sort by `rank` and `backlinks_spam_score`; use `filters` (max 8) to isolate high-spam or nofollow-only domains.
3. Audit anchors with `anchors` to spot over-optimized or spammy anchor patterns (money-keyword stuffing is a manual-action signal).
4. Measure velocity with `bulk_new_lost_backlinks` to see whether the profile is gaining or shedding links; sudden loss spikes flag a problem, sudden gains may flag a negative-SEO attack.
5. Score toxicity: feed the suspect referring domains/pages (up to 1,000 per call) into `bulk_spam_score` to get the 0-100 `spam_score` per target in one billed request.
6. Build the cleanup list: domains/pages above your spam threshold with low `rank` become disavow candidates; broken backlinks pointing at the target become reclamation candidates.
7. Add trend context with `history`/`timeseries_summary` for a month-over-month chart, and re-run on a schedule to monitor.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

Every Backlinks call costs task(x) + item(x) x rows returned.
- Profile: task(`summary`) + rows, then `referring_domains` and `anchors` with rows capped by `limit` (default 100, max 1000 per page).
- Velocity and spam: one `bulk_new_lost_backlinks` and one `bulk_spam_score` call per 1000 targets.
- History: task(`history`) + rows.
- Estimate rows at the `limit` you set; that is the upper bound.
- Cadence: full audit on demand; summary plus new and lost monthly.

Cheapest mode: Backlinks is Live only ($0.024 per request + $0.000036 per returned row). Start with `summary`, cap `limit`, use bulk endpoints for many targets.

Typical run (summary, referring domains (100), anchors (100), bulk new and lost, bulk spam score, history; about 300 rows): 6 x $0.024 + 300 x $0.000036 = $0.1548 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A backlink audit pack: profile summary metrics, ranked referring-domain table, anchor distribution, new/lost velocity chart, and a prioritized disavow + reclamation list. Feeds [[competitor-gap-analysis]] for link-gap work.

## Visuals
- `kpi`: rank, backlinks, referring domains, spam score. Fields: `rank`, `backlinks`, `referring_domains`, `backlinks_spam_score` (summary). lower_is_better on the spam score series; values [current, previous] when a previous run exists.
- `line`: referring domains over time. Fields: `items[].date`, `items[].referring_domains` (history). Monthly points, at least 3.
- `hbar`: top anchors by referring domains. Fields: `items[].anchor`, `items[].referring_domains`. Sort desc, top 15.

## Tell the user
- Rank, referring domains and spam score, and what they mean for this site.
- Top anchors, over optimized anchors and risky referring domains.
- New against lost links over the period.
- Next: [[link-prospecting]] or [[new-lost-links-monitor]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- No Backlinks API subscription is required. Check `user_data` for balance and limits before running, not for access.
- `include_subdomains`, `include_indirect_links`, and `exclude_internal_backlinks` all default to true and materially change counts; set them deliberately and keep them consistent across runs.
- `rank_scale` defaults to `one_thousand`; switch to `one_hundred` if your reporting expects 0-100.
- Rate ceiling is 10,000 calls/min (account limit) and max 30 simultaneous Live requests; max 1,000 items per page and 1,000 targets per bulk call.
- Spam score is DataForSEO's own metric, not Google's; treat it as a triage signal, not a verdict.
