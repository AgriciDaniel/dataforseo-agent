---
type: workflow
skill: keyword-research
title: "Keyword Research Workflow"
description: "Use when turning seed keywords into a prioritized keyword list with volume, CPC, difficulty and intent."
modules: [keywords-data, labs]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Keyword Research Workflow

> Use when turning seed keywords into a prioritized keyword list with volume, CPC, difficulty and intent.

## Trigger
A topic, product, or page needs a keyword universe: a new content cluster, a PPC build, or a site launch. Inputs are 1-200 seed keywords plus a `location_code` and `language_code`.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Seed keywords.
- Location and language.
- Intent focus, volume and difficulty thresholds, and list size.

## Endpoints used (in order)
- `POST /v3/keywords_data/google_ads/search_volume/live` (ground-truth volume/CPC for the seeds).
- `POST /v3/dataforseo_labs/google/keyword_ideas/live` (category-relevant expansion).
- `POST /v3/dataforseo_labs/google/keyword_suggestions/live` and `/related_keywords/live` (phrase and "searches related" expansion).
- `POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live` (KD for up to 1,000 keywords/request).
- `POST /v3/dataforseo_labs/google/search_intent/live` (intent for up to 1,000 keywords/request).
- `POST /v3/dataforseo_labs/google/keyword_overview/live` (consolidated metrics for a final shortlist).

## Steps
1. Validate the seeds (UTF-8, lowercase) and resolve `location_code` + `language_code`.
2. Pull anchor volume: send up to 1,000 seeds to Keywords Data `search_volume` (Google Ads lineage). Read `search_volume`, `competition`/`competition_index` (0-100), `cpc`, and `monthly_searches[]` for seasonality. One request covers 1 or 1,000 keywords at the same price.
3. Expand with Labs `keyword_ideas` (up to 200 seeds, returns category-relevant terms with `keyword_info` volume/CPC/competition, `keyword_properties.keyword_difficulty`, and inline `search_intent_info`). Use `closely_variants`, `ignore_synonyms`, and `filters` to shape the set; page with `offset_token` beyond 10,000 results.
4. Deepen with `keyword_suggestions` (long-tail phrase-match around a seed) and `related_keywords` (the "searches related to" graph) to capture demand the ideas endpoint misses.
5. Score difficulty in bulk: batch up to 1,000 candidates into `bulk_keyword_difficulty` to get the 0-100 logarithmic KD per term in one billed task.
6. Tag intent: send up to 1,000 keywords to `search_intent` (language-only) for `keyword_intent.label` (informational/navigational/commercial/transactional) plus `probability` and `secondary_keyword_intents[]`.
7. Prioritize: combine volume x intent x KD x CPC into a score, drop irrelevant or out-of-language terms (`keyword_properties.is_another_language`), and run `keyword_overview` on the shortlist for a clean consolidated record per keyword.
8. Hand the scored list to [[content-brief]] or a PPC build.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

S = seed batches (1000 keywords each), E = expansion calls, N = candidate keywords, F = final shortlist batches.
- Anchor volume: S x task(`google_ads/search_volume`) (flat per task, any count up to 1000).
- Expansion: E x (task(`keyword_ideas`) + item(`keyword_ideas`) x returned items, capped by `limit`), same for suggestions and related keywords.
- Scoring: ceil(N/1000) x (task + item x N) for `bulk_keyword_difficulty` and `search_intent`.
- Shortlist: F x task(`keyword_overview`) plus items.
- `include_clickstream_data` roughly doubles Labs cost; leave off unless asked.

Cheapest mode: Google Ads `search_volume` in the Standard queue (`task_post`, $0.06) instead of Live ($0.09); Labs is Live only.

Typical run (10 seeds: search volume (Standard), 5 Labs calls returning about 950 items): $0.06 + 5 x $0.012 + 950 x $0.00012 = $0.234 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A prioritized keyword table: keyword, search_volume, monthly trend, competition/CPC, keyword_difficulty, main_intent, and a composite priority score, ready for clustering, briefs, or campaign builds.

## Visuals
- `table`: keyword list with volume, difficulty, CPC and trend. Fields: `items[].keyword`, `items[].keyword_info` (search_volume, cpc, monthly_searches), `items[].keyword_properties` (keyword_difficulty). lower_is_better on difficulty; sparkline column from monthly_searches, sort by volume desc, top 25.
- `scatter`: keyword difficulty vs search volume. Fields: `items[].keyword_properties` (keyword_difficulty), `items[].keyword_info` (search_volume). lower_is_better on difficulty; x_label difficulty, y_label volume; labels = keyword.
- `share-bar`: search intent mix. Fields: `items[].keyword_intent`. Unit percent of keywords.

## Tell the user
- Top opportunities: volume against difficulty for the intent wanted.
- Seasonality from `monthly_searches`.
- That `search_volume` is DataForSEO's average monthly rate, not a 12 month mean ([[labs]]).
- Next: [[keyword-clustering]] or [[content-brief]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Keywords Data Google Ads is capped at 12 requests/min/account and returns combined volume for groups of similar keywords; certain emojis/UTF symbols are rejected.
- Labs `include_clickstream_data: true` doubles the request cost; only enable when you need demographic/clickstream volume.
- `keyword_ideas` takes max 200 seeds; `keyword_suggestions`/`related_keywords` take a single seed; do not over-batch.
- Labs volume is a pre-computed estimate, not live Google Ads data; for ad-bidding accuracy confirm the final set against Keywords Data `search_volume`.
- `search_intent` is language-only (no location) and Google-specific; there is no marketplace equivalent.
