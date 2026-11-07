---
type: experiment
title: "Sandbox coverage probe"
domain: dataforseo
status: open
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, experiment]
---

# Sandbox coverage probe

## Hypothesis
Most Live and task_post endpoints used by the workflows have prepared sandbox data; a minority return 40404.

## Method (free, needs the user's credentials and approval to run)
1. Take the distinct endpoints listed in `wiki/workflows/` (all are in the catalog).
2. Call each once against `https://sandbox.dataforseo.com` with a minimal valid body, by direct HTTP (the MCP server cannot reach the sandbox).
3. Record status code per endpoint: 20000/20100 = covered, 40404 = no prepared data, other = request error to fix.

## Output
A table endpoint, status, date, stored as a fixture under `.raw/` and summarised in [[sandbox-coverage-unknown]].

## Status
Planned, not run. No paid calls involved.
