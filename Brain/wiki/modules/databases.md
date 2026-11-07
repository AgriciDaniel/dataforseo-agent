---
type: module
module: databases
title: "Databases"
agent_description: "Use for advice on bulk dataset purchases (SERP, keyword, app, Amazon, backlink summary, business listings, Whois dumps delivered to the user's storage); there are no API endpoints to call."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# Databases

## Purpose
Licensed dataset dumps (JSON, some CSV) delivered to the buyer's storage (S3, SFTP, Google Cloud). Not an API: the catalog has no Databases endpoints.

## Use when
- A team wants a whole corpus in its own warehouse (internal keyword tool, model training, large offline analysis) and millions of API calls would cost more.

## Do not use when
- Anything near real time or targeted: use the API modules.

## Gotchas
- Priced by quote on size and location; refreshes at 50% of the standard price.
- Freshness lags: SERP and app sets refresh on roughly 60 to 90 day cycles, keyword data monthly. Historical SERP from August 2021, historical keywords from 2019.
- The buyer owns ingestion, storage and querying.

Reference: [[cap-databases]].
