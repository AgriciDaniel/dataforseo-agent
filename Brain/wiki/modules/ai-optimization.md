---
type: module
module: ai-optimization
title: "AI Optimization API"
agent_description: "Use for AI search visibility (GEO): querying ChatGPT, Claude, Gemini and Perplexity, scraping ChatGPT and Gemini answers, AI search volume, and LLM Mentions data on where brands and domains are cited in AI answers."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# AI Optimization API

## Purpose
Four groups: **LLM Responses** (prompt a model through one interface), **LLM Scraper** (capture the consumer ChatGPT and Gemini answer pages), **AI Keyword Data** (AI search volume), **LLM Mentions** (a database of brand and domain mentions in Google AI Overview and ChatGPT answers).

## Use when
- What do AI assistants say about a brand vs competitors, and which sources do they cite?
- Share of voice in AI answers over time; most-cited domains and pages for a topic.
- Sizing AI-era query demand.

## Do not use when
- You need AI Overview or AI Mode inside Google SERPs as part of rank tracking: [[serp]] covers both.

## Defaults
- LLM Mentions for aggregated visibility; LLM Responses for fresh, controlled prompt samples; LLM Scraper when the consumer UI answer (with ads and brand entities) matters.
- Fixed prompt and target sets so runs are comparable; track each engine separately (citation overlap between engines is low).

## Gotchas
- LLM Mentions endpoints were renamed; the old ones are legacy: `search_mentions`, `target_metrics`, `multi_target_metrics`, `top_mentioned_domains`, `top_mentioned_pages` (plus new historical, timeseries and brand endpoints). Use catalog paths, not old notes.
- LLM Mentions platforms: `google` (AI Overview, multi-locale) and `chat_gpt` (United States and English only).
- Valid model names come from the free `/v3/ai_optimization/{provider}/llm_responses/models` endpoint; never pin a model from memory.
- LLM Responses bills the model's token cost (`money_spent`) on top of the DataForSEO fee; never quote the bare fee. Live: $0.0006 + `money_spent`; billed in the 2026-11-06 live test for a tiny prompt: ChatGPT $0.0258, Claude $0.0151, Gemini $0.0007. Standard queue: $0.0002 + a $0.01 advance at POST ($0.0102 billed), the unused part refunded. Estimate at least $0.01 to $0.03 per call, more for long answers, web search or large models (pricing page and docs, checked 2026-11-06).
- Perplexity Live returned 50000 Internal Error once in the live test ($0 billed): retry once, then report.
- LLM Scraper, LLM Mentions and AI Keyword Data billed at the catalog price in the live test.
- Perplexity is Live only; `annotations` can be empty even with `web_search`; temperature and top_p cannot be combined.
- AI answers are non-deterministic and churn monthly; report trends, not single snapshots.

Reference: [[cap-ai-optimization-api]], [[cap-llm-mentions-visibility]], [[cap-geo-ai-search-optimization]], [[plat-ai-assistants]].
