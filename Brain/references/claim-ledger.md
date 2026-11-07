# Claim ledger

High-stakes DataForSEO claims the agent relies on, each with its dated official source. Checked 2026-11-06
(sources read by the endpoint-truth workstream; ids match `research/sources.json` in the app repo).

Second-source policy: a claim is confirmed by a second official source (another docs page, the OpenAPI
spec, or a pricing page) where one exists. Claims with only one official source are marked SINGLE-SOURCE;
the agent may use them but must cite the page and re-check it at the next refresh.

| ID | Claim | Source (retrieved) | Second source | Confidence | Verdict |
|---|---|---|---|---|---|
| C01 | Account rate limit is 10000 API calls per minute; 40202 when exceeded. | [docs-errors](https://docs.dataforseo.com/v3/appendix/errors/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C02 | Maximum 30 simultaneous requests per user; 40209 when exceeded. | [docs-errors](https://docs.dataforseo.com/v3/appendix/errors/) 2026-11-06 | [pricing-labs](https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api) | evidence-based | current |
| C03 | tasks_ready allows up to 20 calls per minute and returns up to 1000 tasks per call. | [docs-tasks-ready](https://docs.dataforseo.com/v3/serp/google/organic/tasks_ready/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C04 | Google Ads Live endpoints allow no more than 12 requests per minute per account. | [docs-google-ads-live](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C05 | appendix/status allows no more than 10 requests per minute. | [docs-status](https://docs.dataforseo.com/v3/appendix/status/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C06 | user_data is free and returns the account own prices, rates and limits; no per-minute limit is documented. | [docs-user-data](https://docs.dataforseo.com/v3/appendix/user_data/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current (older notes said 6 per minute; dropped) |
| C07 | Prices rose about 20 percent across eight APIs on 2026-07-01; Backlinks and LLM Mentions monthly commitments were removed. | [pricing-update](https://dataforseo.com/update/pricing-update-in-dataforseo-apis) 2026-11-06 | [pricing-backlinks](https://dataforseo.com/pricing/backlinks/backlinks) | evidence-based | current |
| C08 | SERP Google Organic tiers are Standard queue, Priority queue and Live mode, unchanged by the 2026-07-01 update. | [pricing-serp](https://dataforseo.com/pricing/google-serp/google-organic-serp-api) 2026-11-06 | [openapi](https://github.com/dataforseo/OpenApiDocumentation/blob/main/openapi_specification.yaml) | evidence-based | current |
| C09 | Minimum top-up is 50 USD, balance never expires, new accounts get a 1 USD trial credit. | [pricing-hub](https://dataforseo.com/pricing) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C10 | Sandbox is free for registered users and returns dummy data with the production structure. | [docs-sandbox](https://docs.dataforseo.com/v3/appendix/sandbox/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C11 | Authentication is HTTP Basic; the API password differs from the account password. | [docs-auth](https://docs.dataforseo.com/v3/auth/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C12 | The catalog has 583 endpoint entries across 11 data APIs plus Appendix; 576 are active (7 deprecated, removed or unavailable). | [openapi](https://github.com/dataforseo/OpenApiDocumentation/blob/main/openapi_specification.yaml) 2026-11-06 | [docs-index](https://docs.dataforseo.com/v3/llms.txt) | evidence-based | current |
| C13 | Content Generation API is discontinued. | [cg-gone](https://docs.dataforseo.com/v3/content_generation/overview/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C14 | Google Events SERP is deprecated. | [docs-events](https://docs.dataforseo.com/v3/serp/google/events/overview/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C15 | Amazon reviews (Merchant) is temporarily unavailable. | [docs-amazon-reviews](https://docs.dataforseo.com/v3/merchant/amazon/reviews/task_post/) 2026-11-06 | [openapi](https://github.com/dataforseo/OpenApiDocumentation/blob/main/openapi_specification.yaml) | evidence-based | current (absent from OpenAPI) |
| C16 | Google Shopping Merchant endpoints have no Live path; Product Spec was removed. | [openapi](https://github.com/dataforseo/OpenApiDocumentation/blob/main/openapi_specification.yaml) 2026-11-06 | [docs-index](https://docs.dataforseo.com/v3/llms.txt) | evidence-based | current |
| C17 | LLM Mentions endpoints search, aggregated_metrics, cross_aggregated_metrics, top_domains and top_pages are legacy, replaced by search_mentions, target_metrics, multi_target_metrics, top_mentioned_domains and top_mentioned_pages. | [docs-llmm-legacy](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/search/live/) 2026-11-06 | [openapi](https://github.com/dataforseo/OpenApiDocumentation/blob/main/openapi_specification.yaml) | evidence-based | current |
| C18 | LLM Mentions chat_gpt platform data is United States only. | [docs-llmm-search](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/search_mentions/live/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C19 | LLM Responses model lists on docs pages are examples; the free /models endpoint is authoritative. | [docs-models](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/models/) 2026-11-06 | SINGLE-SOURCE | evidence-based | current |
| C20 | The official MCP server is v3 (npm dataforseo-mcp-server 3.1.3, Node 22+) with four generic tools; the 10-module v2 server is deprecated. | [mcp-v3](https://github.com/dataforseo/mcp-server-typescript) 2026-11-06 | [npm](https://registry.npmjs.org/dataforseo-mcp-server) | evidence-based | current |
| C21 | The v3 MCP server only allows api.dataforseo.com, so it cannot reach the sandbox, and it has no cost guard. | [mcp-v3](https://github.com/dataforseo/mcp-server-typescript) 2026-11-06 | SINGLE-SOURCE | evidence-based | current (read from source code) |
| C22 | Backlinks prices are per task plus per row; Labs prices are per task plus per item. | [pricing-backlinks](https://dataforseo.com/pricing/backlinks/backlinks) 2026-11-06 | [pricing-labs](https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api) | evidence-based | current |
| C23 | LLM Mentions price is per task plus per row and was unchanged on 2026-07-01. | [pricing-llmm](https://dataforseo.com/pricing/ai-optimization/llm-mentions) 2026-11-06 | [pricing-update](https://dataforseo.com/update/pricing-update-in-dataforseo-apis) | evidence-based | current |

13 of 23 claims are SINGLE-SOURCE. Refresh due 2026-12-06 with the source ledger.
Confidence levels: `references/CONFIDENCE_TAGS.md`.
