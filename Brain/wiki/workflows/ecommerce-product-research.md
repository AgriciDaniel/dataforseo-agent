---
type: workflow
skill: ecommerce-product-research
title: "Ecommerce Product Research"
description: "Use when researching products on Amazon or Google Shopping and apps in the stores: competitor products, prices, demand keywords and review-mined feature gaps."
modules: [merchant, labs, app-data]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Ecommerce Product Research

> Use when researching products on Amazon or Google Shopping and apps in the stores: competitor products, prices, demand keywords and review-mined feature gaps.

## Trigger
A seller, brand, or app publisher needs market intelligence: a new product launch, a pricing review, a listing/ASO optimization pass, or competitor product monitoring. Inputs are seed keywords, target ASINs/product URLs, and/or app ids.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Seed keywords and marketplace (Amazon or Google Shopping).
- Location and language.
- ASINs or product ids, and result depth.

## Endpoints used (in order)
- `POST /v3/merchant/amazon/products/task_post` then `task_get/advanced/$id` (Amazon keyword SERP).
- `POST /v3/merchant/amazon/asin/task_post` then `task_get/advanced/$id` (product detail).
- `POST /v3/merchant/google/reviews/task_post` (Google Shopping product reviews). Amazon reviews is unavailable (2026-11-06); use the review fields returned by Amazon `asin`.
- `POST /v3/merchant/google/products/task_post` then `task_get/advanced/$id` (Google Shopping products; Standard only, no Live path).
- `POST /v3/dataforseo_labs/amazon/related_keywords/live` and `/bulk_search_volume/live` (Amazon demand).
- `POST /v3/app_data/google/app_reviews/task_post` and `/v3/app_data/apple/app_reviews/task_post` (ASO reviews).

## Steps
1. Map the marketplace SERP: post Amazon `products` for the seed keyword (`depth` default 100, max 700; `max_crawl_pages` max 7; optional `sort_by`, `price_min`/`price_max`, `department`). Parse `items[]` (`amazon_serp`, `amazon_paid`, `editorial_recommendations`) for rank, title, price, ASIN, rating, delivery info.
2. Pull product detail for the top ASINs via Amazon `asin` to get full attributes, pricing, and seller data; cross-reference Google Shopping with `merchant/google/products` for the same products across that surface.
3. Read reviews: use the `top_global_reviews` and rating fields from Amazon `asin`, and Google Shopping `reviews` (`rating_groups`, `top_keywords`, review text) for products sold there, to find sentiment and feature gaps.
4. Size keyword demand: run Labs Amazon `related_keywords` (depth 0-4; depth 4 yields up to ~1,554 ideas, each with `search_volume`) and `bulk_search_volume` to score the keyword universe for listings/PPC.
5. For apps, pull `app_reviews` (Google Play and Apple) to mine rating, `review_text`, `helpful_count`, app `version`, and developer `responses` for ASO and roadmap signals; add app searches/listings for ranking context.
6. Synthesize: a product/competitor matrix (price, rating, review volume, keyword coverage) plus an ASO/listing keyword list and a review-driven feature backlog.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

K = keywords, A = ASINs or product ids, B = blocks of results requested.
- Amazon search: K x B x task(`amazon/products/task_post`); detail: A x task(`amazon/asin/task_post`); sellers likewise.
- Google Shopping: K x task(`google/products/task_post`) per 40 products; product info per product; reviews and sellers per 10.
- Demand: task + item x keywords for Labs Amazon `related_keywords` and `bulk_search_volume`.
- App reviews: blocks (150 Google Play, 25 App Store) x task(`app_reviews/task_post`).

Cheapest mode: Merchant in the Standard queue (Google Shopping has no Live path); Labs Amazon is Live only.

Typical run (5 Amazon searches, 10 ASIN details, related keywords (100)): 5 x $0.0015 + 10 x $0.0015 + $0.012 + 100 x $0.00012 = $0.0465 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A product-research pack: marketplace competitor matrix, product/pricing detail, Amazon keyword demand list, and a review-mined sentiment + feature-gap report for listings and ASO.

## Visuals
- `table`: products with price, rating and seller. Fields: `items[].title`, `items[].rating` (rating.value), `items[].price`. Sort by rating desc, top 20.
- `scatter`: price vs rating. Fields: `items[].price`, `items[].rating` (rating.value). X_label price, y_label rating; at least 3 products; labels = product title (`items[].title`).

## Tell the user
- Top products by rating, reviews and price, and the price bands.
- Demand keywords with volume.
- Review themes.
- Next: [[amazon-competitor-research]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Merchant and App Data review/product endpoints are task-based: budget for the post-then-collect latency; results are free to re-collect for 30 days.
- Google Shopping `products` bills per 40 results and reviews per 10; app reviews bill per 25 (App Store) or 150 (Google Play); Amazon bills per SERP or product. `depth` drives cost.
- Labs Amazon `related_keywords` location support is limited to United States, Egypt, Saudi Arabia, and UAE (typically US/English); it is not global.
- Google Play review `title` is always null; do not rely on it.
- Marketplace data reflects the queried `location_code`/`language_code` and `se_domain`; keep them consistent when comparing across runs.
