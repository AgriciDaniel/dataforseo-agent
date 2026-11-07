---
type: log
title: "DataForSEO Brain - Build & Change Log"
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, log, changelog]
confidence: practitioner
---

# DataForSEO Brain - Build & Change Log

> Append-only; newest on top. Hub: [[index|Master Index]].

## 2026-11-06 - Restructured into the agent layout
Approved by the lead (dataforseo-agent-42) to match the `tools/bridge.py` contract.

- New: `modules/` (12 sub-agent notes with `module` and `agent_description`; no prices or parameter lists), `workflows/` (10 skills with `skill`, `description`, `modules`, and cost formulas in catalog terms), `cost/` and `platform/` (tight notes loaded every turn), `routing/` (router plus by-surface table).
- Moved the detailed notes (cap-*, plat-*, ent-*, cost decisions, research pack, overview, coverage) to `reference/`; folder index notes and the Home hub were archived; [[index]] rebuilt.
- Folded in c9's 2026-11-06 facts: MCP v3, renamed LLM Mentions endpoints, 10000 calls/min account limit, Amazon reviews and Product Spec gone, Events deprecated, Content Generation discontinued (no module note).
- Every endpoint path in modules, workflows, routing, cost and platform was checked against research/endpoints.json. Fixed OnPage report endpoints (POST with id in body, not GET).

## 2026-11-06 - Agent-brain audit and cleanup (working copy for DataForSEO Agent)
Audited with Brainstein 2.0.0 and a full manual read of every wiki note. Details and the proposed target structure: `_review/REVIEW.md`.

- **Removed duplication:** 83 repeated bullets cut from padded Gotchas tails (notes had been padded to clear an 80-line gate); padded sections trimmed in 5 notes.
- **Merged:** `ent-ahrefs`, `ent-semrush`, `ent-moz` into [[dataforseo-vs-ahrefs-semrush-moz]]; `ent-llm-model-providers` into [[plat-ai-assistants]]; `ent-dataforseo-mcp-server` into [[cap-mcp-server-integration]]. Originals kept under `_review/archive/`.
- **Fixed:** broken link and typo in [[which-api-for-which-job]]; router and [[ecommerce-product-research]] pointed at a Google Shopping `live` path that does not exist; reviews routed to the POI database; "Merchant is an add-on" (stale); "$0.002 per result" mislabels (per SERP request).
- **Flagged stale:** 51 notes with prices carry `price_status: pre-2026-07-01-repricing`. No new prices were invented; current figures come from the endpoint catalog.
- **Removed scaffolding:** SEOus dashboard coupling, release and community files, sample vault, site/dist (not copied).

## 2026-07-08 - Backlinks + LLM Mentions pay-as-you-go correction
Corrected the cross-cutting brain state after DataForSEO's 2026-07-01 pricing update moved all endpoints to pay-as-you-go and cancelled the Backlinks and LLM Mentions monthly commitments.

- **Access correction:** Backlinks and LLM Mentions were gated through 2026-06-26, but the gate was removed 2026-07-01. Live re-probe on 2026-07-08 returned `20000 Ok` for `/v3/backlinks/summary/live`, `/v3/backlinks/bulk_ranks/live`, and `/v3/ai_optimization/llm_mentions/search/live`.
- **40204:** kept in [[cap-status-error-codes]] as a defined code, reframed as legacy for these modules.
- **Evidence:** official pricing update plus fixtures under `.raw/sources/dataforseo-research/` and `_cost-log-2026-07-08-reprobe.json`.

## 2026-06-26 - Mega review + gap-fill (v1.0.1)
A full review pass: an ultracode 7-reviewer Workflow + 4 deep-dives (currency, Backlinks, AI Optimization) + a claude-obsidian wiki-lint.

- **Findings:** 37 (0 blockers, 4 HIGH). All applied. Verdict: brain was already solid; fixes were narrow.
- **HIGH fixes:** radius meters -> km in [[cap-business-data-api]]; MCP 2.9.9 / Node >=20 in [[cap-mcp-server-integration]]; Apple depth 100/700/per-100 in [[cap-app-data-api]]; added AI Summary + Screenshot to [[cap-serp-api]].
- **Enrichment:** Backlinks subscription + ~2T index + rank/spam in [[cap-backlinks-api]]; live `/models` truth + LLM Mentions $100/mo gate in [[cap-ai-optimization-api]] and [[cap-llm-mentions-visibility]]; API v2 closure (2026-05-05) in [[cap-task-vs-live-execution]].
- **New live data:** LLM Responses fixtures for all 4 model providers. Em dashes removed vault-wide.
- **Re-verified:** Brainstein SSS+ 100/100 held; wiki-lint 0 critical/0 warnings; 0 dead links.

## 2026-06-26 - Initial build to market-ready
Built the brain as an orchestrated run: a watcher thread plus parallel secretaries.

- **Scrape:** 6 parallel WebFetch secretaries captured 185 endpoint docs across all 12 modules
  into `.raw/sources/dataforseo-research/`, with per-module citation manifests (226 unique doc URLs).
- **Live test:** a $5-capped harness tested 39 endpoints against the production API for $0.85,
  capturing authentic response fixtures. Backlinks and LLM Mentions returned 40204 (add-on required).
  See [[cap-queue-priority-cost-model]] and `_cost-log.json`.
- **Research:** four fact-checked reports (competitive/market, AI-GEO practice, cost-and-lifecycle,
  MCP-and-integration) with ~86 trustworthy external sources, feeding
  [[dataforseo-vs-ahrefs-semrush-moz]], [[cap-geo-ai-search-optimization]], and [[dec-cost-control-strategy]].
- **Synthesis:** 68 content notes across [[index|concepts]], [[index|platforms]],
  [[index|entities]], [[index|flows]], and [[index|decisions]],
  every note >= 80 lines and >= 8 wikilinks, every claim traced to [[research-pack-2026-06-26|the research pack]].
- **Cost model captured:** cheapest is OnPage instant_pages (~$0.0001) and Labs (~$0.01); the main
  cost lever is [[dec-live-vs-standard-vs-priority|Live vs Standard]].

Entry point: [[index]] · [[overview]] · [[hot]] · [[coverage]].

## 2026-11-06 round 2 (37)
- Brainstein: audit 76 to 89 (demo-verified), anatomy 59 to 89. Claim ledger, canon, conventions, policies, flows, gaps, secretary agent, docs added. Details: `_review/REVIEW.md`.
- Workflows 10 to 30, all endpoints checked against the catalog.
- Sweep: machine-specific paths and community links removed from SKILL.md, references and specs.
- Visuals: `## Visuals` section added to all 30 workflows (types table, kpi, hbar, grouped-bar, share-bar, diverging-bar, line, sparkline, scatter, heatmap; no pies). New loaded note [[visuals]] (1.2 KB). Lighthouse visuals marked unverified until a sandbox payload confirms the score fields. Research: `research/visuals-research.md`.
- QA fixes: [[backlinks]] 1000-item limit and pagination; [[onpage]] report endpoints are POST with id, no issues endpoint.

## 2026-11-06 Backlinks per-row billing (QA D-6)
- `modules/backlinks.md`: new "Billing" section, cost = $0.024 per request + $0.000036 per returned row, `limit` caps the worst case, worked examples, billed-cost evidence from the 2026-07-08 probe.
- `cost/budget-gates.md`: two-part prices note that `limit` gives the maximum and rows are billed as returned.

## 2026-11-06 Labs search_volume definition (QA Round D rerun)
- `modules/labs.md`: new "Search volume fields" section quoting the docs definition (average monthly rate, no period stated), its relation to `monthly_searches`, and the rule never to call it a 12-month average; compute averages from `monthly_searches`.

## 2026-11-06 Final skills pass (37)
- All 30 workflows now have "Inputs to ask for", a "Cheapest mode" line and a priced "Typical run" in Cost estimate (catalog list prices, checked 2026-11-06), and "Tell the user". Backup: `_review/archive/workflows-before-final-pass/`.
- New workflows: `monthly-seo-report`, `getting-started`, `budget-planner` (33 total), each with Visuals.
- New `platform/settings.md`: how the agent uses settings.json (session budget is a hard stop; defaults only fill what the user did not say).
- Router, index and hot link the new notes.

## 2026-11-06 geogrid, tilemap and scatter labels (37)
- `local-seo-tracking`: grid view is now `geogrid` (rank_group of the matching cid or place_id per location_coordinate, rows by latitude, cols by longitude, null when not found).
- `trends-research`: `tilemap` for US subregion interest, `hbar` kept for other countries.
- Scatter views in keyword-research, keyword-clustering, link-prospecting, bulk-domain-metrics and ecommerce-product-research name their point labels.
- `platform/visuals.md`: geogrid and tilemap in Choose and Spec; scatter `series[].labels`.

## 2026-11-06 Rate limit 10000 and "Run it for $X?" (37)
- 15 notes still said 2000 calls per minute (the 7 c9 found plus cap-labs-market-analysis, cap-labs-competitor-research, cap-backlinks-api, cap-content-analysis-api, cap-domain-analytics, plat-google-search, ent-dataforseo, decisions/dataforseo-vs-ahrefs-semrush-moz). All now say 10000, raised 2026-10-19 (DataForSEO updates feed, `research/sources.json`). Throughput math: 10,000 tasks/min at 1 task per call, 1,000,000 at 100.
- `cost/budget-gates.md` step 3, `hot.md` and `workflows/budget-planner.md`: every paid estimate ends with the literal line "Run it for $X?", with an example.

## 2026-11-06 Live endpoint test fixes, sandbox pass (37)
- Catalog (`research/endpoints.json`, backup `_review/archive/endpoints.json.before-37-live-fixes`): YouTube organic `tasks_fixed` marked removed (40402) and Pinterest social media marked unavailable (50304, no price), both added to `excluded`; Amazon sellers example `en` to `en_US`; hotel_searches dates moved to 2026-12; backlinks `id_list` dates in the required UTC form within the last month. Touched entries carry a `note`.
- Brain: `platform/api-basics.md` adds the Amazon locale code rule and "dates relative to today" with the id_list window and format; `hot.md` lists Pinterest and YouTube tasks_fixed as gone; merchant module, review platforms, maps local and business data notes updated.

## 2026-11-06 Live paid test fixes (37)
- Catalog: LLM Responses notes now say billed = fee + model token cost (observed $0.0007 to $0.0258 Live, $0.0102 queued); `domain_metrics_by_categories` repriced to $0.12 + $0.0012 per domain; `technology_stats` items = months; Ads Search and Dataset Info 40102 is billed; screenshot and ai_summary need a fresh own task_id; historical_serps bills per SERP returned; Perplexity 50000 retry once. `status-codes.json` 40102 action notes it can be billed. Backups in `_review/archive/`.
- Brain: ai-optimization, labs, domain-analytics, serp modules; `cost/budget-gates.md` lists the prices the fee alone understates; `platform/limits-and-errors.md` adds 50000 and billed 40102. OnPage routing (summary/{id}, POST pages, no task_get) already correct.

## [2026-11-07] update | prompt price and endpoint counts
- Endpoint counts made explicit: 583 catalog entries, 576 active (7 deprecated, removed or unavailable) in hot, api-basics, sandbox-coverage gap, SKILL.md, claim ledger C12 and canon 010.
- budget-gates step 3 and settings: the app's request prompt shows the catalog list price; the agent's estimate still comes first.
