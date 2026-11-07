---
type: workflow
skill: lighthouse-performance-audit
title: "Lighthouse Performance Audit"
description: "Use when measuring page performance, accessibility, best practices and SEO scores with Lighthouse on a set of key URLs."
modules: [onpage]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# Lighthouse Performance Audit

> Use when measuring page performance, accessibility, best practices and SEO scores with Lighthouse on a set of key URLs.

## Trigger
Speed and Core Web Vitals checks on important templates, or before and after a release. Inputs: URLs (one per template), device and throttling settings.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- URLs, one per template.
- Device (mobile, desktop or both).
- Runs per URL.

## Endpoints used (in order)
- `GET /v3/on_page/lighthouse/versions` (free, available Lighthouse versions)
- `GET /v3/on_page/lighthouse/audits` (free, audit catalog)
- `POST /v3/on_page/lighthouse/live/json` (one URL now) or `POST /v3/on_page/lighthouse/task_post` (queued)

## Steps
1. Pick one representative URL per template (home, category, product, article).
2. Run Lighthouse per URL; set the browser-simulation options deliberately and keep them the same across runs.
3. Read category scores and failing audits; map audits to fixes using the audit catalog.
4. Re-run after fixes and compare like with like.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

U = URLs, R = runs.
- U x R x task(`lighthouse/live/json` or `lighthouse/task_post`). Versions and audits lists are free.

Cheapest mode: Live and Standard queue cost the same ($0.005 per task); queue many URLs, use Live for a few.

Typical run (5 templates on mobile and desktop): 10 x $0.005 = $0.05 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
Scores per URL and category, the top failing audits with fixes, and before and after comparison.

## Visuals
Unverified until a sandbox payload confirms the score fields.
- `table`: category scores per URL (performance, accessibility, best practices, SEO). Fields: UNVERIFIED: the catalog lists only `tasks[].id`, `tasks[].status_code`, `tasks[].cost` for `lighthouse/task_get/json`; confirm the score paths from a sandbox payload before use. One row per URL, scores 0 to 100.
- `grouped-bar`: scores before vs after a fix. Fields: UNVERIFIED, same fields as the table. Max 4 categories, unit score.

## Tell the user
- Score per URL and the worst metrics.
- The top fixes by impact.
- That Lighthouse scores vary between runs.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Scores vary between runs; compare averages or repeated runs for decisions.
- Keep throttling and device settings identical across runs.
- Lighthouse is per URL; for a sitewide view use [[technical-site-audit]].

Related: [[onpage]] · [[technical-site-audit]]
