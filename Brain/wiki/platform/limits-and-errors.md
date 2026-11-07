---
type: platform
title: "Limits and errors"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, platform]
confidence: evidence-based
---

# Limits and errors

## Limits
- Account rate limit 10000 calls/min (40202 when exceeded; research/brain-facts.md, 2026-11-06; older notes say 2000). Errored calls still count.
- 100 tasks per Standard POST (40006); 1 per Live call; Instant Pages, Content Parsing and Page Screenshot max 20.
- 30 simultaneous requests on Live and database-backed APIs (40209). Prefer the Standard queue over engineering concurrency.
- Endpoint-specific: Google Ads Live 12/min per account, Google Trends Live 250/min system-wide, `tasks_ready` 20/min (up to 1000 tasks per call, last 3 days), appendix `status` 10/min. `user_data` has no documented per-minute limit; it returns your own `rates` and `limits`.
- Duplicate-task limits: hourly 40205, daily 40206.

## Errors
- Success: 20000 (Ok), 20100 (task created). 40601/40602 are transient queue states, not failures.
- Retry after a delay: 40103, 40601, 40602, 50301, 50303, 50401, 50402. 50000 Internal Error: retry once, then report.
- 40102 No Search Results is an empty result, not a failure, and some SERP endpoints still bill it (Ads Search, Dataset Info, live test 2026-11-06); fix the input instead of resubmitting. On widespread failures pause 5 to 10 minutes.
- Fix before retrying: auth 40100/40104, money 40200/40203/40210, validation 40501 to 40506, not found 40400 to 40408 (40402 = path does not exist, 40403 = results expired, 40404 = sandbox has no prepared data), 40207 IP not whitelisted, 40505 outdated location.
- 40204 "subscription required" is legacy for Backlinks and LLM Mentions since 2026-07-01; elsewhere treat it as an access error and stop.
- Spend stops (40200, 40203, 40210) must halt the run and be reported, never retried.

Detail: [[cap-rate-limits-throughput]], [[cap-status-error-codes]].
