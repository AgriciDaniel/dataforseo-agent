---
type: workflow
skill: ai-visibility-tracking
title: "AI Visibility Tracking"
description: "Use when measuring how a brand shows up in AI answers (ChatGPT, Google AI Overview, Claude, Gemini, Perplexity): mentions, citations and share of voice over time."
modules: [ai-optimization, serp]
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
confidence: practitioner
---

# AI Visibility Tracking

> Use when measuring how a brand shows up in AI answers (ChatGPT, Google AI Overview, Claude, Gemini, Perplexity): mentions, citations and share of voice over time.

## Trigger
A brand wants to know how it shows up in AI answers: a GEO program launch, a competitive share-of-voice study, or monitoring after a content push. Inputs are target entities (brand domain and/or keywords) and a prompt set of real buyer questions.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Brand name or domain, and up to a few competitors.
- Keyword or prompt set (real buyer questions).
- Models to sample for LLM Responses, and cadence.
- Location (ChatGPT mention data is US only).

## Endpoints used (in order)
- `POST /v3/ai_optimization/llm_mentions/search_mentions/live` (raw mention records).
- `POST /v3/ai_optimization/llm_mentions/target_metrics/live` (consolidated metrics).
- `POST /v3/ai_optimization/llm_mentions/multi_target_metrics/live` (multi-brand comparison).
- `POST /v3/ai_optimization/llm_mentions/top_mentioned_domains/live` and `/top_mentioned_pages/live` (most-cited sources).
- `POST /v3/ai_optimization/{chat_gpt|claude|gemini|perplexity}/llm_responses/live` (live answer sampling).
- `POST /v3/ai_optimization/ai_keyword_data/keywords_search_volume/live` (AI search volume).

## Steps
1. Define targets: build the `target` array (up to 10 entities) of domains (`domain`, `search_filter`, `search_scope` sources/search_results) and keywords (`keyword`, `match_type`, `search_scope` question/answer/brand_entities). Set `platform` (`google` for AI Overview, `chat_gpt`) plus `location_code`/`language_code`.
2. Pull mentions with `llm_mentions/search_mentions`: each item returns the `question`, the `answer` (markdown), cited `sources[]` (title, url, domain, position), `search_results[]`, `brand_entities[]`, `fan_out_queries[]`, and `ai_search_volume` with `monthly_searches[]`.
3. Aggregate visibility with `target_metrics` (mentions + ai_search_volume grouped by location/language/platform/source domain) and compute share of voice = your mentions / total tracked-brand mentions.
4. Benchmark competitors with `multi_target_metrics`: supply 2-10 `targets` each with an `aggregation_key` label to get side-by-side group totals in one call.
5. Find citation surfaces with `top_mentioned_domains`/`top_mentioned_pages` to see which domains and pages the models cite for your topic (often third-party/UGC, not your own site).
6. Sample fresh answers with `llm_responses`: send the same prompt set across ChatGPT, Claude, Gemini, and Perplexity (`user_prompt` <=500 chars, choose `model_name`, set `web_search: true` to force current citations) and parse `items[]` message `sections[]` and `annotations[]` for mention presence and sentiment.
7. Score and chart: per engine, record mention rate, citation rate, share of voice, position, and sentiment over time; alert on drops.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

T = target sets, P = prompts, M = models, R = runs.
- LLM Mentions: per call task(x) + item(x) x rows, for each of `search_mentions`, `target_metrics`, `multi_target_metrics`, `top_mentioned_domains`, `top_mentioned_pages` you run. Cap rows with `limit`.
- LLM Responses: P x M x R x (task(`{provider}/llm_responses/live`) + the model's `money_spent`). Budget the token part separately; it varies by model and answer length. Never quote the bare fee: plan $0.01 to $0.03 per answer (live test 2026-11-06 billed $0.0007 to $0.0258 for a tiny prompt), more with web search or long answers.
- AI Keyword Data: task + item x keywords.
- Cadence: mentions monthly or weekly; prompt sampling weekly.

Cheapest mode: LLM Mentions is Live only ($0.10 per task + $0.001 per row), so cap rows with `limit`. LLM Responses add the model's own `money_spent`; sample a few prompts before a full run.

Typical run (3 LLM Mentions calls (target metrics, multi target metrics for 4 brands, search mentions with 100 rows), about 105 rows): 3 x $0.1 + 105 x $0.001 = $0.405 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
An AI visibility dashboard per engine: mention rate, citation rate, AI share of voice, sentiment, the most-cited source domains/pages, and the fan-out queries driving answers. Pairs with [[content-brief]] to act on citation gaps.

## Visuals
- `hbar`: mentions per brand or domain. Fields: `items[].domain`, `aggregated_metrics`. Sort desc, top 15, unit mentions.
- `line`: mentions change over time. Fields: `items[].date`, `items[].delta_mentions` (timeseries_delta). One point per group_range period.
- `table`: top questions where the brand appears. Fields: `items[].question`, `items[].ai_search_volume`, `items[].model_name`. Sort by ai_search_volume desc, top 20.

## Tell the user
- Mention count and share of voice against competitors.
- Top cited domains and pages, and the prompts where the brand is missing.
- That LLM answers are sampled and ChatGPT mention data is US only.
- Next: [[content-brief]] for the prompts the brand loses.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Coverage is narrower than the headline: ChatGPT mentions data is US (`location_code 2840`) and English only; Google AI Overview supports multiple locations/languages.
- `impressions` is deprecated and returns null; do not build on it.
- LLM Responses `annotations[]` can be empty even when `web_search: true`, and `web_search` is unsupported on some reasoning models (o1, o3-mini); validate per model.
- Most brand validation is off-domain (third-party pages), so track earned/UGC sources, not just your own site.
- Track each engine separately; cross-engine citation overlap is low, so a single blended number hides the real picture.
