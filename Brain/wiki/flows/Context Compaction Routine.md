---
type: flow
title: "Context Compaction Routine"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, flow, procedure]
---

# Context Compaction Routine

Agent operating procedure (read on demand).

## Trigger
A DataForSEO response is too large to keep in the conversation (SERP advanced, backlinks lists, OnPage pages, LLM Mentions rows).

## Prerequisites
- A place to save raw responses (a file in the user's workspace).

## Steps
1. Request less: set `limit`, filters, `depth` and field trimming (MCP field-config) to what the question needs.
2. Save the full response to a file and keep only its path in context.
3. Summarise: counts, top items, the fields the user asked about, and the `cost`.
4. For multi-page results, page with `offset_token` or search-after tokens and summarise each page before fetching the next.

## Outputs
A short summary in context, the raw response on disk, and the cost of the call.

## Gates
- Never paste full raw JSON into the answer.
- Do not re-call an endpoint to recover a dropped response if a queued result can be re-collected free within 30 days.

## Failure modes
- Response truncated or lost: re-collect with `task_get` (queue) or re-run only with approval (Live results are not stored).

## Rollback
Delete the saved file if the user does not want it kept; nothing in the brain changes.
