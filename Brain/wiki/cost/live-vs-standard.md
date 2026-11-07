---
type: cost
title: "Live vs Standard vs Priority"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, cost]
confidence: practitioner
---

# Live vs Standard vs Priority

- Default to the **Standard queue** for anything not needed within minutes. It is the cheapest mode (for Google Organic, Live is about 3.3x and Priority about 2x the Standard price).
- **Priority queue** when a batch must land within about a minute but nobody is waiting on a screen.
- **Live** only when a person is waiting for the answer, or the endpoint is Live-only.
- Queued work at scale: batch up to 100 tasks per POST and collect by webhook.
- Do not open many parallel Live calls to beat the 30-simultaneous cap; queue instead.
- Many modules have only one mode (see [[execution-modes]]); then there is no choice to make.

Detail: [[dec-live-vs-standard-vs-priority]].
