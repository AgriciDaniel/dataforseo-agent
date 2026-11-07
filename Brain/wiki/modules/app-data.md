---
type: module
module: app-data
title: "App Data API"
agent_description: "Use for Apple App Store and Google Play data: keyword searches, top charts by category, app details, reviews, and Live queries over the indexed app catalog."
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, module]
confidence: evidence-based
---

# App Data API

## Purpose
App store optimization data for both stores, with parallel endpoints per store.

## Use when
- App keyword rank tracking, competitor app monitoring, review mining, category discovery.

## Do not use when
- You need the keywords an app ranks for at scale: [[labs]] (`keywords_for_app`) is cheaper.

## Defaults
- Queue for searches, lists, info and reviews; `app_listings` is Live.
- Keep `depth` to what will be analyzed.

## Gotchas
- `depth` and billing differ by store: Google Play in blocks of 30 results, App Store in blocks of 100. Review blocks: 150 on Google Play, 25 on the App Store (research/brain-facts.md).
- App ids differ: numeric on the App Store, package name on Google Play.
- `installs` is a display string; use `installs_count` for math. Google Play review `title` is always null.
- `app_listings` searches the indexed catalog with no relevance ranking; it is for discovery, not keyword position.

Reference: [[cap-app-data-api]], [[plat-app-stores]].
