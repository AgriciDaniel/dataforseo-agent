---
type: cost
title: "Cost model"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, cost]
confidence: evidence-based
---

# Cost model

Prices live in the catalog (`price.tiers` per endpoint), never in these notes. This note says how billing works.

- Pay-as-you-go: no seats or subscriptions (Backlinks and LLM Mentions included since 2026-07-01). Prices rose about 20% on 2026-07-01 for Labs, Backlinks, Content Analysis, Domain Analytics, Keywords Data, OnPage and Business Listings.
- You pay when a task is set: at `task_post` for queued work, at the call for Live. `tasks_ready`, `task_get` and webhook resend are free. Errored tasks cost 0.
- Billing shapes in the catalog: flat per task, per task plus per item or row, per SERP or block of results (for example Shopping per 40 products, Play reviews per 150), or per crawled page (OnPage).
- Multipliers to check before every call: Live vs Standard vs Priority queue; `depth` beyond the base block; `include_clickstream_data: true` on Labs (about double); special search operators in a SERP keyword (5x); SERP add-ons (`load_async_ai_overview`, `calculate_rectangles`, People Also Ask clicks); OnPage rendering options (`enable_javascript`, `load_resources`, `enable_browser_rendering`, `custom_js`); LLM Responses add the model's own `money_spent`.
- Estimate = base per task x tasks + per-item price x expected items (capped by `limit`) + add-ons. When the item count is unknown, estimate at the `limit` cap.
- The envelope `cost` field is the real charge; reconcile estimates against it.

Detail: [[cap-queue-priority-cost-model]].
