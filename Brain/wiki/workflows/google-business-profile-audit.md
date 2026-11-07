---
type: workflow
skill: google-business-profile-audit
title: "Google Business Profile Audit"
description: "Use when auditing a Google Business Profile: profile completeness, recent posts, questions and answers, and reviews."
modules: [business-data]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Google Business Profile Audit

> Use when auditing a Google Business Profile: profile completeness, recent posts, questions and answers, and reviews.

## Trigger
A local business wants its profile checked, or an agency onboards a location. Inputs: business name or `cid`/`place_id`, location.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Business name, `cid` or `place_id`.
- Location and language.
- How many review blocks to read.

## Endpoints used (in order)
- `POST /v3/business_data/google/my_business_info/task_post` (profile details)
- `POST /v3/business_data/google/my_business_updates/task_post` (posts)
- `POST /v3/business_data/google/questions_and_answers/task_post` (Q&A)
- `POST /v3/business_data/google/reviews/task_post` (reviews)

## Steps
1. Pull `my_business_info` with the business name and location; confirm the `cid` and `place_id`.
2. Check completeness: category, hours, phone, website, attributes, description, photos, `is_claimed`.
3. Pull `my_business_updates` for posting frequency and recency.
4. Pull `questions_and_answers`: count unanswered questions.
5. Pull recent `reviews`: rating, volume, owner reply rate.
6. Produce a checklist of gaps and fixes.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- task(`my_business_info/task_post`) per profile.
- task + per-block price for `my_business_updates`, and per-block prices for `questions_and_answers` and `reviews` (blocks set by `depth`).
- Live variants of info and Q&A exist at higher prices; queue unless someone is waiting.

Cheapest mode: Standard queue (`task_post`) for every endpoint; Live versions cost more.

Typical run (Profile info, 1 updates block, 1 Q&A block, 2 review blocks): $0.0015 + $0.0015 + $0.00075 + $0.00075 + 2 x $0.00075 = $0.006 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A profile audit: completeness checklist, posting activity, unanswered questions, review health, and prioritised fixes.

## Visuals
- `table`: profile completeness checklist. Fields: `items[].title`, `items[].url`, `items[].domain` (my_business_info task_get). One row per field: present or missing.
- `hbar`: review rating distribution. Fields: `items[].rating` (reviews task_get). Bars 5 to 1 stars, unit reviews.
- `line`: posts per month. Fields: `items[].timestamp` (my_business_updates task_get). Monthly counts, at least 3 months.

## Tell the user
- Missing or weak profile fields, in fix order.
- Rating, review count and response rate.
- Unanswered questions and posting activity.
- Next: [[review-monitoring]] or [[local-seo-tracking]].
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Look up by `cid` or `place_id` once known; names alone can match the wrong business.
- Profile data is as fresh as the last crawl.
- For map-pack ranking, combine with [[local-seo-tracking]].

Related: [[business-data]] · [[local-seo-tracking]] · [[review-monitoring]]
