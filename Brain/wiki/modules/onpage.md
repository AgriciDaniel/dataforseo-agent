---
type: module
module: onpage
title: "OnPage API"
agent_description: "Use for crawling a website and auditing technical SEO: crawl summaries, page issues, duplicates, redirects, non-indexable pages, links, resources, page timings, Lighthouse, and single-URL Instant Pages checks."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# OnPage API

## Purpose
A site crawler as an API. Post a crawl task, then read summary and issue reports from free retrieval endpoints. Instant Pages checks one URL synchronously; Lighthouse runs Google's performance audit.

## Use when
- Technical audits, migration QA, pre-launch checks, ranking-drop investigations.
- Spot-checking one URL (Instant Pages) or measuring performance on key templates (Lighthouse).

## Do not use when
- You need a site's technology stack or Whois: [[domain-analytics]].
- You need its rankings or traffic: [[labs]] or [[serp]].

## Defaults
- Keep `max_crawl_pages` tight; billing is per crawled page.
- Leave `enable_javascript`, `load_resources`, `enable_browser_rendering`, `custom_js` and keyword density off unless the job needs rendered or Core Web Vitals data (each adds cost).
- Set `store_raw_html`, `calculate_keyword_density` and `validate_micromarkup` at task_post if those reports will be needed; they cannot be added later.
- Lighthouse on a few representative templates, not every page.

## Gotchas
- Retrieval endpoints (summary, pages, duplicates, links) cost nothing; the crawl is paid at task_post.
- Report endpoints are POST with the task `id` in the body: `pages`, `resources`, `links`, `duplicate_tags`, `duplicate_content`, `redirect_chains`, `non_indexable`, `uncrawlable_resources`, `pages_by_resource`, `microdata`, `keyword_density`, `waterfall`, `raw_html`. Only `GET /v3/on_page/summary/{id}` takes the id in the path. Never call them with GET.
- There is no `/v3/on_page/issues` endpoint. For issues use `summary/{id}` (`page_metrics.checks` gives sitewide issue counts), then `pages` filtered on `checks.<name>` for the affected URLs, plus the dedicated reports above (duplicates, redirects, non-indexable).
- `enable_browser_rendering` requires both `enable_javascript` and `load_resources`.
- A 1-page crawl disables sitewide checks unless `force_sitewide_checks` is set; `onpage_score` depends on crawl size, so compare like with like.
- Raw HTML kept 7 days; completed tasks stay in `tasks_ready` up to 3 days.

Reference: [[cap-onpage-api]].
