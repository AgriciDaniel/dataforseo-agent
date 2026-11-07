---
type: meta
title: "Memory Governance Policy"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, meta, policy]
---

# Memory Governance Policy

**Operating contract:** agents read the brain during sessions and never write to it; changes happen in maintenance passes with a log entry.

- Session agents (router, cost guard, module agents) have read access only.
- Maintenance passes update notes, add a dated entry to [[log]], and refresh [[hot]] when a current fact changes.
- A fact has one home. When a fact changes, update its home and the catalog, not copies.
- Superseded notes are archived under `_review/archive/` with the reason in [[log]], not silently deleted.

Every note this policy governs carries a confidence tag (see [[CONVENTIONS]]).
