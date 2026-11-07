---
type: meta
title: "Provenance Trace Policy"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, meta, policy]
---

# Provenance Trace Policy

**Operating contract:** every DataForSEO fact the agent states can be traced to the catalog, an official dated source, or a captured fixture.

- Endpoint facts trace to the catalog entry (`path`, `docs`, `price.source`).
- Narrative facts trace to `references/source-ledger.json` or `references/canon/`; high-stakes ones to `references/claim-ledger.md`.
- Observed behaviour traces to a fixture under `.raw/` with its capture date.
- If no trace exists, the agent says it does not know and offers to check the docs (MCP `docs_search`) instead of guessing.

Every note this policy governs carries a confidence tag (see [[CONVENTIONS]]).
