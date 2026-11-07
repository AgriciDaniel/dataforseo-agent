---
type: module
module: merchant
title: "Merchant API"
agent_description: "Use for ecommerce marketplace data: Amazon product search, ASIN detail and sellers (queue or Live), and Google Shopping products, product info, sellers and reviews (queue only)."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Merchant API

## Purpose
Scrapes marketplace pages: product search results, product detail, seller offers and reviews for Amazon and Google Shopping.

## Use when
- Competitor product mapping, price monitoring, listing optimization.

## Do not use when
- You need Amazon keyword demand or ASIN keyword rankings: [[labs]] (Amazon endpoints) is cheaper.

## Defaults
- Queue for monitoring; Amazon Live only for interactive lookups.
- Cap `depth`: billing is per result block (Amazon per SERP or product, Shopping per 40 products, sellers and reviews per 10).

## Gotchas
- Google Shopping has **no Live path**; calling one returns 40402. Use `task_post`.
- Amazon reviews (`/v3/merchant/amazon/reviews`) is unavailable, and Google Shopping Product Spec was removed (research/brain-facts.md, 2026-11-06). Use Product Info for specifications.
- Amazon `language_code` is a locale code (`en_US`, `de_DE`) from the free `/v3/merchant/amazon/languages`; `en` fails with 40501 Invalid Field (live test 2026-11-06). Labs Amazon endpoints take `en` or `English`.
- Amazon Products and Sellers task prices rose 50% on 2026-07-01.
- Identifiers differ: ASIN for Amazon, `product_id` for Google Shopping (get it from a products search first).
- Amazon `sort_by` and price filters apply to the products search only.

Reference: [[cap-merchant-api]], [[plat-amazon-marketplace]], [[plat-google-shopping]].
