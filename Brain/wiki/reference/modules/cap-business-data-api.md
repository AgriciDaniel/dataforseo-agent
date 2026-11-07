---
type: concept
title: "Business Data API (Capability)"
domain: dataforseo
subdomain: business-data
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, business-data, local-seo]
related:
  - "[[plat-google-maps-local]]"
  - "[[plat-review-platforms]]"
  - "[[local-seo-tracking]]"
  - "[[cap-task-vs-live-execution]]"
prices_as_of: 2026-11-06
confidence: evidence-based
---

# Business Data API (Capability)

> The Business Data API returns local-business and reputation data: Google My Business info, updates, reviews, and Q&A; Google Hotels; Trustpilot and Tripadvisor profiles and reviews; Pinterest pin counts; and a pre-indexed Business Listings database of Google Maps POIs. Sits under [[index|DataForSEO Brain]] -> [[index|Concepts]].

## Overview
Business Data is DataForSEO's local-SEO and reputation layer. It scrapes Google Business Profile details and reviews, hotel listings, and third-party review platforms, and it also exposes a pre-indexed Business Listings database for discovering points of interest by category and location. The review and GMB endpoints follow the Task lifecycle (some also offer Live); Pinterest and Business Listings are Live. It is the data behind local rank tracking, reputation monitoring, and market mapping of physical businesses. Endpoints live under `/v3/business_data/{provider}/...`.

## What it covers
- Google: `/v3/business_data/google/my_business_info/task_post` (profile details), `.../my_business_updates/task_post` (posts), `.../reviews/task_post` and `.../extended_reviews/task_post`, `.../questions_and_answers/task_post`, `.../hotel_searches/task_post`, `.../hotel_info/task_post`.
- Third-party reviews: `/v3/business_data/trustpilot/search/task_post` and `.../trustpilot/reviews/task_post`; `/v3/business_data/tripadvisor/search/task_post` and `.../tripadvisor/reviews/task_post`.
- Live: `/v3/business_data/social_media/pinterest/live` (pin counts per URL); the `social_media` group also exposes `facebook/live` and `reddit/live` (same `targets` pattern, per-URL billing). Plus `/v3/business_data/business_listings/search/live` (Maps POIs by category) and `/v3/business_data/business_listings/categories_aggregation/live` (aggregated category stats).

## Key parameters / inputs
| field | notes |
|---|---|
| keyword | business search term or CID identifier |
| place_id / cid | Google place and client identifiers (GMB info, Q&A) |
| location_code / location_name / location_coordinate | location identifier; coordinate is "lat,lng,radius" (radius 1-100000 km) for Business Listings |
| language_code | result language |
| categories | array of business categories (Business Listings, max 10) |
| check_in / check_out / currency / adults | hotel search parameters |
| depth / sort_by | review count and ordering |
| targets | up to 10 absolute URLs (Pinterest) |
| filters / order_by / limit / offset_token | Business Listings: max 8 filters, max 3 sort rules, limit up to 1000 |

## Response / what you get back
GMB and review endpoints return `title`, a `rating` object (`rating.value`), `address`, `phone`, `work_time`, `place_id`, `cid`, `category`, and per-review `review_text`, `profile_name`, `profile_image_url`, `owner_answer`, `timestamp`, plus `rating_distribution` and `reviews_count`. Trustpilot adds `domain`, `url`, `rating.votes_count`, `verified`, and `responses`; Tripadvisor adds `url_path`, `price_rate`, `is_sponsored`, `date_of_visit`, and `review_id`. Hotels return `hotel_identifier`, `stars`, `is_paid`, a `location` object with coordinates, `prices.price`/`prices.currency`, `amenities`, and `overview_images`. Business Listings returns POI fields like `description`, `url`, `popular_times`, `attributes`, `place_topics`, `contact_info`, and `services`; Categories Aggregation returns `top_categories`, `top_countries`, `count`, and `top_attributes`. Pinterest returns `page_url` and `pins_count`.

## Cost & method notes
- Task endpoints charge at POST and allow free retrieval within 30 days; Live endpoints (Pinterest, Business Listings, Categories Aggregation) charge per request. See [[cap-task-vs-live-execution]] and [[cap-queue-priority-cost-model]].
- Business Listings is a pre-indexed POI database, so it is cheap: `/v3/business_data/business_listings/search/live` costs $0.012 per task + $0.00036 per item (catalog, 2026-11-06), well below the cost of live GMB or review scrapes.
- For real-time profile or review changes, use the live GMB/review scrapers rather than the indexed Business Listings.

## When to use / how it fits
Business Data drives [[local-seo-tracking]] (Maps/Local Finder ranks plus Business Profile and reviews per location) and the reputation side of [[content-brief]]. Reviews here pair with sentiment from [[cap-content-analysis-api]], and Business Listings complements Maps SERP data in [[cap-serp-google-verticals]]. Route jobs via [[which-api-for-which-job]].

## Gotchas / limits
- Task results expire after 30 days; resubmit to refresh.
- Business Listings is pre-indexed, not live; if you need current profile state, use the GMB scrapers.
- 10000 calls/min, max 100 tasks per Task POST (1 for Live); hotels require check-in/check-out dates.
- Business Listings bills per request; batch carefully to control spend. Pinterest is unavailable (2026-11-06 live test, 50304, no price); do not use it.
- Business Listings `location_coordinate` is a "lat,lng,radius" triple in kilometres (radius 1 to 100,000 km), so a single call sweeps a geographic circle rather than a named place.
- GMB lookups accept either a `place_id` or a `cid`; the two are distinct Google identifiers and are not interchangeable across all endpoints.
- `extended_reviews` returns deeper review detail (including `original_review_text` and `owner_timestamp`) than the standard `reviews` endpoint, at a correspondingly higher cost.
- Trustpilot and Tripadvisor are separate providers with their own identifiers and review schemas, so cross-platform reputation work means reconciling three different review shapes (Google, Trustpilot, Tripadvisor).

## Related
- [[plat-google-maps-local]]
- [[plat-review-platforms]]
- [[cap-content-analysis-api]]
- [[cap-serp-google-verticals]]
- [[cap-task-vs-live-execution]]
- [[cap-queue-priority-cost-model]]
- [[cap-platform-architecture]]
- [[local-seo-tracking]]
- [[which-api-for-which-job]]
- [[dec-live-vs-standard-vs-priority]]
- [[index]]
- [[index]]

## Sources
- https://docs.dataforseo.com/v3/business_data/google/my_business_info/task_get/ (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/business_data/business_listings/search/live/ (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/task_get/ (retrieved 2026-06-26)
- https://docs.dataforseo.com/v3/business_data-social_media-overview/ (retrieved 2026-06-26)
