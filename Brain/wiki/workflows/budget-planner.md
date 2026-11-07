---
type: workflow
skill: budget-planner
title: "Budget Planner"
description: "Use when pricing a whole project before running anything: maps each job to endpoints and modes, totals the cost from the catalog, compares it with the balance and budget, and shows a cheaper plan."
modules: [appendix]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Budget Planner

> Use when pricing a whole project before running anything: maps each job to endpoints and modes, totals the cost from the catalog, compares it with the balance and budget, and shows a cheaper plan.

## Trigger
"What will this cost", a client quote, a monthly program (tracking, reports, audits), or any plan with more than one paid step.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- The jobs: what the user wants to know or deliver, per site or client.
- Volumes: keywords, domains, pages, locations, devices.
- Cadence: one off, weekly, monthly, and for how long.
- Freshness need: is a few minutes' delay fine (Standard queue) or must it be instant (Live).

## Endpoints used (in order)
- `GET /v3/appendix/user_data` (free: `money.balance` and the account's own prices)
- No paid calls. Prices come from the catalog `research/endpoints.json` (`price.tiers`).

## Steps
1. Map each job to a workflow and its endpoints with [[which-api-for-which-job]].
2. For each step pick the mode from `prefer_mode` ([[settings]]) and count units: tasks, SERPs, items or rows (use `limit` as the maximum).
3. Price each step: units x catalog price for that mode; add add ons and depth blocks ([[budget-gates]]).
4. Sum per run, per month and for the whole project.
5. Build the cheaper plan: Standard over Live, Labs over live SERP, bulk over per target, fewer rows ([[cost-optimized-pipeline]]).
6. Compare both totals with `money.balance` and `budget_per_session_usd`.

## Cost estimate
Free: `user_data` and the catalog only.

Cheapest mode: not applicable; the planner itself spends nothing.

Typical run (pricing a 100 keyword daily rank tracker for 30 days, Standard queue): 100 x 30 x $0.0006 = $1.80 against $6.00 in Live (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A priced plan: one row per step, totals per run, per month and overall, the cheaper alternative with its saving, and whether the balance covers it.

## Visuals
- `table`: the plan. Fields: catalog `path`, `price.tiers` (mode, price_usd), units and step cost computed here. Sort by cost desc.
- `hbar`: cost per step. Fields: step names and computed costs. Unit USD, sort desc, lower_is_better.
- `kpi`: total against balance and session budget. Fields: computed total, `money` (money.balance), `budget_per_session_usd` from settings.
- `share-bar`: cost share by module. Fields: catalog `module` and computed costs. Unit percent.

## Tell the user
- The total per run, per month and for the project, with the cheaper plan and its saving.
- Whether the balance and the session budget cover it, and what to top up if not.
- Which steps carry most of the cost and the one change that saves the most.
- That these are list prices and the billed `tasks[].cost` will show the real figure.
- If the user wants to run it now, end with the line "Run it for $X?" using the maximum total, for example "Run it for $1.80?".
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Two part prices (task plus row) are maximums at the `limit` sent; rows are billed as returned.
- Some endpoints have their own prices (for example `historical_rank_overview`); always read the catalog entry, never a module average.
- LLM Responses add the model's own cost on top of the task price.

Related: [[budget-gates]] · [[cost-model]] · [[cost-optimized-pipeline]] · [[getting-started]]
