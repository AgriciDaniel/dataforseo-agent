---
type: hot
title: "DataForSEO Brain - Hot / Current Context"
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-07
tags: [dataforseo, hot, context]
confidence: evidence-based
---

# Hot: current context

Facts below were checked against official pages on 2026-11-06 (research/brain-facts.md, research/sources.json).

## Rules that override older notes
- **Prices come from the catalog** (`research/endpoints.json`, `price.tiers`), never from memory or old notes. Reference notes were refreshed to 2026-11-06 list prices; any note still flagged `price_status: pre-2026-07-01-repricing` has unverified figures.
- **Endpoint paths come from the catalog** (576 active of 583 entries). If a note and the catalog disagree, the catalog wins.
- **No paid call without an estimate and one approval.** In the app, state the estimate and make the call: the request prompt is the approval, so never also ask "Run it for $X?" in chat. Without a request prompt, end with "Run it for $X?" and wait. Test in the sandbox by direct HTTP; the official MCP server cannot reach the sandbox and has no cost guard.
- Model names for LLM Responses come from the free `/models` endpoints, not from notes.

## Current platform state
- Pay-as-you-go everywhere since 2026-07-01, including Backlinks and LLM Mentions (no subscriptions; 40204 is legacy there). $50 minimum top-up, balance never expires, $1 trial credit.
- 2026-07-01 repricing: about +20% for Labs, Backlinks, Content Analysis, Domain Analytics, Keywords Data, OnPage and Business Listings; +50% Amazon Products and Sellers task POST. SERP Google Organic and LLM Mentions unchanged.
- Mode names: Standard queue, Priority queue, Live mode.
- Account rate limit 10000 calls/min (older notes say 2000). 30 simultaneous requests, Google Ads Live 12/min, `tasks_ready` 20/min.
- LLM Mentions endpoints renamed: `search_mentions`, `target_metrics`, `multi_target_metrics`, `top_mentioned_domains`, `top_mentioned_pages` (old names are legacy). ChatGPT mentions data is US only.
- Gone or unavailable: Amazon reviews (Merchant), Google Shopping Product Spec, Google Events SERP (deprecated), Content Generation API (discontinued), Pinterest social media endpoint (unavailable, 50304, no price), YouTube organic `tasks_fixed` (removed, 40402); live test 2026-11-06. Google Shopping has no Live path.
- Official MCP server is v3 (`dataforseo-mcp-server` 3.1.3, Node 22+, four generic tools). See [[mcp]].
- API v2 closed 2026-05-05.

## Where to look
- Router: [[which-api-for-which-job]] · by surface: [[by-surface]]
- Cost: [[cost-model]], [[cost-control]], [[live-vs-standard]], [[labs-vs-live]]
- Platform: [[api-basics]], [[execution-modes]], [[limits-and-errors]], [[sandbox-and-account]], [[visuals]], [[settings]]

## Open questions
- Platform updates after 2026-07-08 have not been read into the brain beyond the facts above.
