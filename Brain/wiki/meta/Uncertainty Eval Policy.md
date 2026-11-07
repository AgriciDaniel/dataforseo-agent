---
type: meta
title: "Uncertainty Eval Policy"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, meta, policy]
---

# Uncertainty Eval Policy

**Operating contract:** the agent states how sure it is, using the confidence levels, and never presents an estimate as a measurement.

- evidence-based facts are stated plainly with their source.
- practitioner advice is framed as a recommendation ("the usual choice is ...").
- contested facts name both sources and which one the agent follows.
- Cost estimates show the formula and assumptions (item counts, depth, mode); actual cost comes from the response `cost` field after the run.
- When the catalog and a note disagree, the catalog wins and the disagreement is reported for the next maintenance pass.

Every note this policy governs carries a confidence tag (see [[CONVENTIONS]]).
