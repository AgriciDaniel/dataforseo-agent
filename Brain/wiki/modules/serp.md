---
type: module
module: serp
title: "SERP API"
agent_description: "Use for live or queued search results: Google organic and verticals (AI Mode, AI Overview, Maps, Local Finder, News, Images, Jobs, Autocomplete, Ads, Finance), Bing, YouTube, Yahoo, Baidu, Naver, Seznam."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# SERP API

## Purpose
Structured search results for a keyword, location, language and device, parsed into typed elements (organic, paid, featured snippet, People Also Ask, local pack, AI Overview and dozens more). The source layer for rank tracking, SERP-feature monitoring and AI Overview capture.

## Use when
- You need the current ranking page, SERP features or AI Overview state for specific keywords.
- Tracking positions over time (queue plus webhooks), local packs by coordinate (Maps, Local Finder), YouTube videos, comments or subtitles.
- Regional engines matter: Baidu (China), Naver (Korea), Seznam (Czech), Yahoo.

## Do not use when
- The question is keyword ideas, difficulty, intent, competitors or traffic estimates and does not need today's SERP: use [[labs]].
- You need search volume or CPC: use [[keywords-data]].

## Defaults
- Standard queue for scheduled tracking; Live only when someone is waiting. `advanced` result type for anything involving features or AI Overview; `regular` only for plain organic positions.
- `depth` at the base block (10 for Google Organic) unless deeper positions are the point.
- Pin `device` and resolve location codes from the helper endpoints.

## Gotchas
- Special operators (`site:`, `filetype:`, `allinanchor:`) multiply the keyword charge 5x.
- AI Overview on organic needs `load_async_ai_overview` (extra charge). AI Mode is a separate endpoint at a higher price tier.
- Baidu, Seznam, Google Jobs and Search By Image are queue-only. Google Events is deprecated.
- Yahoo defaults to 6 results; YouTube counts blocks (`block_depth`), not results.
- `serp/screenshot` and `serp/ai_summary` need the `task_id` of your own SERP task (screenshot within 7 days, AI summary within 30); an old id returns 40403 at $0. Run the SERP task first.
- Ads Search and Dataset Info bill even when they return 40102 No Search Results (live test 2026-11-06). Get advertiser ids from `ads_advertisers` and dataset ids from `dataset_search` first.
- Live results are not stored; queued results stay 30 days and re-collect free.
- AI-related ranking studies show AI Overview citations only partly overlap the organic top 10; track them separately.

Reference: [[cap-serp-api]], [[cap-serp-google-verticals]], [[cap-serp-non-google-engines]], [[cap-result-tiers-regular-advanced-html]].
