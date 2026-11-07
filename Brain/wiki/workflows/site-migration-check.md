---
type: workflow
skill: site-migration-check
title: "Site Migration Check"
description: "Use when protecting rankings through a site migration: inventory pages and rankings before, then verify redirects, indexability and visibility after."
modules: [onpage, labs]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Site Migration Check

> Use when protecting rankings through a site migration: inventory pages and rankings before, then verify redirects, indexability and visibility after.

## Trigger
A domain move, redesign or URL restructure. Inputs: old and new domains or URL sets, migration date.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Old and new domains or URL sets.
- Migration date.
- Crawl page budget and key URLs.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/relevant_pages/live` (pages that earn traffic, before)
- `POST /v3/dataforseo_labs/google/ranked_keywords/live` (keywords to protect, before)
- `POST /v3/on_page/task_post` (crawl before and after)
- `POST /v3/on_page/redirect_chains` and `POST /v3/on_page/non_indexable` (free reports by task `id`)
- `POST /v3/on_page/instant_pages` (spot-check individual URLs)

## Steps
1. Before: export `relevant_pages` and `ranked_keywords` for the old site to list pages that matter.
2. Before: crawl the old site to capture URLs, titles and canonicals.
3. After launch: crawl the new site; read `redirect_chains` (no chains or loops) and `non_indexable` (no accidental noindex or blocks).
4. Spot-check the top pages from step 1 with `instant_pages`.
5. Weeks after: re-pull `ranked_keywords` and compare.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

P = crawl page budget per crawl.
- Labs: task + item x rows for `relevant_pages` and `ranked_keywords`, before and after.
- Crawls: 2 x P x item(`on_page/task_post`) per page, plus surcharges for any rendering options. Reports are free.
- Spot checks: task(`instant_pages`) per URL.

Cheapest mode: OnPage crawl per page ($0.00015, reports free, unused pages refunded); Labs is Live only.

Typical run (Labs before and after (4 calls, 400 items) and 2 crawls of 1000 pages): 4 x $0.012 + 400 x $0.00012 + 2 x 1000 x $0.00015 = $0.396 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A before and after report: redirect issues, non-indexable pages, top pages checked, and keyword visibility change.

## Visuals
- `table`: top pages before vs after with status. Fields: `items[].page_address`, `items[].metrics`, `items[].status_code`. Sort by traffic desc, top 25.
- `hbar`: redirect and indexability issues by type. Fields: `items[].is_redirect_loop`, `items[].chain`, `items[].reason`. Sort desc, unit pages.
- `kpi`: ranked keywords before vs after. Fields: `total_count` (ranked_keywords). Values [current, previous].

## Tell the user
- Redirect problems and non indexable pages.
- Pages and keywords that lost visibility.
- A fix list in priority order.
- Next: [[technical-site-audit]] for the full crawl.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Labs reflects ranking with a delay; judge visibility over weeks, not days.
- Keep crawl settings identical before and after.
- Large sites need a page budget that covers the important sections.

Related: [[onpage]] · [[labs]] · [[technical-site-audit]]
