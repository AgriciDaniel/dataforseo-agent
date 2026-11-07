---
type: cost
title: "Cost control"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, cost]
confidence: practitioner
---

# Cost control

Check these before proposing any paid call:
1. Can it run in the sandbox (testing, parsing, wiring)? Then use the sandbox.
2. Is the data already pulled? Standard results re-collect free for 30 days; cached results first.
3. Does a pre-indexed Labs endpoint answer it? ([[labs-vs-live]])
4. Can it be one bulk call (up to 1000 keywords, targets or domains) instead of many?
5. Does it need Live, or will the Standard queue do? ([[live-vs-standard]])
6. Are `depth`, `limit`, clickstream and rendering options set to the minimum the job needs?
7. Is the estimate within the user's approved budget, and does `user_data` show enough balance?

Never retry spend errors (40200, 40203, 40210). Report actual `cost` after each run.
