---
type: platform
title: "MCP server"
domain: dataforseo
status: stable
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, platform, mcp]
confidence: evidence-based
---

# MCP server

Facts as of 2026-11-06 (research/mcp.md):
- Current official server is **v3**: npm `dataforseo-mcp-server` 3.1.3, Node 22 or newer. The 10-module v2 server with `ENABLED_MODULES` is deprecated, and some of its tools call legacy paths.
- v3 has four generic tools: `docs_index`, `docs_list_sections`, `docs_search`, and `api_request` (any `api.dataforseo.com` path). Every catalog endpoint is reached through `api_request`.
- `api_request` defaults to the LLM-optimized `.ai` response; pass `noAiMode: true` for standard JSON.
- It has **no cost guard and no sandbox**: every paid call goes straight through, and other hosts are rejected. Price the call from the catalog and get approval before calling `api_request` on a paid endpoint.
- Credentials: `DATAFORSEO_LOGIN` (alias `DATAFORSEO_USERNAME`) and `DATAFORSEO_PASSWORD` from the user's env. Hosted alternative with OAuth: `https://mcp.dataforseo.com/v3/mcp`.
- Live calls can run up to 120 s; MCP client timeouts must allow that.

Detail: [[mcp-vs-raw-rest]]; the v2-era note [[cap-mcp-server-integration]] is historical.
