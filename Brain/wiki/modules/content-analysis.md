---
type: module
module: content-analysis
title: "Content Analysis API"
agent_description: "Use for brand and topic mention monitoring across the web: citation search, sentiment and connotation, rating distribution, and phrase or category trends over time."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Content Analysis API

## Purpose
Search and score a pre-built citation database (news, blogs, ecommerce, forums, organization pages) for a keyword or category.

## Use when
- How is a brand, product or topic talked about, and where? Sentiment, top domains, page types, trends.
- Choosing an angle and tone for a content brief.

## Do not use when
- You need reviews from a specific platform (Google, Trustpilot, Tripadvisor): [[business-data]].
- You need mentions inside AI answers: [[ai-optimization]].

## Defaults
- Live only. Scope with `page_type`, `keyword_fields`, filters and `limit`; rows are billed.
- `search_mode: one_per_domain` when you want breadth over volume.

## Gotchas
- Trend history starts 2022-10-31.
- Sentiment is model-derived; thresholds are heuristics.
- The corpus is not a live crawl, so very fresh content can be missing.
- The filters helper is `GET /v3/content_analysis/available_filters`.

Reference: [[cap-content-analysis-api]].
