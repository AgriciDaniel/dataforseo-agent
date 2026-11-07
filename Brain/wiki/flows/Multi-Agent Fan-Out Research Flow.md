---
type: flow
title: "Multi-Agent Fan-Out Research Flow"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, flow, procedure]
---

# Multi-Agent Fan-Out Research Flow

Agent operating procedure (read on demand).

## Trigger
A job needs several API modules, for example a competitor analysis using Labs, Backlinks and Domain Analytics.

## Prerequisites
- The router note and module notes.
- An approved total budget.

## Steps
1. Router splits the job into module tasks using [[which-api-for-which-job]] (one module agent per task).
2. Cost guard estimates each task from the catalog and checks the total against the approved budget before any call.
3. Module agents run in parallel within the 30 simultaneous request limit, each returning a compact summary plus the path of any saved raw result.
4. Router merges summaries, resolves conflicts between modules (for example Labs estimates vs live SERP), and reports actual total cost.

## Outputs
One merged answer with per-module findings, the endpoints used, and actual cost per module.

## Gates
- Cost guard approval before the first paid call; a running total that stops at the budget.
- Sub-agents return summaries, not full JSON.

## Failure modes
- One module fails (error or budget stop): report partial results and the failure, do not silently drop it.
- Rate or concurrency errors (40202, 40209): back off and queue instead of retrying in parallel.

## Rollback
Cancel remaining module tasks; results already paid for are kept and reported.
