---
type: platform
title: "Execution modes"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, platform]
confidence: evidence-based
---

# Execution modes

- Official names (2026-11-06): **Standard queue**, **Priority queue**, **Live mode**.
- **Standard / Priority queue (task-based):** `task_post` (charged here) then `tasks_ready` then `task_get/{regular|advanced|html}/{id}` (free). Results kept 30 days. `priority: 1` Standard queue (cheapest, about 5 min) or `2` Priority queue (dearer, about 1 min).
- **Live:** one synchronous call returns the result (about 6 s typical, 120 s ceiling, 50401 on timeout; set client timeout to 120 s). Costs more than the Standard queue. Nothing is stored, so persist the response.
- **Live-only modules:** Labs, Backlinks, Content Analysis, Domain Analytics, AI Optimization (LLM Mentions, AI Keyword Data), Clickstream and DataForSEO Trends, Business Listings. Queue-only: Google Shopping Merchant (no live path exists), Baidu, Seznam, Google Jobs, Search By Image, OnPage crawls. Check the catalog for any specific endpoint.
- **Webhooks (Standard only):** `pingback_url` (GET with id and tag) or `postback_url` + `postback_data` (POST of gzip results). URLs accept `$id` and `$tag`. Recover missed deliveries with `POST /v3/appendix/webhook_resend` (up to 100 ids, no double charge); never re-post the task. Above about 100,000 tasks/day, use webhooks instead of polling.
- **Result tiers:** `regular` (organic and paid only), `advanced` (every SERP element type, needed for AI Overview and features), `html` (raw page, 7-day retention).
- A failed task is not retried by DataForSEO; the caller must re-post it.

Detail: [[cap-task-vs-live-execution]], [[cap-webhooks-pingback-postback]], [[cap-result-tiers-regular-advanced-html]].
