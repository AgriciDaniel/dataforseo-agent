---
type: routing
title: "Which API for which job"
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, routing, router]
confidence: practitioner
---

# Which API for which job

Read this first. Pick the row, hand the job to that module's agent, and get the price from the catalog before any paid call. Paths are current per the catalog (research/endpoints.json, 2026-11-06).

| Job | Module | Start with | Notes |
|---|---|---|---|
| Current rankings / SERP features for a keyword | serp | `/v3/serp/google/organic/task_post` (queue) or `/v3/serp/google/organic/live/advanced` | `advanced` for features and AI Overview |
| Google AI Mode answer | serp | `/v3/serp/google/ai_mode/live/advanced` | higher price tier than organic |
| Local pack / map rankings by location | serp | `/v3/serp/google/maps/live/advanced`, `/v3/serp/google/local_finder/live/advanced` | use `location_coordinate` |
| YouTube results, video info, comments, subtitles | serp | `/v3/serp/youtube/organic/live/advanced` | `block_depth` controls volume |
| Search volume, CPC, bids (ground truth) | keywords-data | `/v3/keywords_data/google_ads/search_volume/live` (or `task_post`) | 12/min Live limit; one task covers up to 1000 keywords |
| Seasonality / trends | keywords-data | `/v3/keywords_data/google_trends/explore/live` | relative 0 to 100 |
| Keyword ideas, suggestions, related | labs | `/v3/dataforseo_labs/google/keyword_ideas/live` | cheapest route for discovery |
| Keyword difficulty or intent in bulk | labs | `/v3/dataforseo_labs/google/bulk_keyword_difficulty/live`, `/v3/dataforseo_labs/google/search_intent/live` | up to 1000 keywords per call |
| What a domain ranks for / its competitors | labs | `/v3/dataforseo_labs/google/ranked_keywords/live`, `/v3/dataforseo_labs/google/competitors_domain/live` | |
| Keyword gap between two domains | labs | `/v3/dataforseo_labs/google/domain_intersection/live` | exactly two targets |
| Traffic estimate for many domains | labs | `/v3/dataforseo_labs/google/bulk_traffic_estimation/live` | up to 1000 targets |
| Backlink profile of one target | backlinks | `/v3/backlinks/summary/live`, then `referring_domains`, `anchors` | |
| Link metrics for a list of domains | backlinks | `/v3/backlinks/bulk_ranks/live`, `/v3/backlinks/bulk_spam_score/live` | up to 1000 targets per call |
| Link gap vs competitors | backlinks | `/v3/backlinks/domain_intersection/live` | |
| Technical site audit | onpage | `/v3/on_page/task_post`, then `/v3/on_page/summary/{id}` | retrieval endpoints are free |
| Check one URL now | onpage | `/v3/on_page/instant_pages` | |
| Tech stack of a site | domain-analytics | `/v3/domain_analytics/technologies/domain_technologies/live` | |
| Whois / domain registration filters | domain-analytics | `/v3/domain_analytics/whois/overview/live` | pricier per call |
| Web-wide brand mentions and sentiment | content-analysis | `/v3/content_analysis/search/live`, `/v3/content_analysis/summary/live` | |
| Google Business Profile and reviews | business-data | `/v3/business_data/google/my_business_info/task_post`, `/v3/business_data/google/reviews/task_post` | key by `place_id` or `cid` |
| Trustpilot / Tripadvisor reviews | business-data | `/v3/business_data/trustpilot/reviews/task_post`, `/v3/business_data/tripadvisor/reviews/task_post` | |
| Find businesses by category and area | business-data | `/v3/business_data/business_listings/search/live` | pre-indexed POIs |
| Amazon products, ASIN detail, sellers | merchant | `/v3/merchant/amazon/products/task_post`, `/v3/merchant/amazon/asin/task_post` | Live also available |
| Google Shopping products, info, sellers, reviews | merchant | `/v3/merchant/google/products/task_post` | queue only, no Live |
| Amazon keyword demand | labs | `/v3/dataforseo_labs/amazon/related_keywords/live`, `/v3/dataforseo_labs/amazon/bulk_search_volume/live` | |
| App store rankings, info, reviews | app-data | `/v3/app_data/google/app_searches/task_post`, `/v3/app_data/apple/app_reviews/task_post` | |
| Keywords an app ranks for | labs | `/v3/dataforseo_labs/google/keywords_for_app/live`, `/v3/dataforseo_labs/apple/keywords_for_app/live` | US and English only |
| Brand visibility in AI answers | ai-optimization | `/v3/ai_optimization/llm_mentions/search_mentions/live`, `/v3/ai_optimization/llm_mentions/multi_target_metrics/live` | ChatGPT data US only |
| Ask ChatGPT / Claude / Gemini / Perplexity a prompt | ai-optimization | `/v3/ai_optimization/chat_gpt/llm_responses/live` (same shape per provider) | model names from `/models` |
| AI search volume | ai-optimization | `/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live` | |
| Account balance, limits, spend | (main agent) | `GET /v3/appendix/user_data` | free |
| Whole datasets for a warehouse | databases | no endpoint; quote-based | |
| First run, test the setup | (main agent) | `GET /v3/appendix/user_data`, then a sandbox call | [[getting-started]] |
| Price a whole project before running | (main agent) | the catalog plus `GET /v3/appendix/user_data` | [[budget-planner]], no paid calls |
| Monthly SEO report for one domain | labs, backlinks | `/v3/dataforseo_labs/google/domain_rank_overview/live`, `/v3/backlinks/summary/live` | [[monthly-seo-report]] |

## Rules
- Not needing the last 24 to 48 hours of SERP data means Labs, not live SERP ([[labs-vs-live]]).
- "N items in one call" beats N calls: prefer bulk endpoints.
- Standard queue unless someone is waiting ([[live-vs-standard]]).
- Every paid call: estimate from the catalog, check [[cost-control]], get approval. Build and test in the sandbox.
- Multi-step jobs map to a workflow skill (33): [[ads-transparency-research]], [[ai-overview-and-ai-mode-tracking]], [[ai-visibility-tracking]], [[amazon-competitor-research]], [[app-store-aso]], [[backlink-audit]], [[brand-sentiment-monitoring]], [[budget-planner]], [[bulk-domain-metrics]], [[competitor-gap-analysis]], [[content-brief]], [[cost-optimized-pipeline]], [[ecommerce-product-research]], [[expiring-domain-finder]], [[getting-started]], [[google-business-profile-audit]], [[keyword-clustering]], [[keyword-research]], [[lighthouse-performance-audit]], [[link-prospecting]], [[local-seo-tracking]], [[market-sizing-by-category]], [[monthly-seo-report]], [[new-lost-links-monitor]], [[ppc-keyword-planning]], [[rank-tracking]], [[review-monitoring]], [[serp-snapshot]], [[site-migration-check]], [[tech-stack-lead-lists]], [[technical-site-audit]], [[trends-research]], [[youtube-research]].
- When a job fits no row, check the catalog by module before saying DataForSEO cannot do it.
