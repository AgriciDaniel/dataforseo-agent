---
type: cost
title: "Budget gates"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-07
tags: [dataforseo, cost, approval, safety]
confidence: practitioner
---

# Budget gates

Every paid DataForSEO call goes through one rule: **estimate, show the arithmetic, ask, run, report.**
Nothing is spent without a priced yes from the user. This holds for every client, including the official
MCP server, whose `api_request` tool has no cost check of its own ([[mcp]], [[cost-control]]).

## The five steps

1. **Estimate.** Build the exact request list first: endpoint path, mode (Live, Standard queue, Priority
   queue), number of tasks, and every parameter that changes the bill (`depth`, `limit`, `max_crawl_pages`,
   `calculate_rectangles`, `load_async_ai_overview`, `people_also_ask_click_depth`, `include_clickstream_data`,
   search operators in the keyword). Price each request from the catalog (`research/endpoints.json`,
   field `price`), never from memory.
2. **Show the arithmetic.** One line per request group, then a total. Use the worst case the user could be
   billed, not the likely case. When the price has a per-row or per-item part, multiply by the `limit` you
   will send, not by the rows you expect back.
3. **Ask once.** Show the plan and the maximum total. In the app, then make the call in the same turn:
   its request prompt (method, path, body, list price) is the one approval, and a second question in chat
   makes the user approve twice. End the estimate with "Maximum $X. Approve it in the prompt." For several
   paid calls, give the plan total first; each call then gets its own prompt. Clients without a request
   prompt: end with "Run it for $X?" (for example "Run it for $0.06?") and wait for a clear yes. An approval
   covers this plan only; if it changes (more tasks, a pricier mode, a higher limit), estimate again.
   Free calls (sandbox, `user_data`, locations, languages, `tasks_ready`, `task_get`) need no approval.
4. **Run.** Send exactly the approved requests. Stop when the approved maximum would be exceeded. Never
   retry spend errors (40200, 40203, 40210); report them instead.
5. **Report.** Add up the `cost` field from each response (the top-level `cost` and each `tasks[].cost`),
   and show actual spend next to the approved maximum. If actual cost exceeds the estimate, say so and
   explain why before running anything else.

## Example

Request: top 20 Google results for 50 keywords, Standard queue, no extras. Let `P` be the catalog price
for `serp/google/organic/task_post` in the Standard queue (one SERP of 10 results).

| Line | Arithmetic |
|---|---|
| `serp/google/organic/task_post`, depth 20 | 50 tasks x 2 SERPs x `P` |
| `tasks_ready` and `task_get/advanced` | free |
| **Total** | **100 x `P`**, shown in USD |

With `P` = $0.0006 the total is $0.06, and the estimate ends: Maximum $0.06. Approve it in the prompt.

Depth bills one more base price per extra 10 results, and `calculate_rectangles` or
`load_async_ai_overview` each add one base price per task, so adding pixel rankings here makes it
150 x `P`. Live uses the Live tier price instead of `P`.

Two-part prices (per task plus per row or item) multiply out as task price + `limit` x row price, per
request, using the `limit` you send. That is the maximum: rows are billed as returned, so fewer rows cost
less. Backlinks: $0.024 per request + $0.000036 per returned row; 5000 backlinks = 5 x $0.024 + 5000 x
$0.000036 = $0.30 (pricing page checked 2026-11-06, details in [[backlinks]]).

Prices the catalog fee alone understates (live test 2026-11-06): LLM Responses add the model's token cost, so
budget $0.01 to $0.03 per call ([[ai-optimization]]); Labs `domain_metrics_by_categories` and
`historical_bulk_traffic_estimation` are $0.12 + $0.0012 per domain; `technology_stats` bills one item per month
of the date range.

## Before the first call

- Check the balance with the free `GET /v3/appendix/user_data` and compare it to the total.
- Prefer the sandbox (`https://sandbox.dataforseo.com`, free, dummy data) to test request shape ([[sandbox-and-account]]). The
  official MCP server cannot reach the sandbox; use a direct HTTP call.
- Prefer cheaper routes first: Standard over Live, Labs over live scraping, bulk endpoints over many
  single calls ([[live-vs-standard]], [[labs-vs-live]]).

## Bounded budgets

A user may approve a budget instead of a single plan ("up to $5 today for keyword research"). Then: keep a
running total of actual `cost`, estimate each new plan against the remaining budget, run without asking
again only while the plan's maximum fits inside what is left, and stop and ask when it does not. A budget
covers the job and time the user named, nothing wider.

Prices always come from the endpoint catalog (`price` field), never from this note.
