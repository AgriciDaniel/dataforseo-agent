---
type: module
module: keywords-data
title: "Keywords Data API"
agent_description: "Use for Google Ads and Bing Ads search volume, CPC, bids and keyword suggestions, plus Google Trends, DataForSEO Trends and clickstream-based volume."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Keywords Data API

## Purpose
Advertiser-grade keyword metrics passed through from Google Ads and Microsoft Advertising, plus trend and clickstream signals.

## Use when
- You need ground-truth Google Ads volume, CPC, competition and bids for a defined keyword set (one task covers up to 1000 keywords at the same price).
- Bing volume, keyword performance or audience estimation.
- Seasonality and breakout topics (Google Trends), demographic or subregional interest (DataForSEO Trends), or finer per-keyword volume than Ads buckets (clickstream).

## Do not use when
- You are brainstorming or scoring thousands of ideas: [[labs]] is cheaper and returns difficulty and intent too. Confirm only the final shortlist here.

## Defaults
- Standard queue for batches; Live only for interactive lookups.
- Raw Google Ads volume for sizing and bids; clickstream volume only when ranking decisions depend on differences inside an Ads bucket.

## Gotchas
- Google Ads Live is limited to 12 requests/min per account.
- Google Ads groups similar keywords and returns combined volume; some UTF symbols and emojis are rejected. Ads volume is bucketed (about 80 logarithmic values).
- Bing endpoints support English, French and German only in several places; Bing performance data updates after the 3rd of each month.
- Google Trends values are relative (0 to 100), not volumes; max 5 keywords.
- Clickstream calls are among the most expensive keyword calls; use deliberately.
- Tool-to-tool volume differences of 30% to 200% are normal; present volumes as estimates.

Reference: [[cap-keywords-data-api]], [[cap-trends-and-clickstream]], [[ent-google-ads-keyword-planner]], [[ent-clickstream-data]].
