---
type: module
module: domain-analytics
title: "Domain Analytics API"
agent_description: "Use for a domain's technology stack, finding domains that use a technology, and Whois registration data enriched with backlink and search metrics."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Domain Analytics API

## Purpose
Two sub-APIs: Technologies (stack detection and reverse lookup over DataForSEO's crawl) and Whois (filterable registration records with SEO metrics).

## Use when
- Fingerprinting a competitor's CMS, CDN, analytics and frameworks.
- Building lead lists of domains running a technology or HTML term.
- Filtering domains by registration age, registrar, expiry or traffic.

## Do not use when
- You need a live crawl of one site's pages: [[onpage]].

## Defaults
- Live only. Use filters (max 8) and sort rules (max 3) to keep result sets small; Whois is one of the pricier per-call endpoints.

## Gotchas
- Detection reflects the last crawl (`last_visited`); new or small sites may be missing or stale, and server-side stacks can be invisible.
- `registered: false` means the domain expired.
- `technology_stats` returns one item per month of `date_from` to `date_to`, billed $0.0012 each on top of $0.012 (live test 2026-11-06: 8 months, $0.0216). Keep the range short.
- `domains_by_technology` requires limit plus offset under 10000; use `offset_token` beyond 100000 results.

Reference: [[cap-domain-analytics]].
