---
type: workflow
skill: technical-site-audit
title: "Technical Site Audit"
description: "Use when crawling a site for a technical SEO audit and producing a prioritized fix list, with optional Lighthouse checks on key templates."
modules: [onpage]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Technical Site Audit

> Use when crawling a site for a technical SEO audit and producing a prioritized fix list, with optional Lighthouse checks on key templates.

## Trigger
A site needs a technical health check: a migration QA, a pre-launch gate, a quarterly audit, or a ranking-drop investigation. Input is a `target` domain plus a `max_crawl_pages` budget.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Domain.
- Page budget (`max_crawl_pages`).
- Whether JavaScript rendering is needed, and Lighthouse templates.

## Endpoints used (in order)
- `POST /v3/on_page/task_post` (start the crawl).
- `GET /v3/on_page/tasks_ready` then `GET /v3/on_page/summary/{id}` (aggregate results).
- `POST /v3/on_page/pages`, `/duplicate_tags`, `/duplicate_content` with the task `id` in the body (page-level issues).
- `POST /v3/on_page/redirect_chains`, `/non_indexable`, `/links` with the task `id` in the body (link/index issues).
- `POST /v3/on_page/lighthouse/task_post` (or `/lighthouse/live/json`) for performance/CWV.
- `POST /v3/on_page/instant_pages` for a fast single-page spot check.

## Steps
1. Post the crawl: `task_post` with `target` and `max_crawl_pages`. Optionally set `start_url`, `respect_sitemap`, `enable_javascript`/`load_resources`/`enable_browser_rendering` (for CWV, each an extra charge), `store_raw_html`, and `pingback_url`. You are billed only at this POST step.
2. Wait for completion: poll `tasks_ready` (or receive the pingback). Crawls are async; `summary` can be read while `crawl_progress` is still `in_progress` for partial data.
3. Read `summary/{id}`: capture `page_metrics.onpage_score` (0-100), `duplicate_title`, `duplicate_description`, `duplicate_content`, `broken_links`, `broken_resources`, `non_indexable`, `redirect_loop`, plus the `domain_info.checks` (sitemap, robots_txt, ssl, http2, redirects) and `ssl_info`.
4. Triage from `page_metrics.checks` counts: `no_title`, `title_too_long` (>65), `title_too_short` (<30), `no_h1_tag`, `no_description`, `duplicate_meta_tags`, `is_4xx_code`, `is_5xx_code`, `canonical_to_broken`, `is_orphan_page`, `has_render_blocking_resources`, `low_content_rate`, etc.
5. Drill into the offenders: `duplicate_tags`/`duplicate_content` for the actual duplicate clusters, `redirect_chains` for multi-hop redirects, `non_indexable` for accidentally blocked pages, `links` for broken internal links.
6. Run Lighthouse on key templates (home, category, product, article) via `lighthouse/live/json` or task-based; read `categories` (performance, accessibility, best-practices, seo) and the `audits` detail.
7. Compile a prioritized fix list (blocker -> high -> medium) mapped to specific URLs, and re-crawl after fixes to confirm.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

P = `max_crawl_pages`, T = Lighthouse templates.
- Crawl: P x item(`/v3/on_page/task_post`) per crawled page, plus the surcharge for each enabled option (`enable_javascript`, `load_resources`, `enable_browser_rendering`, `custom_js`, keyword density). Unused page allowance is refunded.
- Reports (summary, pages, duplicates, links, redirects): free.
- Lighthouse: T x task(`lighthouse/live/json` or `lighthouse/task_post`).
- Spot checks: task(`instant_pages`) per URL.

Cheapest mode: Basic crawl without rendering ($0.00015 per page); reports are free and unused pages are refunded. Rendering options add surcharges.

Typical run (1000 pages plus 3 Lighthouse runs): 1000 x $0.00015 + 3 x $0.005 = $0.165 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A technical audit report: site `onpage_score`, an issue inventory with page counts, the duplicate/redirect/non-indexable detail tables, Lighthouse category scores per template, and a prioritized remediation backlog.

## Visuals
- `kpi`: pages crawled, crawl status and page metrics. Fields: `crawl_status`, `domain_info`, `page_metrics` (summary). Values [current, previous] when re-crawled.
- `gauge`: the site's on page score. Fields: `page_metrics.onpage_score` (0 to 100). Add one gauge per crawled site when comparing.
- `hbar`: issue counts by check. Fields: `page_metrics` (checks). Sort desc, top 15, unit pages.
- `table`: worst pages. Fields: `items[].url`, `items[].onpage_score`, `items[].status_code`, `items[].page_timing`. Sort by onpage_score asc, top 25.

## Tell the user
- Overall score and the top issues by count.
- Broken links, duplicates and redirect chains.
- A fix list in priority order.
- Next: [[lighthouse-performance-audit]] for slow templates.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Setting `max_crawl_pages: 1` disables sitewide checks unless `force_sitewide_checks: true`.
- `crawl_delay` defaults to 2000ms; lowering it on a fragile server can cause crawl errors (`extended_crawl_status` will flag `site_unreachable` or `too_many_redirects`).
- Max 100 tasks per POST; Instant Pages, Content Parsing Live, and Page Screenshot are capped at 20. 10,000 calls/min (account limit), 30 simultaneous, 120s timeout.
- `onpage_score` depends on how many pages were crawled; compare like-for-like crawl sizes across runs.
- HTML/raw results have shorter retention (7 days) than standard results (30 days); pull what you need promptly.
