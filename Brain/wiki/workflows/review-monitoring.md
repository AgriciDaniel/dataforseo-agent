---
type: workflow
skill: review-monitoring
title: "Review Monitoring"
description: "Use when tracking reviews for a business across Google, Trustpilot and Tripadvisor, with rating trends and themes."
modules: [business-data, content-analysis]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Review Monitoring

> Use when tracking reviews for a business across Google, Trustpilot and Tripadvisor, with rating trends and themes.

## Trigger
Reputation monitoring for a brand or locations. Inputs: Google `place_id` or `cid`, Trustpilot domain, Tripadvisor `url_path`.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Profile ids per platform (Google `place_id` or `cid`, Trustpilot domain, Tripadvisor path).
- Review depth and date window.
- Cadence.

## Endpoints used (in order)
- `POST /v3/business_data/google/reviews/task_post` (Google reviews)
- `POST /v3/business_data/trustpilot/reviews/task_post` (Trustpilot reviews)
- `POST /v3/business_data/tripadvisor/reviews/task_post` (Tripadvisor reviews)
- `POST /v3/content_analysis/rating_distribution/live` (optional, web-wide rating distribution for the brand)

## Steps
1. Identify each profile: Google by `place_id`/`cid`, Trustpilot by `domain` (use `trustpilot/search` if unknown), Tripadvisor by `url_path` (use `tripadvisor/search`).
2. Queue review tasks with `depth` set to the reviews needed and `sort_by` newest.
3. Collect results; normalise rating, text, date, owner reply across the three schemas.
4. Compute volume, average rating, reply rate and recent themes; compare with the previous run.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

L = profiles, B = review blocks requested per profile.
- Sum over profiles: B x task(`reviews/task_post`) for the platform (billed per block of reviews).
- Optional: task + item x rows for `rating_distribution`.

Cheapest mode: Standard queue (`task_post`) for all review endpoints; `rating_distribution` is Live only.

Typical run (3 platforms, 2 review blocks each, plus rating distribution): 6 x $0.00075 + $0.024 + 5 x $0.000036 = $0.02868 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A per-platform table of review volume, average rating, reply rate and new reviews since the last run, plus recurring themes.

## Visuals
- `line`: average rating per platform over time. Fields: `items[].rating` (rating.value), `items[].timestamp`. One series per platform, monthly, scale 1 to 5.
- `hbar`: rating distribution. Fields: `items[].rating` (rating.value), `metrics` (rating_distribution). Bars 5 to 1 stars, unit reviews.
- `table`: newest reviews. Fields: `items[].rating`, `items[].timestamp`, `items[].url`. Sort by date desc, top 15.

## Tell the user
- Rating trend and new review count per platform.
- Negative themes and unanswered reviews.
- Next: [[brand-sentiment-monitoring]] for wider coverage.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Trustpilot `task_post` is limited to 30 calls per minute and Tripadvisor reviews to 110 per minute.
- Each platform has its own identifier and schema.
- `extended_reviews` gives more detail on Google at a higher cost; use it only when needed.

Related: [[business-data]] · [[google-business-profile-audit]] · [[brand-sentiment-monitoring]]
