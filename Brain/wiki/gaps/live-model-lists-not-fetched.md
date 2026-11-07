---
type: gap
title: "Live LLM model lists not fetched"
domain: dataforseo
status: open
confidence: evidence-based
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, gap]
---

# Live LLM model lists not fetched

The `/v3/ai_optimization/{provider}/llm_responses/models` endpoints are free but need credentials, and were not called. Docs pages show example lists only ([[ai-optimization]]).

- Impact: the agent must call `/models` at run time before choosing `model_name`; it cannot answer "which models are supported" from the brain.
