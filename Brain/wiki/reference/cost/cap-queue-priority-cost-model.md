---
type: concept
title: "Queue Priority & Cost Model"
domain: dataforseo
subdomain: platform
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, platform, pricing]
related:
 - "[[cap-task-vs-live-execution]]"
 - "[[cap-platform-architecture]]"
 - "[[cap-account-usage-userdata]]"
prices_as_of: 2026-06-26
price_status: pre-2026-07-01-repricing
confidence: evidence-based
---

# Queue Priority & Cost Model

> How DataForSEO bills: pay-as-you-go with a $50 minimum, per-task pricing, and two Standard priorities (Normal=1, High=2) plus Live that trade latency for cost. Sits under [[index|DataForSEO Brain]] → [[index|Concepts]].

## Overview
DataForSEO is pay-as-you-go: you deposit funds ($50 minimum) and are billed per task you set, not per seat. The single biggest cost lever is execution mode. Standard Normal (priority 1) is cheapest and slowest; Standard High (priority 2) is ~2x for ~1 minute turnaround; Live is ~3.3x of Standard Normal for ~6 second turnaround. This is a hub note linked from nearly every module note because cost is module-specific but the model is universal.

## What it covers
- Pricing model: pay-as-you-go, $50 minimum deposit, new accounts get a $1 free credit usable for an unlimited period; "Your account will be billed only for setting a task."
- Priority levels (Standard only): Normal `1` = lower cost, slower; High `2` = faster, higher cost.
- Per-result vs per-request billing: many endpoints bill per block of results (e.g. Google Shopping products billed "for every 40 results"; reviews/sellers "every 10 items"; App Store reviews per 50, Play reviews per 150).
- The `cost` field on the envelope and per-task `cost` for spend attribution.
- Depth tuning: base price covers the first 10 results; raising `depth` "doubles the price for every extra 100 results" (directional, verify on invoice).

## Key parameters / inputs
- `priority`: 1 or 2 (Standard).
- `depth`: number of results requested; drives cost above the base 10.
- `include_clickstream_data: true` on Labs multiplies request cost by 2.
- Choice of `/live` vs task-based path selects the mode premium.

## Response / what you get back
- Reference per Google SERP (10 results): Standard Normal $0.0006 ($600/1M), Standard High $0.0012 ($1,200/1M), Live $0.002 ($2,000/1M). Catalog range overall "$0.60 / 1,000 SERPs to $100 / purchase."
- List prices (catalog, 2026-11-06): Labs $0.012/task + $0.00012/item; SERP Live advanced $0.002; Google Ads search volume $0.06 Standard, $0.09 Live; Clickstream DataForSEO Search Volume $0.18; Whois overview $0.12 + $0.0012/item; OnPage instant_pages $0.00015; Business Listings search $0.012 + $0.00036/item.
- Scaled SERP price for 100 results (depth 100 bills 10 base prices): Standard $0.006, Priority $0.012, Live $0.02.

## Cost & method notes
> Price status: figures below are 2026-06-26 snapshots taken before the 2026-07-01 repricing. Use them as relative guidance; get current prices from the endpoint catalog or `user_data`.
Pre-indexed DataForSEO Labs and Databases are far cheaper than live SERP because they query stored data, not live crawls (basic Labs $0.012/task + $0.00012/item). Refreshed Databases are 50% of standard price. Bulk endpoints (Bulk Keyword Difficulty, Bulk Traffic Estimation) return up to 1,000 results per single billed task. Batching 100 tasks per `task_post` cuts HTTP overhead (still one billed task each). Pair this with [[cap-task-vs-live-execution]] and [[cap-databases]].

## When to use / how it fits
This model is the basis of every spend decision: [[dec-cost-control-strategy]], [[dec-live-vs-standard-vs-priority]], [[dec-labs-vs-live-apis]], and the money-saving flow [[cost-optimized-pipeline]]. Monitor actual spend via [[cap-account-usage-userdata]].

## Gotchas / limits
- Accidental Live usage costs ~3.3x the Standard batch rate - a common cost footgun.
- Insufficient balance → status 40200/40210; daily cost limit exceeded → 40203. See [[cap-status-error-codes]].
- The "doubles per extra 100 results" depth multiplier wording was only partially exposed; treat as directional.
- Some endpoints have flat-plus-per-item pricing (e.g. Business Listings Live: $0.012/task + $0.00036/item, capped 1000 items/request). See [[cap-business-data-api]].

- "Your account will be billed only for setting a task"; Standard results are re-collectable free for 30 days. See [[cap-account-usage-userdata]].
- Turnaround estimates: Standard Normal ~5 min, Standard High ~1 min, Live ~6 sec (some endpoints ~2 sec real-time).
- Merchant Amazon ASIN pricing: Standard $0.0015/product, Priority $0.003, Live $0.005. See [[cap-merchant-api]].
- App Data reviews bill per block (Google Play per 150 reviews, Apple App Store per 50 reviews). See [[cap-app-data-api]].
- Databases cost depends on dataset size and location; refreshed datasets are 50% of standard price. See [[cap-databases]].
- At scale, use the Standard queue plus webhooks: Normal priority is cheapest, High priority when turnaround matters. See [[cap-webhooks-pingback-postback]].

## Related
- [[index]]
- [[index]]
- [[cap-platform-architecture]]
- [[cap-task-vs-live-execution]]
- [[cap-account-usage-userdata]]
- [[cap-databases]]
- [[cap-result-tiers-regular-advanced-html]]
- [[cap-sandbox-testing]]
- [[dec-cost-control-strategy]]
- [[dec-live-vs-standard-vs-priority]]
- [[dec-labs-vs-live-apis]]
- [[cost-optimized-pipeline]]

## Sources
- https://dataforseo.com/pricing (retrieved 2026-06-26)
- https://dataforseo.com/apis/serp-api/pricing (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/dataforseo_labs-google-overview/ (retrieved 2026-06-26)
- https://dataforseo.com/help-center/multiple-tasks-in-one-api-request (retrieved 2026-06-26)
