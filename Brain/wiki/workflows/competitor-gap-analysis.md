---
type: workflow
skill: competitor-gap-analysis
title: "Competitor Gap Analysis"
description: "Use when finding keyword and link gaps between a site and its competitors, with a tech-stack fingerprint for context."
modules: [labs, backlinks, domain-analytics]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Competitor Gap Analysis

> Use when finding keyword and link gaps between a site and its competitors, with a tech-stack fingerprint for context.

## Trigger
A team needs a competitive content/link roadmap: a market-entry plan, a quarterly competitor review, or a link-building campaign. Inputs are your domain plus 1-20 competitor domains, with `location_code` and `language_code`.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Your domain and competitors (or let `competitors_domain` find them).
- Location and language.
- Focus: content gap, link gap or both.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/competitors_domain/live` (discover SERP competitors).
- `POST /v3/dataforseo_labs/google/ranked_keywords/live` (each domain's keyword footprint).
- `POST /v3/dataforseo_labs/google/domain_intersection/live` (shared-SERP keyword overlap).
- `POST /v3/dataforseo_labs/google/page_intersection/live` (page-level overlap).
- `POST /v3/backlinks/domain_intersection/live` (link gap: who links to them, not you).
- `POST /v3/backlinks/competitors/live` and `POST /v3/domain_analytics/technologies/domain_technologies/live`.

## Steps
1. Confirm the competitor set: run `competitors_domain` on your domain to surface the domains that share SERPs with you, then finalize the comparison list.
2. Profile each domain's footprint with `ranked_keywords` (returns the keywords a domain ranks for, with `keyword_data`, `ranked_serp_element`, and aggregate `metrics` position distribution; updates weekly). Set `item_types` to include `organic`, `featured_snippet`, `local_pack`, `ai_overview_reference`.
3. Find keyword gaps with `domain_intersection` (`target1` = competitor, `target2` = you, `intersections: true`): each item gives the shared keyword plus `first_domain_serp_element` and `second_domain_serp_element`, so you see who holds the position. Invert/filter to isolate keywords the competitor ranks for where you are absent or weaker.
4. Localize the gap with `page_intersection` to find the specific competitor pages capturing shared keywords, giving concrete content targets.
5. Find the link gap with Backlinks `domain_intersection`: supply your domain and up to 20 competitors in `targets`, set `exclude_targets` to your own domain (or use `intersection_mode`), and read the referring domains that link to competitors but not you, scored by `rank` and `backlinks_spam_score`. Cross-check with Backlinks `competitors`.
6. Fingerprint the stack with `domain_technologies` (returns the `technologies` object: CMS, frameworks, analytics, CDN, etc.) to understand competitor platforms and migration signals.
7. Synthesize a roadmap: a prioritized keyword-gap list (volume x difficulty x intent) plus a ranked link-prospect list, both tied to the competitor pages that earn them.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

C = competitors.
- Labs: task + item x rows for `competitors_domain` (once), `ranked_keywords` (C+1 times), `domain_intersection` (C pairs), `page_intersection` (as needed). Rows dominate; set `limit`.
- Backlinks `domain_intersection`: task + item x rows (one call covers up to 20 targets).
- Technologies: (C+1) x task(`domain_technologies`).
- Cadence: quarterly; refresh ranked keywords monthly.

Cheapest mode: Labs and Backlinks are Live only. Run `competitors_domain` once, cap rows with `limit`; one Backlinks `domain_intersection` covers up to 20 targets.

Typical run (3 competitors: competitors (20 rows), ranked keywords x 4 (100 each), keyword intersections x 3 (100 each), link intersection (100), technologies x 4): 8 x $0.012 + 720 x $0.00012 + $0.024 + 100 x $0.000036 + 4 x $0.012 = $0.258 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A competitive gap pack: keyword-gap table (competitor ranks, you do not), page-level content targets, a link-prospect list (referring domains linking to competitors but not you), and a competitor tech-stack fingerprint.

## Visuals
- `table`: competitors with shared keywords, average position and traffic. Fields: `items[].domain`, `items[].intersections`, `items[].avg_position`, `items[].metrics`. lower_is_better on avg position; sort by intersections desc, top 15.
- `overlap`: keyword overlap of the target and its top 1 or 2 competitors. Fields: `items[].intersections` (the shared count), `items[].metrics` (metrics.organic.count for each domain's total). x = each domain and each "a + b" region; for 3 domains the three way count comes from `domain_intersection` total_count.
- `grouped-bar`: shared vs unique keywords per competitor. Fields: `items[].intersections`, `items[].metrics` (metrics.organic.count). Max 6 competitors.
- `table`: gap keywords where competitors rank and the target does not. Fields: `items[].keyword_data`, `items[].first_domain_serp_element`, `items[].second_domain_serp_element`. Sort by volume desc, top 25.

## Tell the user
- The biggest keyword gaps with volume and the competitor that wins each.
- Link gap domains that link to several competitors.
- Technology differences that matter.
- A ranked action list. Next: [[content-brief]] or [[link-prospecting]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Labs returns pre-indexed estimates, not live SERPs; for a few high-stakes terms confirm against a live SERP query.
- `domain_intersection` takes exactly two targets (`target1`, `target2`); to compare many competitors, run pairwise or use `competitors_domain` first.
- Backlinks `domain_intersection` allows up to 20 targets and up to 10 `exclude_targets`; mind `intersection_mode` (`all` vs `partial`) which changes what counts as a gap.
- Labs limits: max 1,000 results/page, 8 filters, 3 sort rules, 30 simultaneous requests, 10,000 calls/min (account limit).
- Tech detection is best-effort fingerprinting and can miss server-side or obfuscated stacks.
