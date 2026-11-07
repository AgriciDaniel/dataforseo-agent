---
type: gap
title: "Sandbox coverage per endpoint is unknown"
domain: dataforseo
status: open
confidence: evidence-based
created: 2026-11-06
updated: 2026-11-07
tags: [dataforseo, gap]
---

# Sandbox coverage per endpoint is unknown

The sandbox returns prepared dummy data, and 40404 means no prepared data exists for a request ([[sandbox-and-account]]). Nobody has mapped which of the 576 active catalog endpoints have sandbox data, including the renamed LLM Mentions endpoints.

- Impact: the agent cannot promise a free test for every workflow step.
- Next step: [[sandbox-coverage-probe]].
- Related question: [[which-workflow-steps-can-be-tested-free]].
