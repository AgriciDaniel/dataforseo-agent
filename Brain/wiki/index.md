---
type: index
title: "DataForSEO Brain - Index"
domain: dataforseo
status: stable
created: 2026-06-26
updated: 2026-11-06
tags: [dataforseo, hub, index]
confidence: practitioner
---

# DataForSEO Brain

Operating memory for the DataForSEO Agent. Read [[hot]] first, then [[which-api-for-which-job]].
Endpoint truth (paths, parameters, prices) is the catalog in `research/endpoints.json`; these notes hold judgement, routing and workflow knowledge.

## Loaded every turn (main agent and cost guard)
- [[hot]]
- [[cost-control]] - Cost control
- [[cost-model]] - Cost model
- [[labs-vs-live]] - Labs vs live data
- [[live-vs-standard]] - Live vs Standard vs Priority
- [[budget-gates]] - Budget gates (estimate, show arithmetic, ask, run, report)
- [[api-basics]] - API basics
- [[execution-modes]] - Execution modes
- [[limits-and-errors]] - Limits and errors
- [[mcp]] - MCP server
- [[sandbox-and-account]] - Sandbox and account
- [[visuals]] - Visuals (chart tool spec and rules)
- [[settings]] - Settings (session budget, ask threshold, defaults)

## Routing
- [[by-surface]] - Routing by surface
- [[which-api-for-which-job]] - Which API for which job

## Modules (one sub-agent each)
- [[ai-optimization]] - AI Optimization API
- [[app-data]] - App Data API
- [[backlinks]] - Backlinks API
- [[business-data]] - Business Data API
- [[content-analysis]] - Content Analysis API
- [[databases]] - Databases
- [[domain-analytics]] - Domain Analytics API
- [[keywords-data]] - Keywords Data API
- [[labs]] - DataForSEO Labs API
- [[merchant]] - Merchant API
- [[onpage]] - OnPage API
- [[serp]] - SERP API

## Workflows (one skill each)
- [[ads-transparency-research]] - Ads Transparency Research (serp)
- [[ai-overview-and-ai-mode-tracking]] - AI Overview and AI Mode Tracking (serp, ai-optimization)
- [[ai-visibility-tracking]] - AI Visibility Tracking (ai-optimization, serp)
- [[amazon-competitor-research]] - Amazon Competitor Research (labs, merchant)
- [[app-store-aso]] - App Store Optimization (labs, app-data)
- [[backlink-audit]] - Backlink Audit (backlinks)
- [[brand-sentiment-monitoring]] - Brand Sentiment Monitoring (content-analysis)
- [[budget-planner]] - Budget Planner (appendix)
- [[bulk-domain-metrics]] - Bulk Domain Metrics (labs, backlinks)
- [[competitor-gap-analysis]] - Competitor Gap Analysis (labs, backlinks, domain-analytics)
- [[content-brief]] - Content Strategy Brief (serp, labs, content-analysis)
- [[cost-optimized-pipeline]] - Cost-Optimized Pipeline (serp, labs, backlinks, onpage)
- [[ecommerce-product-research]] - Ecommerce Product Research (merchant, labs, app-data)
- [[expiring-domain-finder]] - Expiring Domain Finder (domain-analytics)
- [[getting-started]] - Getting Started (appendix, serp)
- [[google-business-profile-audit]] - Google Business Profile Audit (business-data)
- [[keyword-clustering]] - Keyword Clustering (labs)
- [[keyword-research]] - Keyword Research Workflow (keywords-data, labs)
- [[lighthouse-performance-audit]] - Lighthouse Performance Audit (onpage)
- [[link-prospecting]] - Link Prospecting (backlinks)
- [[local-seo-tracking]] - Local SEO Tracking (serp, business-data)
- [[market-sizing-by-category]] - Market Sizing by Category (labs)
- [[monthly-seo-report]] - Monthly SEO Report (labs, backlinks, serp)
- [[new-lost-links-monitor]] - New and Lost Links Monitor (backlinks)
- [[ppc-keyword-planning]] - PPC Keyword Planning (keywords-data)
- [[rank-tracking]] - Rank Tracking Pipeline (serp)
- [[review-monitoring]] - Review Monitoring (business-data, content-analysis)
- [[serp-snapshot]] - SERP Snapshot (serp)
- [[site-migration-check]] - Site Migration Check (onpage, labs)
- [[tech-stack-lead-lists]] - Tech Stack Lead Lists (domain-analytics, labs)
- [[technical-site-audit]] - Technical Site Audit (onpage)
- [[trends-research]] - Trends Research (keywords-data, labs)
- [[youtube-research]] - YouTube Research (serp)

## Procedures and governance (read on demand)
- Flows: [[Claim Verification Flow]], [[Explore Plan Code Commit]], [[Multi-Agent Fan-Out Research Flow]], [[Context Compaction Routine]]
- Meta: [[CONVENTIONS]], [[Corpus Scope Policy]], [[Memory Governance Policy]], [[Provenance Trace Policy]], [[Answer Engine Citability Policy]], [[Uncertainty Eval Policy]]
- Open unknowns: [[sandbox-coverage-unknown]], [[platform-updates-after-2026-07-08]], [[live-model-lists-not-fetched]], [[which-workflow-steps-can-be-tested-free]], [[sandbox-coverage-probe]]

## Decisions
- [[dataforseo-vs-ahrefs-semrush-moz]] - DataForSEO vs Ahrefs / Semrush / Moz
- [[mcp-vs-raw-rest]] - MCP server vs raw REST
- [[when-not-to-use-dataforseo]] - When NOT to use DataForSEO

## Reference (read on demand; prices refreshed 2026-11-06 except where flagged)
- Modules: [[cap-ai-optimization-api]], [[cap-app-data-api]], [[cap-backlinks-api]], [[cap-backlinks-bulk-metrics]], [[cap-business-data-api]], [[cap-content-analysis-api]], [[cap-databases]], [[cap-domain-analytics]], [[cap-geo-ai-search-optimization]], [[cap-keywords-data-api]], [[cap-labs-competitor-research]], [[cap-labs-keyword-research]], [[cap-labs-market-analysis]], [[cap-llm-mentions-visibility]], [[cap-merchant-api]], [[cap-onpage-api]], [[cap-result-tiers-regular-advanced-html]], [[cap-serp-api]], [[cap-serp-google-verticals]], [[cap-serp-non-google-engines]], [[cap-trends-and-clickstream]]
- Platform: [[cap-account-usage-userdata]], [[cap-authentication-security]], [[cap-data-collection-methodology]], [[cap-locations-languages-targeting]], [[cap-mcp-server-integration]], [[cap-platform-architecture]], [[cap-rate-limits-throughput]], [[cap-sandbox-testing]], [[cap-status-error-codes]], [[cap-task-vs-live-execution]], [[cap-webhooks-pingback-postback]]
- Cost: [[cap-queue-priority-cost-model]], [[dec-cost-control-strategy]], [[dec-labs-vs-live-apis]], [[dec-live-vs-standard-vs-priority]]
- Surfaces: [[plat-ai-assistants]], [[plat-amazon-marketplace]], [[plat-app-stores]], [[plat-bing-search]], [[plat-google-maps-local]], [[plat-google-search]], [[plat-google-shopping]], [[plat-other-search-engines]], [[plat-review-platforms]], [[plat-youtube]]
- Entities: [[ent-clickstream-data]], [[ent-dataforseo]], [[ent-google-ads-keyword-planner]]
- Other: [[overview]], [[coverage]], [[research-pack-2026-06-26]]

## History
- [[log]]
