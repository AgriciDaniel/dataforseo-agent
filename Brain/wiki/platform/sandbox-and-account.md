---
type: platform
title: "Sandbox and account"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, platform]
confidence: evidence-based
---

# Sandbox and account

- **Sandbox first.** Every build or test uses direct HTTP to `sandbox.dataforseo.com`: free, production-identical structure, dummy data, same limits, supports Live, Standard and webhooks. 40404 means no prepared data for that exact request; adjust the request rather than switching to production. The official MCP server cannot reach the sandbox (it only allows `api.dataforseo.com`).
- New accounts get a $1 trial credit; top-ups have a $50 minimum and the balance never expires (pricing hub, read 2026-11-06).
- **Account state:** `GET /v3/appendix/user_data` is free; poll it sparingly. Read `money.balance`, `money.limits` (daily caps), `money.statistics`, `rates` and the `price` object. Call it before a paid batch and after it, not per request.
- The `backlinks_subscription_expiry_date` and `llm_mentions_subscription_expiry_date` fields are legacy; do not gate on them.
- A daily cost limit set in the account turns runaway spend into a 40203 stop. Recommend the user sets one.

Detail: [[cap-sandbox-testing]], [[cap-account-usage-userdata]].
