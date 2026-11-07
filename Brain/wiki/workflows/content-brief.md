---
type: workflow
skill: content-brief
title: "Content Strategy Brief"
description: "Use when turning a topic into a writer-ready content brief from the live SERP, Labs demand and intent, and web sentiment."
modules: [serp, labs, content-analysis]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# Content Strategy Brief

> Use when turning a topic into a writer-ready content brief from the live SERP, Labs demand and intent, and web sentiment.

## Trigger
A content topic is selected and needs a brief: a new article in a cluster, a refresh of an underperforming page, or a pillar build. Inputs are the target keyword/topic plus `location_code` and `language_code`.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Target keyword or topic.
- Location and language.
- Audience and page type; the existing URL for a refresh.

## Endpoints used (in order)
- `POST /v3/serp/google/organic/live/advanced` (the live competitive SERP).
- `POST /v3/dataforseo_labs/google/keyword_ideas/live` and `/related_keywords/live` (subtopics).
- `POST /v3/dataforseo_labs/google/search_intent/live` (intent of the topic + subtopics).
- `POST /v3/dataforseo_labs/google/top_searches/live` (demand/trend context).
- `POST /v3/content_analysis/search/live` and `/summary/live` (citation corpus).
- `POST /v3/content_analysis/sentiment_analysis/live` (sentiment + connotations).

## Steps
1. Scrape the SERP: call `serp/google/organic/live/advanced` for the target keyword. Read `result.items[]` to capture the ranking organic URLs (titles, descriptions, `is_featured_snippet`), the `item_types` present (people_also_ask, featured_snippet, ai_overview, video, etc.), and the `people_also_ask`/`related_searches` elements for questions to answer.
2. Map subtopics: run Labs `keyword_ideas` and `related_keywords` to build the semantic field around the topic, with `search_volume` and inline `keyword_difficulty` to weight coverage.
3. Tag intent: pass the topic plus key subtopics through `search_intent` to confirm whether the brief should be informational, commercial, etc., and shape the format accordingly.
4. Add demand context: use Labs `top_searches` (and optionally Keywords Data trends) to see rising vs declining interest and seasonal timing.
5. Read the discourse: run Content Analysis `search` for the topic to pull the citation corpus (titles, snippets, `page_category`, `domain_rank`, and `content_info.sentiment_connotations`), then `summary` for the aggregate view.
6. Gauge sentiment: run `sentiment_analysis` for `connotation_types` (positive/negative/neutral) and `sentiment_connotations` (anger, happiness, love, sadness, fun) plus `top_domains` and `text_categories` to pick an angle and tone.
7. Assemble the brief: target keyword + subtopics to cover, the questions (PAA) to answer, SERP features to win, recommended depth/format from competitor analysis, intent, and a tone/angle informed by sentiment.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

V = SERP query variants (usually 2 to 4).
- SERP: V x task(`/v3/serp/google/organic/live/advanced`).
- Labs: task + item x rows for `keyword_ideas`, `related_keywords`, `top_searches`; `search_intent` priced per keyword.
- Content Analysis: task + item x rows for `search`, `summary`, `sentiment_analysis`; the costliest step per call, so cap rows.

Cheapest mode: SERP in the Standard queue (`serp/google/organic/task_post`, $0.0006) when the user can wait, Live ($0.002) otherwise. Labs and Content Analysis are Live only.

Typical run (3 SERP variants Live, 3 Labs calls (150 items), 2 Content Analysis calls (51 rows)): 3 x $0.002 + 3 x $0.012 + 150 x $0.00012 + 2 x $0.024 + 51 x $0.000036 = $0.10984 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A writer-ready content brief: target keyword and weighted subtopics, the questions to answer, SERP features to target, competitor depth/format benchmark, intent classification, and a sentiment-informed angle. Feeds the editorial pipeline and complements [[keyword-research]].

## Visuals
- `table`: current top 10 results. Fields: `items[].rank_absolute`, `items[].domain`, `items[].title`. Organic items only, rank order.
- `share-bar`: search intent mix of the keyword set. Fields: `items[].keyword_intent`. Unit percent of keywords.
- `table`: target keywords with volume trend. Fields: `items[].keyword`, `items[].keyword_info` (search_volume, monthly_searches). Sparkline column from monthly_searches, sort by volume desc, top 20.

## Tell the user
- The dominant search intent and the format that ranks.
- What the top pages cover and miss.
- Subtopics, questions and keywords to include.
- Next: [[keyword-clustering]] to place the page in a cluster.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Use Live SERP here (not Labs) because the brief must reflect the current competitive page set; Live results are not stored, so capture them when received.
- Keyword special operators in the SERP query trigger a 5x charge; keep the topic query clean.
- Content Analysis is the costliest step per call; scope it with `page_type`, `filters` (max 8), and `limit` instead of pulling the full corpus.
- Labs intent is Google-specific and language-only; do not pass a location to it.
- Content Analysis runs over a citation database, not a live crawl, so very fresh content may be under-represented.
