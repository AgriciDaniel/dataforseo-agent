---
type: flow
title: "Claim Verification Flow"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, flow, procedure]
---

# Claim Verification Flow

Agent operating procedure (read on demand).

## Trigger
Verify a DataForSEO fact before the agent relies on it or before it is written into the brain.

## Prerequisites
- Access to the endpoint catalog and the claim ledger (`references/claim-ledger.md`).
- Network access to docs.dataforseo.com (MCP `docs_search` or a fetch).

## Steps
1. Classify the claim: endpoint fact (path, parameter, limit, price) or narrative fact (policy, availability, behaviour).
2. Endpoint fact: look it up in the catalog entry; the catalog wins. Note its `docs` URL and `price.source`.
3. Narrative fact: find the official page (docs, pricing, updates feed, official repo). Paraphrase it and record the URL and date.
4. Look for a second official source (OpenAPI spec, another docs page, pricing page). If none, mark SINGLE-SOURCE.
5. Assign confidence (see [[CONVENTIONS]]) and record the claim in the claim ledger if it affects routing or spend.
6. Update the claim's one home note and [[hot]] if it changes current behaviour; add a [[log]] entry.

## Outputs
A verified claim with source URL, retrieval date, second source or SINGLE-SOURCE mark, and confidence level.

## Gates
- No paid API call is used to verify a claim unless the user approves it; docs and the sandbox come first.
- A claim that cannot be traced is not written into the brain.

## Failure modes
- Docs page changed or disappeared: record the 404 or the new text, mark the claim contested, re-check the catalog.
- Catalog and docs disagree: follow the catalog for routing, flag the conflict in the claim ledger.

## Rollback
Revert the note from `_review/archive/` or the previous version and mark the claim contested in the ledger.
