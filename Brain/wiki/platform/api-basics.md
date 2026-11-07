---
type: platform
title: "API basics"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-07
tags: [dataforseo, platform]
confidence: evidence-based
---

# API basics

- Base URL `https://api.dataforseo.com/v3/`; sandbox `https://sandbox.dataforseo.com/v3/` (same paths, same credentials, free dummy data). v2 closed on 2026-05-05.
- Path grammar: `/v3/{module}/{engine or group}/{function}/{method}`, for example `/v3/serp/google/organic/task_post` or `/v3/dataforseo_labs/google/keyword_ideas/live`. Utility endpoints sit under `/v3/appendix/`. The catalog lists 583 endpoints across 11 data APIs plus Appendix, 576 of them active (the other 7 are deprecated, removed or unavailable, `status` field); Databases is a bulk file product with no endpoints, and Content Generation is discontinued (research/brain-facts.md, 2026-11-06).
- Auth: HTTP Basic on every call, `Authorization: Basic base64(login:password)`. The API password is auto-generated and differs from the dashboard password. Never put credentials in URLs, notes, logs or fixtures; read them from the user's env (`DATAFORSEO_LOGIN` or its alias `DATAFORSEO_USERNAME`, and `DATAFORSEO_PASSWORD`).
- Requests: POST with a JSON array of task objects (up to 100 per Standard `task_post`, 1 per Live call). GET for `tasks_ready`, `task_get` and most utility endpoints.
- Response envelope: `status_code`, `status_message`, `cost`, `tasks_count`, `tasks_error`, `tasks[]`. Each task has its own `id`, `status_code`, `cost` and `result[]`. HTTP 200 can still carry per-task errors, so always check both levels.
- `cost` in the envelope is the authoritative charge for that call. Errored tasks cost 0.
- Retention: Standard results 30 days (re-collect free; later returns 40403), HTML results 7 days, Live results are never stored, Page Screenshot URLs 1 day.
- Targeting: one location (`location_code`, `location_name` or `location_coordinate`) and one language per task where required. Resolve codes from each module's free `locations`/`languages` helper endpoints instead of hardcoding; outdated codes fail with 40505. Pin `device` (desktop/mobile) because the SERPs differ. Language codes differ by API: Amazon Merchant takes locale codes such as `en_US` (from `/v3/merchant/amazon/languages`); plain `en` fails there with 40501 (live test 2026-11-06).
- Dates: never copy dates from examples or notes; set them relative to today. Future only for hotel `check_in` and `check_out` (check_out after check_in); `id_list` needs `datetime_from` and `datetime_to` in UTC as `YYYY-MM-DD HH:MM:SS +00:00`, within the last 30 days when `include_metadata` is true (six months when false), never in the future (docs, checked 2026-11-06).

Detail: [[cap-platform-architecture]], [[cap-authentication-security]], [[cap-locations-languages-targeting]].
