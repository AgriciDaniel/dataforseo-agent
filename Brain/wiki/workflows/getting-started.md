---
type: workflow
skill: getting-started
title: "Getting Started"
description: "Use when a user is new to DataForSEO Agent or asks to test the setup: check credentials and balance for free, run a free sandbox call, then one cheap real call with approval."
modules: [appendix, serp]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Getting Started

> Use when a user is new to DataForSEO Agent or asks to test the setup: check credentials and balance for free, run a free sandbox call, then one cheap real call with approval.

## Trigger
First run, "is it working", "test my setup", or a credentials or balance error.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Nothing for steps 1 to 3.
- For the real example: one keyword the user cares about (default: their brand name).

## Endpoints used (in order)
- `GET /v3/appendix/user_data` (free: login, balance in `money.balance`, rate limits, account prices)
- `GET /v3/appendix/status` (free, at most 10 per minute: is any API degraded)
- `POST /v3/serp/google/organic/live/advanced` on `https://sandbox.dataforseo.com` (free, dummy data)
- `POST /v3/serp/google/organic/live/advanced` on `https://api.dataforseo.com` (one real SERP, $0.002)

## Steps
1. Call `user_data`. A 401 or 40100 means wrong credentials: tell the user which environment variables the app reads (`DATAFORSEO_LOGIN` or the name set at install, and `DATAFORSEO_PASSWORD`), never their values. The password is the API password from the dashboard's API Access tab, not the account password. 40104 means the account still needs email or phone verification (`research/status-codes.json`, checked 2026-11-06).
2. Report the balance. Under $1, suggest a top up ($50 minimum, balance never expires) before real work ([[sandbox-and-account]]).
3. Call `status` and mention any API that is not ok.
4. Run the sandbox SERP call by direct HTTP with the same credentials (the MCP server cannot reach the sandbox). Show that the shape works and say the data is dummy.
5. Offer one real call: one keyword, settings location and language, Live, $0.002. Run it only after the user's yes.
6. Show the result, then suggest two workflows that fit what the user said they want.

## Cost estimate
Steps 1 to 4 are free. Step 5: 1 x task(`google/organic/live/advanced`).

Cheapest mode: the same SERP in the Standard queue costs $0.0006 but takes minutes; for a first test the instant Live call is worth the difference.

Typical run (all free checks plus one real SERP): $0.002 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Setup verdict (credentials, balance, API status), proof the sandbox works, and one real result.

## Visuals
- `kpi`: account balance. Fields: `money` (money.balance, money.total). Prose if only one number is shown.
- `table`: the real SERP, top 10. Fields: `items[].rank_group`, `items[].domain`, `items[].title`, `items[].type`. lower_is_better on rank_group; sort by rank_group.

## Tell the user
- Whether credentials and balance are fine, in one line.
- That paid calls always ask first with an estimate, and free ones do not.
- The commands to try next: `/dfs-route`, `/dfs-cost`, `/dfs-balance`, `/dfs-endpoint`.
- Two workflows to start with, such as [[serp-snapshot]], [[keyword-research]] or [[monthly-seo-report]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Never print credentials; refer to the variable names.
- The sandbox returns dummy data; never present it as real.
- `status` allows only 10 requests per minute.

Related: [[sandbox-and-account]] · [[api-basics]] · [[budget-planner]] · [[serp-snapshot]]
