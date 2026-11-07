---
type: platform
title: "Review Platforms as DataForSEO Surfaces"
domain: dataforseo
subdomain: business-data
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, platform, business-data, reviews, reputation]
related:
  - "[[cap-business-data-api]]"
  - "[[cap-content-analysis-api]]"
  - "[[local-seo-tracking]]"
confidence: evidence-based
---

# Review Platforms as DataForSEO Surfaces

> Trustpilot, Tripadvisor, Google Reviews, and Pinterest exposed for reputation, sentiment, and social-proof monitoring, complemented by the Content Analysis citation database. Sits under [[index|DataForSEO Brain]] then [[index|Platforms]].

## Overview
Reputation data spans two modules. The Business Data API reads structured reviews from named platforms: Trustpilot, Tripadvisor, Google Reviews, plus Pinterest pin counts as a social-proof signal. The Content Analysis API takes a different angle: it searches a large citation database for any mention of a brand or keyword across the web and scores sentiment, rather than reading one platform's review feed. Used together they answer "what are customers saying on the review sites" and "what is the web-wide sentiment around this brand."

## What it covers
- Business Data `trustpilot/reviews`: review items with rating, verified flag, title, review_text, user_profile, and business `responses[]`. `trustpilot/search` finds business profiles by keyword (title, domain, reviews_count, rating).
- Business Data `tripadvisor/reviews`: review items with rating (Max5), date_of_visit, review_text, language, review_highlights, and owner responses. `tripadvisor/search` finds listings.
- Business Data `google/reviews`: Google location reviews with review_text, rating, profile_name, owner_answer, review_highlights, local_guide status, images, photos_count.
- Business Data `google/extended_reviews` and `google/questions_and_answers` deepen the Google reputation picture.
- Unavailable since the 2026-11-06 live test (50304 temporarily unavailable, no price on the pricing site): do not call or recommend Business Data `social_media/pinterest/live`. Historical description: `pins_count` (Save Button saves) per page URL; the social_media group also exposes facebook and reddit engagement counts.
- Content Analysis `search` and `sentiment_analysis`: citation-level mentions with sentiment connotations across the web.

## Key parameters / inputs
- Trustpilot Reviews: `domain`, `depth`, `sort_by`. Tripadvisor Reviews: `url_path`, `location_code`, `depth`, `device`.
- Google Reviews: `keyword` plus `place_id` or `cid`, `depth`, `sort_by` (for example "highest_rating").
- Pinterest: `targets` (up to 10 absolute URLs, charged per URL), `tag`.
- Content Analysis Sentiment: `keyword` (lowercase), `page_type` filter (ecommerce, news, blogs, message-boards, organization), `positive_connotation_threshold`, `rank_scale`.

## Response / what you get back
- Review items carry rating, timestamp, title, review_text, user_profile, and owner/developer responses, with rank_group and rank_absolute for ordering.
- Tripadvisor adds `review_highlights` (feature assessments) and `language`; Google adds `images` and `local_guide`.
- Pinterest: `page_url`, `pins_count`, type `social_media_pinterest_item`.
- Sentiment Analysis: `sentiment_connotations` (anger, happiness, love, sadness, share, fun), `connotation_types` (positive, negative, neutral), `top_domains`, `text_categories`, `countries`, `languages`.

## Cost & method notes
- Trustpilot, Tripadvisor, and Google review/search endpoints are Standard: charge only for setting the task, results free for 30 days. See [[cap-task-vs-live-execution]].
- Pinterest and the Content Analysis endpoints are Live-only and charge per request (Pinterest per URL). See [[cap-queue-priority-cost-model]].
- 10000 calls/min; Business Data 100 tasks/POST; Content Analysis 30 simultaneous requests. See [[cap-rate-limits-throughput]].

## When to use / how it fits
- Per-location reputation tracking next to local rank tracking: [[local-seo-tracking]].
- Brand sentiment for a content brief drawn from Content Analysis: [[content-brief]].
- Off-domain mention monitoring that feeds AI-visibility work, since most brand mentions are off-domain: [[ai-visibility-tracking]].
- Routing reputation jobs to the right module: [[which-api-for-which-job]].

## Gotchas / limits
- Business Data uses different join keys per platform: Trustpilot by `domain`, Tripadvisor by `url_path`, Google by `place_id` or `cid`.
- Pinterest charges per URL and accepts only one task per POST.
- Content Analysis reads a citation database, not a live platform feed, so it complements rather than replaces direct review pulls. See [[cap-content-analysis-api]].
- Review freshness depends on the last crawl; `timestamp` and `datetime` record capture time.

## Related
- [[cap-business-data-api]]
- [[cap-content-analysis-api]]
- [[cap-serp-google-verticals]]
- [[cap-task-vs-live-execution]]
- [[cap-platform-architecture]]
- [[cap-queue-priority-cost-model]]
- [[cap-geo-ai-search-optimization]]
- [[local-seo-tracking]]
- [[content-brief]]
- [[ai-visibility-tracking]]
- [[plat-google-maps-local]]
- [[which-api-for-which-job]]
- [[index]]
- [[index]]

## Sources
- https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/task_get/ - retrieved 2026-06-26
- https://docs.dataforseo.com/v3/business_data/tripadvisor/reviews/task_get/ - retrieved 2026-06-26
- https://docs.dataforseo.com/v3/business_data/google/reviews/task_get/ - retrieved 2026-06-26
- https://docs.dataforseo.com/v3/business_data/social_media/pinterest/live/ - retrieved 2026-06-26
- https://docs.dataforseo.com/v3/content_analysis/sentiment_analysis/live/ - retrieved 2026-06-26
- https://docs.dataforseo.com/v3/content_analysis/search/live/ - retrieved 2026-06-26
