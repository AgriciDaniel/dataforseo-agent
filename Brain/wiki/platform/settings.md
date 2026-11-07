---
type: platform
title: "Settings"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-07
tags: [dataforseo, platform, settings]
---
# Settings

The app reads `~/.config/dataforseo-agent/settings.json`. The user's words always win; a setting fills in only what the user did not say.

| Field | Default | How to use it |
|---|---|---|
| `budget_per_session_usd` | 1.00 | Hard stop. Track the billed `tasks[].cost` of every call this session. Never start a call whose estimate would take the session total past it, even with a yes; say how much is left and ask the user to raise the setting or start a new session. |
| `ask_above_usd` | 0 | For clients without a request prompt: ask in chat before any paid call whose estimate is above this (0 means always). In the app the request prompt is the approval, so never ask in chat as well; always state the estimate. Free calls never ask. |
| `default_location_code` | 2840 (United States) | Use when the user names no location. |
| `default_language_code` | "en" | Use when the user names no language. |
| `prefer_mode` | "cheapest" | "cheapest": the lowest price mode that answers the job (usually Standard queue). "standard": queue unless the endpoint is Live only. "live": Live where it exists. A user request for "now" or "later" wins. |
| `currency_display` | "USD" | Show amounts in this currency. DataForSEO bills in USD, so show USD next to any converted figure. |

If the file is missing or a field is invalid, use the default and say so once.
