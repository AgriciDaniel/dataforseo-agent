---
type: workflow
skill: keyword-clustering
title: "Keyword Clustering"
description: "Use when grouping a keyword list into topics or pages, using Labs keyword data, intent, categories and historical SERP overlap."
modules: [labs]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Keyword Clustering

> Use when grouping a keyword list into topics or pages, using Labs keyword data, intent, categories and historical SERP overlap.

## Trigger
A keyword list (from research or a client) needs to become a page or content plan. Inputs: up to a few thousand keywords, location, language.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- The keyword list.
- Location and language.
- Method: SERP overlap or category grouping, and how many head terms to check.

## Endpoints used (in order)
- `POST /v3/dataforseo_labs/google/keyword_overview/live` (volume, difficulty, intent, core keyword)
- `POST /v3/dataforseo_labs/google/search_intent/live` (intent labels, if not already present)
- `POST /v3/dataforseo_labs/google/categories_for_keywords/live` (topic categories)
- `POST /v3/dataforseo_labs/google/historical_serps/live` (past SERPs per keyword, for overlap)

## Steps
1. Enrich keywords with `keyword_overview` (batches up to 700) and read `keyword_properties.core_keyword`, difficulty and `search_intent_info`.
2. Fill any missing intent with `search_intent` (up to 1000 per call).
3. Add categories with `categories_for_keywords` (up to 1000 per call).
4. For the head terms, pull `historical_serps` and compare top 10 URLs: keywords sharing several ranking URLs belong on one page.
5. Group by core keyword and SERP overlap, then label each cluster with intent and category.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

N = keywords, H = head terms checked for SERP overlap.
- Enrichment: ceil(N/700) x (task + item x N) for `keyword_overview`; ceil(N/1000) x (task + item x N) for `search_intent` and `categories_for_keywords` where used.
- Overlap: H x task(`historical_serps`) per SERP returned (set `date_from` to limit to recent SERPs).

Cheapest mode: Labs is Live only; `historical_serps` ($0.00012 per SERP) is the cheapest SERP overlap source, far below a live SERP.

Typical run (500 keywords: overview and intent, plus 50 head term SERPs): 2 x $0.012 + 1000 x $0.00012 + 50 x $0.00012 = $0.15 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Clusters with a name, member keywords, combined volume, dominant intent, category, and a suggested page type.

## Visuals
- `table`: clusters with keyword count, total volume and dominant intent. Fields: `items[].keyword_properties` (core_keyword), `items[].keyword_info` (search_volume), `items[].search_intent_info` (main_intent). Sort by total volume desc.
- `hbar`: total search volume per cluster. Fields: `items[].keyword_info` (search_volume). Sort desc, top 15.
- `scatter`: keyword difficulty vs search volume. Fields: `items[].keyword_properties` (keyword_difficulty), `items[].keyword_info` (search_volume). lower_is_better on difficulty; x_label difficulty, y_label volume; labels = keyword.

## Tell the user
- Clusters with head term, total volume and intent.
- The page to build or update for each cluster.
- Cannibalization risks.
- Next: [[content-brief]] for the top clusters.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Historical SERPs are periodic snapshots, not today's SERP; for a few critical clusters confirm with a live SERP.
- Intent is Google-specific and language-based.
- Cluster by SERP overlap only for head terms; it does not scale cheaply to the long tail.

Related: [[labs]] · [[keyword-research]] · [[content-brief]]
