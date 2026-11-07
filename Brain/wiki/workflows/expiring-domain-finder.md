---
type: workflow
skill: expiring-domain-finder
title: "Expiring Domain Finder"
description: "Use when finding registered domains that expire soon or have expired, filtered by backlinks and organic traffic, from DataForSEO Whois data."
modules: [domain-analytics]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Expiring Domain Finder

> Use when finding registered domains that expire soon or have expired, filtered by backlinks and organic traffic, from DataForSEO Whois data.

## Trigger
Domain investing, expired-domain research, or brand protection. Inputs: expiry window, TLDs, minimum link or traffic thresholds.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Expiry window and TLDs.
- Minimum backlinks or traffic.
- How many results to return.

## Endpoints used (in order)
- `POST /v3/domain_analytics/whois/overview/live` (filterable Whois records with backlink and SERP metrics)

## Steps
1. Build filters (max 8): `expiration_datetime` within the window, TLD, and minimums on `backlinks_info.referring_domains` or organic `etv`.
2. Sort by referring domains or traffic (max 3 sort rules) and set `limit`.
3. Review results: registrar, created and expiry dates, `registered` flag, metrics.
4. Shortlist and recheck the top candidates manually before acting.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

Q = queries run, I = items returned.
- Q x task(`whois/overview`) + item(`whois/overview`) x I. Whois is among the pricier per-call endpoints; keep `limit` small and filters tight.

Cheapest mode: Live only and among the priciest per item ($0.12 + $0.0012). Filter hard and keep `limit` small.

Typical run (1 query returning 100 domains): $0.12 + 100 x $0.0012 = $0.24 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A shortlist of domains with expiry date, registrar, backlink and traffic metrics.

## Visuals
- `table`: candidate domains with expiry, registrar and link metrics. Fields: `items[].domain`, `items[].expiration_datetime`, `items[].registrar`, `items[].metrics`. Sort by referring domains desc, top 25.
- `hbar`: domains expiring per week. Fields: `items[].expiration_datetime`. Weeks in date order, unit domains.

## Tell the user
- The list with expiry date and metrics, and the top picks with reasons.
- To check link history and spam before buying.
- That whois data can be redacted.
- Next: [[bulk-domain-metrics]] on the picks.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- `registered: false` means the domain has expired.
- Metrics come from DataForSEO's indexes, not the live web.
- Check trademarks and spam history before buying any domain.

Related: [[domain-analytics]]
