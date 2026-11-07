---
type: workflow
skill: new-lost-links-monitor
title: "New and Lost Links Monitor"
description: "Use when monitoring a site, or a list of sites, for newly gained and lost backlinks and referring domains over time."
modules: [backlinks]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# New and Lost Links Monitor

> Use when monitoring a site, or a list of sites, for newly gained and lost backlinks and referring domains over time.

## Trigger
Ongoing link monitoring, negative-SEO watch, or campaign reporting. Inputs: one target or a list of targets, a date window.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Target or list of targets.
- Date window and cadence.
- Alert threshold (for example 20 lost referring domains in a week).

## Endpoints used (in order)
- `POST /v3/backlinks/timeseries_new_lost_summary/live` (new and lost counts over time for one target)
- `POST /v3/backlinks/bulk_new_lost_referring_domains/live` (new and lost referring domains for many targets)
- `POST /v3/backlinks/backlinks/live` with `backlinks_status_type: lost` or a `first_seen` filter (the actual links behind a change)

## Steps
1. For each target, pull `timeseries_new_lost_summary` for the window (`date_from`, `date_to`) to spot spikes.
2. For a portfolio, run `bulk_new_lost_referring_domains` (up to 1000 targets, window up to 365 days).
3. When a spike appears, list the actual links with `backlinks` filtered to lost status or recent `first_seen`.
4. Report gains, losses and notable domains; flag sudden spikes for review.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

T = targets, R = runs per month.
- Single target: R x (task + item x rows) for `timeseries_new_lost_summary`.
- Portfolio: R x ceil(T/1000) x (task + item x T) for `bulk_new_lost_referring_domains`.
- Drill-down: task(`backlinks`) + item x rows only when a spike needs explaining.

Cheapest mode: Backlinks is Live only; the time series summary first, drill down only on spikes.

Typical run (1 target, weekly, 30 daily rows per run, one month): 4 x $0.024 + 120 x $0.000036 = $0.10032 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A monthly or weekly table of new and lost backlinks and referring domains per target, with the links behind any spike.

## Visuals
- `diverging-bar`: new (up) and lost (down) referring domains per period. Fields: `items[].date`, `items[].new_referring_domains`, `items[].lost_referring_domains`. lower_is_better on the lost series; date order, at least 3 periods.
- `table`: links behind a spike. Fields: `items[].domain_from`, `items[].url_from`, `items[].url_to`, `items[].anchor`. Sort by rank desc, top 25.
- `table`: portfolio new vs lost per target. Fields: `items[].target`, `items[].new_referring_domains`, `items[].lost_referring_domains`. lower_is_better on lost; sort by net change.

## Tell the user
- Net new against lost links and referring domains.
- Spikes with dates.
- Lost referring domains worth reclaiming.
- Next: [[backlink-audit]] if a spike looks like an attack.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- New and lost fields only exist from May 2021 onward.
- Windows longer than 365 days are not accepted for the bulk endpoint.
- Lost links can return; confirm before outreach.

Related: [[backlinks]] · [[backlink-audit]]
