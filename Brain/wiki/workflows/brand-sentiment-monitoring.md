---
type: workflow
skill: brand-sentiment-monitoring
title: "Brand Sentiment Monitoring"
description: "Use when tracking how a brand, product or topic is discussed across the web: mention volume, sentiment, top sources and trends."
modules: [content-analysis]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Brand Sentiment Monitoring

> Use when tracking how a brand, product or topic is discussed across the web: mention volume, sentiment, top sources and trends.

## Trigger
Reputation tracking, PR monitoring, or pre-launch research. Inputs: brand or topic keyword, date window.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Brand or topic keyword.
- Date window and language or country filters.
- Row cap for citations, and cadence.

## Endpoints used (in order)
- `POST /v3/content_analysis/summary/live` (overview of the citation set)
- `POST /v3/content_analysis/sentiment_analysis/live` (sentiment and connotation)
- `POST /v3/content_analysis/phrase_trends/live` (mentions over time)
- `POST /v3/content_analysis/search/live` (the actual citations, capped)

## Steps
1. Run `summary` for the keyword to get volume, top domains and page types.
2. Run `sentiment_analysis` for the positive, negative and neutral split and emotions.
3. Run `phrase_trends` from `date_from` (not before 2022-10-31) to see the trend.
4. Pull a capped sample of citations with `search` (use `page_type` and filters) to quote real examples.
5. Compare with the previous period.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- task + item x rows for each endpoint used; `search` rows dominate, so set `limit`.
- R runs per month multiply the total.

Cheapest mode: Content Analysis is Live only ($0.024 + $0.000036 per row). Run `summary` and `sentiment_analysis` first; cap `search` rows.

Typical run (summary, sentiment, phrase trends and 100 citations, about 120 rows): 4 x $0.024 + 120 x $0.000036 = $0.10032 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Mention volume and trend, sentiment split, top domains and page types, and example citations.

## Visuals
- `share-bar`: positive, neutral and negative mentions. Fields: `sentiment_connotation_distribution`. Unit percent.
- `line`: mention volume over time. Fields: `date`, `total_count` (phrase_trends). One point per period, at least 3.
- `hbar`: top domains mentioning the brand. Fields: `top_domains` (summary). Sort desc, top 10.

## Tell the user
- Mention volume over time and the sentiment split.
- Top sources and the spikes, with what drove them.
- That coverage is DataForSEO's content index, not social networks.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Sentiment is model-derived.
- The corpus is not a live crawl; very recent mentions may be missing.
- Quotes in reports must be attributed to their source page.

Related: [[content-analysis]] · [[review-monitoring]]
