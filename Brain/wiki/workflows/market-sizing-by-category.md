---
type: workflow
skill: market-sizing-by-category
title: "Market Sizing by Category"
description: "Use when sizing a market by Google product and service category: top keywords, demand, and how a domain performs in each category."
modules: [labs]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Market Sizing by Category

> Use when sizing a market by Google product and service category: top keywords, demand, and how a domain performs in each category.

## Trigger
Niche validation, total addressable search demand, or mapping where a competitor wins. Inputs: category codes or a domain, location, language.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Category codes or a domain.
- Location and language.
- How many keywords per category.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/categories_for_domain/live` (categories a domain ranks in)
- `POST /v3/dataforseo_labs/google/keywords_for_categories/live` (keywords in categories)
- `POST /v3/dataforseo_labs/google/top_searches/live` (highest-demand searches in a market)
- `POST /v3/dataforseo_labs/google/domain_metrics_by_categories/live` (category metrics change between two dates)

## Steps
1. If starting from a domain, list its categories with `categories_for_domain`.
2. Pull keywords per category with `keywords_for_categories` (max 20 codes; note intersection defaults to all categories).
3. Sum volume and estimated traffic per category to size demand.
4. Track change between two dates with `domain_metrics_by_categories` (max 5 codes, dates from 2020-10-01).

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- task + item x rows for each endpoint; `keywords_for_categories` rows dominate, so set `limit` and filters.

Cheapest mode: Labs is Live only; run `categories_for_domain` first and cap `keywords_for_categories` with `limit`. `domain_metrics_by_categories` is ten times the Labs default ($0.12 per task), so run it last and only when the leaders matter.

Typical run (categories for domain (20), keywords for categories (500), domain metrics (20 domains, priced $0.12 + $0.0012 per domain)): 2 x $0.012 + 520 x $0.00012 + $0.12 + 20 x $0.0012 = $0.2304 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Demand per category, top keywords, and the domain's share and change per category.

## Visuals
- `hbar`: total search volume per category. Fields: `items[].keyword_info` (search_volume), `items[].categories`. Sort desc, top 15.
- `table`: top keywords in the market. Fields: `items[].keyword`, `items[].keyword_info` (search_volume, cpc). Sort by volume desc, top 25.
- `grouped-bar`: domain traffic per category at two dates. Fields: `items[].organic_etv`, `items[].organic_count` (domain_metrics_by_categories). Series first_date and second_date; max 5 categories.

## Tell the user
- Search demand per category and the top keywords.
- Who leads each category.
- That volumes and traffic are estimates.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Categories are Google's taxonomy only.
- `category_intersection` defaults to true (keywords in all listed categories), which can return few results.
- Traffic figures are estimates.

Related: [[labs]] · [[keyword-research]]
