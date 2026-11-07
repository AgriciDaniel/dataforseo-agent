---
type: workflow
skill: ads-transparency-research
title: "Ads Transparency Research"
description: "Use when finding which advertisers run Google ads for a brand or domain and what their ad creatives look like, from the Google Ads Transparency Center."
modules: [serp]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Ads Transparency Research

> Use when finding which advertisers run Google ads for a brand or domain and what their ad creatives look like, from the Google Ads Transparency Center.

## Trigger
Competitive PPC research: who advertises, which formats, how long ads have run. Inputs: advertiser name or domain.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Advertiser name or domain.
- Location (country) and platform or format filter, if any.
- Date window (default: last 30 days).

## Endpoints used (in order)
- `POST /v3/serp/google/ads_advertisers/task_post` (find advertiser ids by keyword)
- `POST /v3/serp/google/ads_search/task_post` (creatives by `advertiser_ids` or `target` domain)

## Steps
1. Search advertisers by name with `ads_advertisers` to get `advertiser_id` values.
2. Query `ads_search` with up to 25 `advertiser_ids` or a `target` domain; set `date_from`/`date_to` if the period matters (not before 2018-05-31).
3. Read creatives: `format` (text, image, video), `first_shown`, `last_shown`, `preview_image`.
4. Summarise formats, longevity and volume per advertiser.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

- task(`ads_advertisers/task_post`) per search.
- task(`ads_search/task_post`) per SERP of creatives (depth sets how many SERPs).
- Live variants exist at higher prices; use them only for an interactive one-off.

Cheapest mode: Standard queue (`task_post`, $0.0006 per task). Priority queue doubles it; Live only for an interactive one-off.

Typical run (1 advertiser search and 5 SERPs of creatives, Standard queue): 6 x $0.0006 = $0.0036 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Per advertiser: number of creatives, format mix, longest-running ads, and examples.

## Visuals
- `table`: advertisers with creative count and first and last seen dates. Fields: `items[].title`, `items[].advertiser_id`, `items[].first_shown`, `items[].last_shown`. Sort by creative count desc, top 20.
- `hbar`: creatives per advertiser. Fields: `items[].advertiser_id`, `items_count`. Sort desc, top 15, unit creatives.
- `share-bar`: creative type mix across all advertisers. Fields: `items[].type`. Percent of creatives.

## Tell the user
- Who advertises and how many creatives each runs.
- The format mix and the longest running ads (first and last shown dates).
- That coverage is Google's Ads Transparency Center only.
- Next: [[ppc-keyword-planning]] for the keywords behind the ads.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- `advertiser_ids` max 25 per request.
- Dates cannot precede 2018-05-31.
- This is transparency-center data, not spend or performance data.

Related: [[serp]] · [[ppc-keyword-planning]]
