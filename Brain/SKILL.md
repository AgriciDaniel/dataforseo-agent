---
name: dataforseo-brain
description: >
  Source-cited operating memory for the DataForSEO v3 API and nothing else: which of the 11 data APIs
  and 576 active endpoints (583 catalog entries) to use for a job, how execution modes and billing work, how to keep spend under
  control, and step-by-step workflows. Use when answering or planning any DataForSEO task.
allowed-tools:
  - Read
  - Grep
  - Glob
license: MIT
---

# DataForSEO Brain

The knowledge layer of the DataForSEO Agent. It is read-only: agents read it, they never write to it
during a session.

## Buyer

SEO engineers, agencies and AI-search (GEO) builders who use the DataForSEO v3 API and want an agent
that picks the right endpoint, prices it before spending, and runs proven workflows.

## Outputs

- Routing: job to module to endpoint (`wiki/routing/`).
- One knowledge note per API module for its sub-agent (`wiki/modules/`).
- Workflow skills with endpoints in order and cost formulas (`wiki/workflows/`).
- Cost and platform rules loaded on every turn (`wiki/cost/`, `wiki/platform/`, `wiki/hot.md`).
- A claim ledger and canon of official facts (`references/claim-ledger.md`, `references/canon/`).

## Boundaries

- DataForSEO only. Other SEO tools appear only as comparison context in `wiki/decisions/`.
- Endpoint paths, parameters and prices come from the endpoint catalog (`research/endpoints.json` in the
  app repo). When a note and the catalog disagree, the catalog wins.
- Advisory and read-only. No credentials, tokens or `.env` values in any note, fixture or log; credentials
  come from the user's environment.
- No paid API call without a catalog-based estimate and the user's approval. Testing uses the free sandbox.
- No source, no claim: every DataForSEO fact carries a dated official source or a catalog reference.

Details: `docs/PRODUCT_BOUNDARIES.md`.

## Quick start

1. Read `wiki/hot.md` (current facts and overrides).
2. Read `wiki/routing/which-api-for-which-job.md` and pick the module.
3. Read that module's note in `wiki/modules/`, and the matching workflow in `wiki/workflows/` if the job has several steps.
4. Price the call from the catalog, check `wiki/cost/budget-gates.md`, then ask before spending.

Maintenance: `docs/OPERATOR_KIT.md`.

## Maturity

Brainstein maturity and score are recorded in `_review/` by date. Do not call this brain market-ready
unless `brainstein audit` reports market-ready.

## Research refresh

Monthly for endpoints, parameters and prices; before any release for cost and authentication claims.
