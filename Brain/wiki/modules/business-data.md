---
type: module
module: business-data
title: "Business Data API"
agent_description: "Use for local business and reputation data: Google Business Profile info, posts, reviews and Q&A, Google Hotels, Trustpilot and Tripadvisor reviews, social share counts, and the Business Listings POI database."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Business Data API

## Purpose
Local-SEO and reputation data for physical businesses and brands, plus a pre-indexed database of Google Maps points of interest.

## Use when
- Auditing or monitoring a Google Business Profile, its reviews, Q&A and posts.
- Reputation across Google, Trustpilot and Tripadvisor.
- Discovering businesses by category and radius (Business Listings) for market mapping or local competitor lists.

## Do not use when
- You need where a business ranks in the map pack: [[serp]] (Maps, Local Finder).
- You need web-wide mention sentiment: [[content-analysis]].

## Defaults
- Queue for profile and review pulls (paid at task_post, free re-collection for 30 days); Business Listings and social counts are Live.
- Pin businesses by `place_id` or `cid`, not by name alone.

## Gotchas
- Business Listings is pre-indexed; for current profile state use the profile endpoints.
- Business Listings `location_coordinate` is "lat,lng,radius" with radius in km.
- Each review platform uses its own key (Google `place_id`/`cid`, Trustpilot `domain`, Tripadvisor `url_path`) and its own schema.
- `extended_reviews` returns more detail than `reviews` at a higher cost. Hotel searches need check-in and check-out dates.

Reference: [[cap-business-data-api]], [[plat-review-platforms]], [[plat-google-maps-local]].
