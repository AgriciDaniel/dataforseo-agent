---
type: workflow
skill: amazon-competitor-research
title: "Amazon Competitor Research"
description: "Use when analysing an Amazon product against competing products: shared keywords, keyword rankings and rank distribution, from the Labs Amazon database."
modules: [labs, merchant]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Amazon Competitor Research

> Use when analysing an Amazon product against competing products: shared keywords, keyword rankings and rank distribution, from the Labs Amazon database.

## Trigger
An Amazon seller wants to know which products compete with an ASIN and on which keywords. Inputs: one or more ASINs, marketplace location.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- One or more ASINs.
- Marketplace (location and language).
- How many competitors and keywords to keep (sets `limit`).

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/amazon/product_competitors/live` (competing ASINs)
- `POST /v3/dataforseo_labs/amazon/ranked_keywords/live` (keywords an ASIN ranks for)
- `POST /v3/dataforseo_labs/amazon/product_keyword_intersections/live` (keywords several ASINs share)
- `POST /v3/dataforseo_labs/amazon/product_rank_overview/live` (rank distribution for a list of ASINs)
- `POST /v3/merchant/amazon/asin/task_post` (optional, live product detail)

## Steps
1. Find competitors for the ASIN with `product_competitors`.
2. Pull `ranked_keywords` for the ASIN and the top competitors.
3. Run `product_keyword_intersections` to find keywords competitors share where your ASIN is absent or weaker.
4. Compare overall positions with `product_rank_overview`.
5. Optionally pull live detail (`asin`) for price and rating of the top competitors.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

A = ASINs analysed.
- Labs: for each endpoint used, task + item x rows (cap with `limit`); `ranked_keywords` runs A times.
- Optional live detail: A x task(`amazon/asin/task_post`).

Cheapest mode: Labs Amazon endpoints are Live only ($0.012 + $0.00012 per item); keep `limit` tight. Merchant ASIN detail in the Standard queue ($0.0015).

Typical run (1 ASIN: competitors (50), ranked keywords (100), keyword intersections (100), rank overview (1)): 4 x $0.012 + 251 x $0.00012 = $0.07812 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A competitor table, a keyword gap list, and rank distribution per ASIN.

## Visuals
- `table`: competing ASINs with overlap and average position. Fields: `items[].asin`, `items[].intersections`, `items[].avg_position`. lower_is_better on avg position; sort by intersections desc, top 20.
- `grouped-bar`: rank distribution per ASIN. Fields: `items[].asin`, `items[].metrics` (product_rank_overview). Buckets pos_1, pos_2_3, pos_4_10, pos_11_20; max 5 ASINs.
- `table`: keyword gaps where competitors rank and you do not. Fields: `items[].keyword_data`, `items[].intersection_result`. Sort by search volume desc, top 25.

## Tell the user
- Top competing ASINs and how they compare on position and estimated traffic.
- Keywords competitors rank for that the ASIN misses.
- That Labs figures are estimates.
- Next: [[ecommerce-product-research]] for prices and reviews.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Labs Amazon data covers a limited set of marketplaces; check the locations helper.
- Labs data is pre-indexed; for today's listing state use Merchant.
- Amazon reviews endpoint is unavailable; use review fields in the ASIN result.

Related: [[labs]] · [[merchant]] · [[ecommerce-product-research]]
