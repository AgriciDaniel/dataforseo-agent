# DataForSEO v3 endpoint index

Checked 2026-11-06. Machine-readable twin: `endpoints.json`. Sources: `sources.json`.

**583 endpoints** (method plus path) across **12 API namespaces** (11 data APIs plus Appendix). 565 come from the official OpenAPI spec; 18 are documented on docs.dataforseo.com but missing from the spec. 5 are deprecated (Google Events). Databases is a file product with no endpoints, and Content Generation is discontinued.

## Counts by module

| Module | Total | live | task_post | task_get | tasks_ready | standard | other |
|---|---:|---:|---:|---:|---:|---:|---:|
| SERP API (`serp`) | 185 | 37 | 27 | 48 | 28 | 25 | 20 |
| AI Optimization API (`ai-optimization`) | 54 | 24 | 5 | 7 | 5 | 13 | 0 |
| Keywords Data API (`keywords-data`) | 75 | 19 | 12 | 12 | 12 | 20 | 0 |
| DataForSEO Labs API (`labs`) | 48 | 40 | 0 | 0 | 0 | 8 | 0 |
| Backlinks API (`backlinks`) | 24 | 20 | 0 | 0 | 0 | 4 | 0 |
| OnPage API (`onpage`) | 31 | 5 | 2 | 1 | 2 | 6 | 15 |
| Domain Analytics API (`domain-analytics`) | 14 | 7 | 0 | 0 | 0 | 7 | 0 |
| Content Analysis API (`content-analysis`) | 11 | 6 | 0 | 0 | 0 | 5 | 0 |
| Merchant API (`merchant`) | 41 | 7 | 7 | 11 | 8 | 8 | 0 |
| App Data API (`app-data`) | 42 | 2 | 8 | 12 | 9 | 11 | 0 |
| Business Data API (`business-data`) | 54 | 8 | 11 | 12 | 12 | 11 | 0 |
| Appendix (`appendix`) | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| **Total** | **583** | **175** | **72** | **103** | **76** | **122** | **35** |

Mode legend: `standard` here means reference or account endpoints (locations, languages, filters, models, id_list, errors, status, user_data), not the DataForSEO "Standard method" queue, which is the `task_post` / `tasks_ready` / `task_get` trio. `other` is `tasks_fixed` (re-parsed SERP tasks) or OnPage `task_result` (reading crawl results); see `mode_detail`.

Account wide: up to 10000 API calls per minute (error 40202) and at most 30 simultaneous requests (error 40209), per docs.dataforseo.com/v3/appendix/errors.

## Diff against the existing DataForSEO Brain

The Brain (`~/Desktop/Vaults/DataForSEO Brain/wiki`, read only) says "12 modules, ~200+ endpoints", live-verified 2026-06-26.

| Brain claim | Current fact (2026-11-06) |
|---|---|
| ~200+ endpoints | 583 method plus path endpoints (175 live, 72 task_post). The Brain scrape covered 185 docs pages; the docs index now has 617 pages. |
| 12 modules including Databases | 11 data APIs plus Appendix have endpoints. Databases is listed in the docs index but is a bulk file product with no API endpoints. |
| Content Generation (lead brief listed it) | Discontinued: docs 404, no OpenAPI paths, product URL redirects to Content Analysis. The Brain does not cover it either. |
| Official MCP = 10 modules, ENABLED_MODULES, v2.9.9 | The v2 server is deprecated. The current server is v3 (npm `dataforseo-mcp-server` 3.1.3), with 4 generic tools and no module flags. See `mcp.md`. |
| Prices (2026-06-26 snapshot) | Many rose about 20 percent: Backlinks $0.02 to $0.024 per request, Labs $0.01 to $0.012 per task. SERP Google Organic is unchanged ($0.0006 / $0.0012 / $0.002). See `brain-facts.md`. |

Of the 230 distinct `/v3/...` strings cited in the Brain, these real endpoint paths are not current:

| Brain path | Status now |
|---|---|
| `/v3/ai_optimization/llm_mentions/aggregated_metrics/live` | legacy, replaced by `/v3/ai_optimization/llm_mentions/target_metrics/live` |
| `/v3/ai_optimization/llm_mentions/cross_aggregated_metrics/live` | legacy, replaced by `/v3/ai_optimization/llm_mentions/multi_target_metrics/live` |
| `/v3/ai_optimization/llm_mentions/search/live` | legacy, replaced by `/v3/ai_optimization/llm_mentions/search_mentions/live` |
| `/v3/ai_optimization/llm_mentions/top_domains/live` | legacy, replaced by `/v3/ai_optimization/llm_mentions/top_mentioned_domains/live` |
| `/v3/merchant/amazon/reviews/task_post` | unavailable |
| `/v3/merchant/google/products/live/advanced` | never existed: Google Shopping products has no live mode (task_post only) |
| `/v3/merchant/google/product_spec/task_get/advanced` | removed (docs 404, not in OpenAPI) |
| `/v3/merchant/google/product_spec/task_post` | removed (docs 404, not in OpenAPI) |

Not counted above: docs overview pages, wildcard shorthand such as `/v3/backlinks/bulk_{metric}/live`, and `appendix/sandbox`, which is a docs page, not an endpoint.

## Excluded (legacy, unavailable, removed)

- `POST /v3/merchant/amazon/reviews/task_post`: unavailable. Docs page still resolves but says "This endpoint is temporarily unavailable"; absent from the OpenAPI spec and from the docs index (llms.txt).
- `GET /v3/merchant/amazon/reviews/tasks_ready`: unavailable. see task_post
- `GET /v3/merchant/amazon/reviews/task_get/advanced/{id}`: unavailable. see task_post
- `* /v3/content_generation/*`: discontinued. Content Generation API: docs pages return 404, no OpenAPI paths, not in the docs index, https://dataforseo.com/apis/content-generation-api redirects to the Content Analysis page.
- `* /v3/merchant/google/product_spec/*`: removed. Google Shopping Product Spec: docs pages return 404 and no OpenAPI paths.
- `POST /v3/ai_optimization/llm_mentions/search/live`: legacy. Use `/v3/ai_optimization/llm_mentions/search_mentions/live`. Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.
- `POST /v3/ai_optimization/llm_mentions/aggregated_metrics/live`: legacy. Use `/v3/ai_optimization/llm_mentions/target_metrics/live`. Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.
- `POST /v3/ai_optimization/llm_mentions/cross_aggregated_metrics/live`: legacy. Use `/v3/ai_optimization/llm_mentions/multi_target_metrics/live`. Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.
- `POST /v3/ai_optimization/llm_mentions/top_domains/live`: legacy. Use `/v3/ai_optimization/llm_mentions/top_mentioned_domains/live`. Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.
- `POST /v3/ai_optimization/llm_mentions/top_pages/live`: legacy. Use `/v3/ai_optimization/llm_mentions/top_mentioned_pages/live`. Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.

## Endpoints by module

### SERP API (185)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| POST | [`/v3/serp/ai_summary`](https://docs.dataforseo.com/v3/serp/ai_summary) | live | $0.01 per_request | active |
| GET | [`/v3/serp/baidu/languages`](https://docs.dataforseo.com/v3/serp/baidu/languages/) | utility | free | active |
| GET | [`/v3/serp/baidu/locations`](https://docs.dataforseo.com/v3/serp/baidu/locations/) | utility | free | active |
| GET | [`/v3/serp/baidu/locations/{country}`](https://docs.dataforseo.com/v3/serp/baidu/locations/) | utility | free | active |
| GET | [`/v3/serp/baidu/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/baidu/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/baidu/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/baidu/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/baidu/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/baidu/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/baidu/organic/task_post`](https://docs.dataforseo.com/v3/serp/baidu/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/baidu/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/baidu/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/baidu/organic/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/bing/languages`](https://docs.dataforseo.com/v3/serp/bing/languages/) | utility | free | active |
| GET | [`/v3/serp/bing/locations`](https://docs.dataforseo.com/v3/serp/bing/locations/) | utility | free | active |
| GET | [`/v3/serp/bing/locations/{country}`](https://docs.dataforseo.com/v3/serp/bing/locations/) | utility | free | active |
| POST | [`/v3/serp/bing/organic/live/advanced`](https://docs.dataforseo.com/v3/serp/bing/organic/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/bing/organic/live/html`](https://docs.dataforseo.com/v3/serp/bing/organic/live/html/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/bing/organic/live/regular`](https://docs.dataforseo.com/v3/serp/bing/organic/live/regular/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/bing/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/bing/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/bing/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/bing/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/bing/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/bing/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/bing/organic/task_post`](https://docs.dataforseo.com/v3/serp/bing/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/bing/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/bing/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/bing/organic/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/serp/google/ads_advertisers/live/advanced`](https://docs.dataforseo.com/v3/serp/google/ads_advertisers/live/advanced/) | live | $0.002 per_task | active, docs only |
| GET | [`/v3/serp/google/ads_advertisers/locations`](https://docs.dataforseo.com/v3/serp/google/ads_advertisers/locations/) | utility | free | active |
| GET | [`/v3/serp/google/ads_advertisers/task_get/advanced/{id}`](http://docs.dataforseo.com/v3/serp/google/ads_advertisers/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/ads_advertisers/task_post`](https://docs.dataforseo.com/v3/serp/google/ads_advertisers/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/ads_advertisers/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/ads_advertisers/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/ads_search/live/advanced`](https://docs.dataforseo.com/v3/serp/google/ads_search/live/advanced/) | live | $0.002 per_serp | active, docs only |
| GET | [`/v3/serp/google/ads_search/locations`](https://docs.dataforseo.com/v3/serp/google/ads_search/locations/) | utility | free | active |
| GET | [`/v3/serp/google/ads_search/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/ads_search/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/ads_search/task_post`](https://docs.dataforseo.com/v3/serp/google/ads_search/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/ads_search/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/ads_search/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/google/ai_mode/languages`](https://docs.dataforseo.com/v3/serp/google/ai_mode/languages/) | utility | free | active |
| POST | [`/v3/serp/google/ai_mode/live/advanced`](https://docs.dataforseo.com/v3/serp/google/ai_mode/live/advanced/) | live | $0.004 per_task | active |
| POST | [`/v3/serp/google/ai_mode/live/html`](https://docs.dataforseo.com/v3/serp/google/ai_mode/live/html/) | live | $0.004 per_task | active |
| GET | [`/v3/serp/google/ai_mode/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/ai_mode/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/ai_mode/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/ai_mode/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/ai_mode/task_post`](https://docs.dataforseo.com/v3/serp/google/ai_mode/task_post/) | task_post | $0.0012 per_task | active |
| GET | [`/v3/serp/google/ai_mode/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/ai_mode/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/ai_mode/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/autocomplete/live/advanced`](https://docs.dataforseo.com/v3/serp/google/autocomplete/live/advanced/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/autocomplete/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/autocomplete/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/autocomplete/task_post`](https://docs.dataforseo.com/v3/serp/google/autocomplete/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/autocomplete/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/autocomplete/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/autocomplete/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/dataset_info/live/advanced`](https://docs.dataforseo.com/v3/serp/google/dataset_info/live/advanced/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/dataset_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/dataset_info/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/dataset_info/task_post`](https://docs.dataforseo.com/v3/serp/google/dataset_info/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/dataset_info/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/dataset_info/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/dataset_info/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/dataset_search/live/advanced`](https://docs.dataforseo.com/v3/serp/google/dataset_search/live/advanced/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/dataset_search/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/dataset_search/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/dataset_search/task_post`](https://docs.dataforseo.com/v3/serp/google/dataset_search/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/dataset_search/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/dataset_search/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/dataset_search/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/events/live/advanced`](https://docs.dataforseo.com/v3/serp/google/events/live/advanced/) | live | n/a | deprecated, docs only |
| GET | [`/v3/serp/google/events/locations`](https://docs.dataforseo.com/v3/serp/google/events/locations/) | utility | free | deprecated, docs only |
| GET | [`/v3/serp/google/events/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/events/task_get/advanced/) | task_get | free | deprecated, docs only |
| POST | [`/v3/serp/google/events/task_post`](https://docs.dataforseo.com/v3/serp/google/events/task_post/) | task_post | n/a | deprecated, docs only |
| GET | [`/v3/serp/google/events/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/events/tasks_ready/) | tasks_ready | free | deprecated, docs only |
| POST | [`/v3/serp/google/finance_explore/live/advanced`](https://docs.dataforseo.com/v3/serp/google/finance_explore/live/advanced/) | live | $0.002 per_task | active |
| POST | [`/v3/serp/google/finance_explore/live/html`](https://docs.dataforseo.com/v3/serp/google/finance_explore/live/html/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/finance_explore/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_explore/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/finance_explore/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_explore/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/finance_explore/task_post`](https://docs.dataforseo.com/v3/serp/google/finance_explore/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/finance_explore/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/finance_explore/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/finance_markets/live/advanced`](https://docs.dataforseo.com/v3/serp/google/finance_markets/live/advanced/) | live | $0.002 per_task | active |
| POST | [`/v3/serp/google/finance_markets/live/html`](https://docs.dataforseo.com/v3/serp/google/finance_markets/live/html/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/finance_markets/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_markets/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/finance_markets/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_markets/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/finance_markets/task_post`](https://docs.dataforseo.com/v3/serp/google/finance_markets/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/finance_markets/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/finance_markets/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/finance_quote/live/advanced`](https://docs.dataforseo.com/v3/serp/google/finance_quote/live/advanced/) | live | $0.002 per_task | active |
| POST | [`/v3/serp/google/finance_quote/live/html`](https://docs.dataforseo.com/v3/serp/google/finance_quote/live/html/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/finance_quote/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_quote/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/finance_quote/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_quote/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/finance_quote/task_post`](https://docs.dataforseo.com/v3/serp/google/finance_quote/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/finance_quote/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/finance_quote/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/finance_ticker_search/live/advanced`](https://docs.dataforseo.com/v3/serp/google/finance_ticker_search/live/advanced/) | live | $0.002 per_task | active |
| GET | [`/v3/serp/google/finance_ticker_search/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/finance_ticker_search/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/finance_ticker_search/task_post`](https://docs.dataforseo.com/v3/serp/google/finance_ticker_search/task_post/) | task_post | $0.0006 per_task | active |
| GET | [`/v3/serp/google/finance_ticker_search/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/finance_ticker_search/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/images/live/advanced`](https://docs.dataforseo.com/v3/serp/google/images/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/google/images/live/html`](https://docs.dataforseo.com/v3/serp/google/images/live/html/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/images/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/images/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/images/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/images/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/images/task_post`](https://docs.dataforseo.com/v3/serp/google/images/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/images/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/images/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/images/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/google/jobs/locations`](https://docs.dataforseo.com/v3/serp/google/jobs/locations/) | utility | free | active, docs only |
| GET | [`/v3/serp/google/jobs/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/jobs/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/jobs/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/jobs/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/jobs/task_post`](https://docs.dataforseo.com/v3/serp/google/jobs/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/jobs/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/jobs/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/jobs/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/google/languages`](https://docs.dataforseo.com/v3/serp/google/languages/) | utility | free | active |
| POST | [`/v3/serp/google/local_finder/live/advanced`](https://docs.dataforseo.com/v3/serp/google/local_finder/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/google/local_finder/live/html`](https://docs.dataforseo.com/v3/serp/google/local_finder/live/html/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/local_finder/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/local_finder/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/local_finder/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/local_finder/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/local_finder/task_post`](https://docs.dataforseo.com/v3/serp/google/local_finder/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/local_finder/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/local_finder/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/local_finder/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/google/locations`](https://docs.dataforseo.com/v3/serp/google/locations/) | utility | free | active |
| GET | [`/v3/serp/google/locations/{country}`](https://docs.dataforseo.com/v3/serp/google/locations/) | utility | free | active |
| POST | [`/v3/serp/google/maps/live/advanced`](https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/maps/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/maps/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/google/maps/task_post`](https://docs.dataforseo.com/v3/serp/google/maps/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/maps/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/maps/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/maps/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/news/live/advanced`](https://docs.dataforseo.com/v3/serp/google/news/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/google/news/live/html`](https://docs.dataforseo.com/v3/serp/google/news/live/html/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/news/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/news/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/news/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/news/task_get/html/) | task_get | free | active |
| POST | [`/v3/serp/google/news/task_post`](https://docs.dataforseo.com/v3/serp/google/news/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/news/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/news/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/news/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/google/organic/live/advanced`](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/google/organic/live/html`](https://docs.dataforseo.com/v3/serp/google/organic/live/html/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/google/organic/live/regular`](https://docs.dataforseo.com/v3/serp/google/organic/live/regular/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/google/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/google/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/google/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/google/organic/task_post`](https://docs.dataforseo.com/v3/serp/google/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/organic/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/google/search_by_image/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/google/search_by_image/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/google/search_by_image/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/google/search_by_image/task_get/html/) | task_get | free | active, docs only |
| POST | [`/v3/serp/google/search_by_image/task_post`](https://docs.dataforseo.com/v3/serp/google/search_by_image/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/google/search_by_image/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/google/search_by_image/tasks_ready`](https://docs.dataforseo.com/v3/serp/google/search_by_image/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/serp/naver/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/naver/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/naver/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/naver/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/naver/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/naver/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/naver/organic/task_post`](https://docs.dataforseo.com/v3/serp/naver/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/naver/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/naver/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/naver/organic/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/screenshot`](https://docs.dataforseo.com/v3/serp/screenshot) | live | $0.004 per_request | active |
| GET | [`/v3/serp/seznam/languages`](https://docs.dataforseo.com/v3/serp/seznam/languages/) | utility | free | active |
| GET | [`/v3/serp/seznam/locations`](https://docs.dataforseo.com/v3/serp/seznam/locations/) | utility | free | active |
| GET | [`/v3/serp/seznam/locations/{country}`](https://docs.dataforseo.com/v3/serp/seznam/locations/) | utility | free | active |
| GET | [`/v3/serp/seznam/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/seznam/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/seznam/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/seznam/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/seznam/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/seznam/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/seznam/organic/task_post`](https://docs.dataforseo.com/v3/serp/seznam/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/seznam/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/seznam/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/seznam/organic/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/tasks_ready`](https://docs.dataforseo.com/v3/serp/baidu/organic/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/yahoo/languages`](https://docs.dataforseo.com/v3/serp/yahoo/languages/) | utility | free | active |
| GET | [`/v3/serp/yahoo/locations`](https://docs.dataforseo.com/v3/serp/yahoo/locations/) | utility | free | active |
| GET | [`/v3/serp/yahoo/locations/{country}`](https://docs.dataforseo.com/v3/serp/yahoo/locations/) | utility | free | active |
| POST | [`/v3/serp/yahoo/organic/live/advanced`](https://docs.dataforseo.com/v3/serp/yahoo/organic/live/advanced/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/yahoo/organic/live/html`](https://docs.dataforseo.com/v3/serp/yahoo/organic/live/html/) | live | $0.002 per_serp | active |
| POST | [`/v3/serp/yahoo/organic/live/regular`](https://docs.dataforseo.com/v3/serp/yahoo/organic/live/regular/) | live | $0.002 per_serp | active |
| GET | [`/v3/serp/yahoo/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/yahoo/organic/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/serp/yahoo/organic/task_get/html/{id}`](https://docs.dataforseo.com/v3/serp/yahoo/organic/task_get/html/) | task_get | free | active |
| GET | [`/v3/serp/yahoo/organic/task_get/regular/{id}`](https://docs.dataforseo.com/v3/serp/yahoo/organic/task_get/regular/) | task_get | free | active |
| POST | [`/v3/serp/yahoo/organic/task_post`](https://docs.dataforseo.com/v3/serp/yahoo/organic/task_post/) | task_post | $0.0006 per_serp | active |
| GET | [`/v3/serp/yahoo/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/yahoo/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/yahoo/organic/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/serp/youtube/languages`](https://docs.dataforseo.com/v3/serp/youtube/languages/) | utility | free | active |
| GET | [`/v3/serp/youtube/locations`](https://docs.dataforseo.com/v3/serp/youtube/locations/) | utility | free | active |
| GET | [`/v3/serp/youtube/locations/{country}`](https://docs.dataforseo.com/v3/serp/youtube/locations/) | utility | free | active |
| POST | [`/v3/serp/youtube/organic/live/advanced`](https://docs.dataforseo.com/v3/serp/youtube/organic/live/advanced/) | live | $0.002 per_block | active |
| GET | [`/v3/serp/youtube/organic/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/youtube/organic/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/youtube/organic/task_post`](https://docs.dataforseo.com/v3/serp/youtube/organic/task_post/) | task_post | $0.0006 per_block | active |
| GET | [`/v3/serp/youtube/organic/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/youtube/organic/tasks_ready`](https://docs.dataforseo.com/v3/serp/youtube/organic/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/youtube/video_comments/live/advanced`](https://docs.dataforseo.com/v3/serp/youtube/video_comments/live/advanced/) | live | $0.002 per_block | active |
| GET | [`/v3/serp/youtube/video_comments/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/youtube/video_comments/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/youtube/video_comments/task_post`](https://docs.dataforseo.com/v3/serp/youtube/video_comments/task_post/) | task_post | $0.0006 per_block | active |
| GET | [`/v3/serp/youtube/video_comments/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/youtube/video_comments/tasks_ready`](https://docs.dataforseo.com/v3/serp/youtube/video_comments/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/youtube/video_info/live/advanced`](https://docs.dataforseo.com/v3/serp/youtube/video_info/live/advanced/) | live | $0.006 per_task | active |
| GET | [`/v3/serp/youtube/video_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/youtube/video_info/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/youtube/video_info/task_post`](https://docs.dataforseo.com/v3/serp/youtube/video_info/task_post/) | task_post | $0.0018 per_task | active |
| GET | [`/v3/serp/youtube/video_info/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/youtube/video_info/tasks_ready`](https://docs.dataforseo.com/v3/serp/youtube/video_info/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/serp/youtube/video_subtitles/live/advanced`](https://docs.dataforseo.com/v3/serp/youtube/video_subtitles/live/advanced/) | live | $0.006 per_task | active |
| GET | [`/v3/serp/youtube/video_subtitles/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/serp/youtube/video_subtitles/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/serp/youtube/video_subtitles/task_post`](https://docs.dataforseo.com/v3/serp/youtube/video_subtitles/task_post/) | task_post | $0.0018 per_task | active |
| GET | [`/v3/serp/youtube/video_subtitles/tasks_fixed`](https://docs.dataforseo.com/v3/appendix/tasks_fixed/) | tasks_fixed | free | active |
| GET | [`/v3/serp/youtube/video_subtitles/tasks_ready`](https://docs.dataforseo.com/v3/serp/youtube/video_subtitles/tasks_ready/) | tasks_ready | free | active |

### AI Optimization API (54)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/ai_optimization/ai_keyword_data/available_filters`](https://docs.dataforseo.com/v3/ai_optimization/ai_keyword_data/available_filters/) | utility | free | active |
| POST | [`/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live`](https://docs.dataforseo.com/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live/) | live | $0.01 per_task_plus_per_row + per item | active |
| GET | [`/v3/ai_optimization/ai_keyword_data/locations_and_languages`](https://docs.dataforseo.com/v3/ai_optimization/ai_keyword_data/locations_and_languages/) | utility | free | active |
| POST | [`/v3/ai_optimization/chat_gpt/llm_responses/live`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/live/) | live | $0.0006 per_task | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_responses/models`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/models/) | utility | free | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_responses/task_get/{id}`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/task_get/) | task_get | free | active |
| POST | [`/v3/ai_optimization/chat_gpt/llm_responses/task_post`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/task_post/) | task_post | $0.0002 per_task + per item | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_responses/tasks_ready`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/languages`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/languages/) | utility | free | active |
| POST | [`/v3/ai_optimization/chat_gpt/llm_scraper/live/advanced`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/live/advanced/) | live | $0.004 per_result | active |
| POST | [`/v3/ai_optimization/chat_gpt/llm_scraper/live/html`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/live/html/) | live | $0.004 per_result | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/locations`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/locations/) | utility | free | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/locations/{country}`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/locations/) | utility | free | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/task_get/html/{id}`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/task_get/html/) | task_get | free | active |
| POST | [`/v3/ai_optimization/chat_gpt/llm_scraper/task_post`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/task_post/) | task_post | $0.0012 per_result | active |
| GET | [`/v3/ai_optimization/chat_gpt/llm_scraper/tasks_ready`](https://docs.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/ai_optimization/claude/llm_responses/live`](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/live/) | live | $0.0006 per_task | active |
| GET | [`/v3/ai_optimization/claude/llm_responses/models`](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/models/) | utility | free | active |
| GET | [`/v3/ai_optimization/claude/llm_responses/task_get/{id}`](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/task_get/) | task_get | free | active |
| POST | [`/v3/ai_optimization/claude/llm_responses/task_post`](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/task_post/) | task_post | $0.0002 per_task + per item | active |
| GET | [`/v3/ai_optimization/claude/llm_responses/tasks_ready`](https://docs.dataforseo.com/v3/ai_optimization/claude/llm_responses/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/ai_optimization/gemini/llm_responses/live`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_responses/live/) | live | $0.0006 per_task | active |
| GET | [`/v3/ai_optimization/gemini/llm_responses/models`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_responses/models/) | utility | free | active |
| GET | [`/v3/ai_optimization/gemini/llm_responses/task_get/{id}`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_responses/task_get/) | task_get | free | active |
| POST | [`/v3/ai_optimization/gemini/llm_responses/task_post`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_responses/task_post/) | task_post | $0.0002 per_task + per item | active |
| GET | [`/v3/ai_optimization/gemini/llm_responses/tasks_ready`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_responses/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/ai_optimization/gemini/llm_scraper/languages`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/languages/) | utility | free | active |
| POST | [`/v3/ai_optimization/gemini/llm_scraper/live/advanced`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/live/advanced/) | live | $0.004 per_result | active |
| POST | [`/v3/ai_optimization/gemini/llm_scraper/live/html`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/live/html/) | live | $0.004 per_result | active |
| GET | [`/v3/ai_optimization/gemini/llm_scraper/locations`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/locations/) | utility | free | active |
| GET | [`/v3/ai_optimization/gemini/llm_scraper/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/ai_optimization/gemini/llm_scraper/task_get/html/{id}`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/task_get/html/) | task_get | free | active |
| POST | [`/v3/ai_optimization/gemini/llm_scraper/task_post`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/task_post/) | task_post | $0.0012 per_result | active |
| GET | [`/v3/ai_optimization/gemini/llm_scraper/tasks_ready`](https://docs.dataforseo.com/v3/ai_optimization/gemini/llm_scraper/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/ai_optimization/llm_mentions/available_filters`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/filters/) | utility | free | active |
| POST | [`/v3/ai_optimization/llm_mentions/historical/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/historical/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| GET | [`/v3/ai_optimization/llm_mentions/locations_and_languages`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/locations_and_languages/) | utility | free | active |
| POST | [`/v3/ai_optimization/llm_mentions/multi_target_metrics/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/multi_target_metrics/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/search_mentions/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/search_mentions/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/target_metrics/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/target_metrics/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/target_metrics_lite/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/target_metrics_lite/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/timeseries_delta/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/timeseries_delta/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/timeseries_new_lost/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/timeseries_new_lost/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_brand_categories/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_brand_categories/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_brand_categories_lite/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_brand_categories_lite/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_brands/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_brands/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_brands_lite/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_brands_lite/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_domains/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_domains/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_domains_lite/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_domains_lite/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_pages/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_pages/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/llm_mentions/top_mentioned_pages_lite/live`](https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/top_mentioned_pages_lite/live/) | live | $0.1 per_task_plus_per_row + per item | active |
| POST | [`/v3/ai_optimization/perplexity/llm_responses/live`](https://docs.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/live/) | live | $0.0006 per_task | active |
| GET | [`/v3/ai_optimization/perplexity/llm_responses/models`](https://docs.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/models/) | utility | free | active |

### Keywords Data API (75)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/keywords_data/bing/audience_estimation/industries`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/industries/) | utility | free | active |
| GET | [`/v3/keywords_data/bing/audience_estimation/job_functions`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/job_functions/) | utility | free | active |
| POST | [`/v3/keywords_data/bing/audience_estimation/live`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/audience_estimation/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/audience_estimation/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/audience_estimation/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/audience_estimation/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/bing/keyword_performance/live`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_performance/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/keyword_performance/locations_and_languages`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_performance/locations_and_languages/) | utility | free | active |
| GET | [`/v3/keywords_data/bing/keyword_performance/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_performance/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/keyword_performance/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_performance/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/keyword_performance/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_performance/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/keywords_data/bing/keyword_suggestions_for_url/languages`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_suggestions_for_url/languages/) | utility | free | active, docs only |
| POST | [`/v3/keywords_data/bing/keyword_suggestions_for_url/live`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_suggestions_for_url/live/) | live | $0.09 per_task | active, docs only |
| GET | [`/v3/keywords_data/bing/keyword_suggestions_for_url/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_suggestions_for_url/task_get/) | task_get | free | active, docs only |
| POST | [`/v3/keywords_data/bing/keyword_suggestions_for_url/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_suggestions_for_url/task_post/) | task_post | $0.06 per_task | active, docs only |
| GET | [`/v3/keywords_data/bing/keyword_suggestions_for_url/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/keyword_suggestions_for_url/tasks_ready/) | tasks_ready | free | active, docs only |
| POST | [`/v3/keywords_data/bing/keywords_for_keywords/live`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_keywords/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/keywords_for_keywords/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_keywords/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/keywords_for_keywords/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_keywords/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/keywords_for_keywords/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_keywords/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/bing/keywords_for_site/live`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_site/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/keywords_for_site/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_site/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/keywords_for_site/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_site/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/keywords_for_site/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/keywords_for_site/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/keywords_data/bing/languages`](https://docs.dataforseo.com/v3/keywords_data/bing/languages/) | utility | free | active |
| GET | [`/v3/keywords_data/bing/locations`](https://docs.dataforseo.com/v3/keywords_data/bing/locations/) | utility | free | active |
| POST | [`/v3/keywords_data/bing/search_volume/live`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/search_volume/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/search_volume/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/search_volume/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/bing/search_volume_history/live`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume_history/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/bing/search_volume_history/locations_and_languages`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume_history/locations_and_languages/) | utility | free | active |
| GET | [`/v3/keywords_data/bing/search_volume_history/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume_history/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/bing/search_volume_history/task_post`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume_history/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/bing/search_volume_history/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/bing/search_volume_history/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/clickstream_data/bulk_search_volume/live`](https://docs.dataforseo.com/v3/keywords_data/clickstream_data/bulk_search_volume/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/keywords_data/clickstream_data/dataforseo_search_volume/live`](https://docs.dataforseo.com/v3/keywords_data/clickstream_data/dataforseo_search_volume/live/) | live | $0.18 per_task | active |
| POST | [`/v3/keywords_data/clickstream_data/global_search_volume/live`](https://docs.dataforseo.com/v3/keywords_data/clickstream_data/global_search_volume/live/) | live | $0.18 per_task | active |
| GET | [`/v3/keywords_data/clickstream_data/locations_and_languages`](https://docs.dataforseo.com/v3/keywords_data/clickstream_data/locations_and_languages/) | utility | free | active |
| POST | [`/v3/keywords_data/dataforseo_trends/demography/live`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/demography/live/) | live | $0.0024 per_task | active |
| POST | [`/v3/keywords_data/dataforseo_trends/explore/live`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/explore/live/) | live | $0.0012 per_task | active |
| GET | [`/v3/keywords_data/dataforseo_trends/locations`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/locations/) | utility | free | active |
| GET | [`/v3/keywords_data/dataforseo_trends/locations/{country}`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/locations/) | utility | free | active |
| POST | [`/v3/keywords_data/dataforseo_trends/merged_data/live`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/merged_data/live/) | live | $0.006 per_task | active |
| POST | [`/v3/keywords_data/dataforseo_trends/subregion_interests/live`](https://docs.dataforseo.com/v3/keywords_data/dataforseo_trends/subregion_interests/live/) | live | $0.0024 per_task | active |
| POST | [`/v3/keywords_data/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/keywords_data/google_ads/ad_traffic_by_keywords/live`](https://docs.dataforseo.com/v3/keywords_data/google_ads/ad_traffic_by_keywords/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/google_ads/ad_traffic_by_keywords/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/google_ads/ad_traffic_by_keywords/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/google_ads/ad_traffic_by_keywords/task_post`](https://docs.dataforseo.com/v3/keywords_data/google_ads/ad_traffic_by_keywords/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/google_ads/ad_traffic_by_keywords/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/google_ads/ad_traffic_by_keywords/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/google_ads/keywords_for_keywords/live`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/google_ads/keywords_for_keywords/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/google_ads/keywords_for_keywords/task_post`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/google_ads/keywords_for_keywords/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/keywords_data/google_ads/keywords_for_site/live`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/google_ads/keywords_for_site/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/google_ads/keywords_for_site/task_post`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/google_ads/keywords_for_site/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/keywords_data/google_ads/languages`](https://docs.dataforseo.com/v3/keywords_data/google_ads/languages/) | utility | free | active |
| GET | [`/v3/keywords_data/google_ads/locations`](https://docs.dataforseo.com/v3/keywords_data/google_ads/locations/) | utility | free | active |
| GET | [`/v3/keywords_data/google_ads/locations/{country}`](https://docs.dataforseo.com/v3/keywords_data/google_ads/locations/) | utility | free | active |
| POST | [`/v3/keywords_data/google_ads/search_volume/live`](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/) | live | $0.09 per_task | active |
| GET | [`/v3/keywords_data/google_ads/search_volume/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/google_ads/search_volume/task_post`](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post/) | task_post | $0.06 per_task | active |
| GET | [`/v3/keywords_data/google_ads/search_volume/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/keywords_data/google_ads/status`](https://docs.dataforseo.com/v3/keywords_data/google_ads/status/) | utility | free | active |
| GET | [`/v3/keywords_data/google_trends/categories`](https://docs.dataforseo.com/v3/keywords_data/google_trends/categories/) | utility | free | active |
| POST | [`/v3/keywords_data/google_trends/explore/live`](https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/live/) | live | $0.011 per_task | active |
| GET | [`/v3/keywords_data/google_trends/explore/task_get/{id}`](https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/task_get/) | task_get | free | active |
| POST | [`/v3/keywords_data/google_trends/explore/task_post`](https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/task_post/) | task_post | $0.0027 per_task | active |
| GET | [`/v3/keywords_data/google_trends/explore/tasks_ready`](https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/keywords_data/google_trends/languages`](https://docs.dataforseo.com/v3/keywords_data/google_trends/languages/) | utility | free | active |
| GET | [`/v3/keywords_data/google_trends/locations`](https://docs.dataforseo.com/v3/keywords_data/google_trends/locations/) | utility | free | active |
| GET | [`/v3/keywords_data/google_trends/locations/{country}`](https://docs.dataforseo.com/v3/keywords_data/google_trends/locations/) | utility | free | active |
| POST | [`/v3/keywords_data/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |

### DataForSEO Labs API (48)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| POST | [`/v3/dataforseo_labs/amazon/bulk_search_volume/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/amazon/product_competitors/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/product_competitors/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/amazon/product_keyword_intersections/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/product_keyword_intersections/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/amazon/product_rank_overview/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/product_rank_overview/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/amazon/ranked_keywords/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/ranked_keywords/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/amazon/related_keywords/live`](https://docs.dataforseo.com/v3/dataforseo_labs/amazon/related_keywords/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/apple/app_competitors/live`](https://docs.dataforseo.com/v3/dataforseo_labs/apple/app_competitors/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/apple/app_intersection/live`](https://docs.dataforseo.com/v3/dataforseo_labs/apple/app_intersection/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/apple/bulk_app_metrics/live`](https://docs.dataforseo.com/v3/dataforseo_labs/apple/bulk_app_metrics/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/apple/keywords_for_app/live`](https://docs.dataforseo.com/v3/dataforseo_labs/apple/keywords_for_app/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/dataforseo_labs/available_filters`](https://docs.dataforseo.com/v3/dataforseo_labs/filters/) | utility | free | active |
| GET | [`/v3/dataforseo_labs/categories`](https://docs.dataforseo.com/v3/dataforseo_labs/categories_list/) | utility | free | active |
| POST | [`/v3/dataforseo_labs/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/dataforseo_labs/google/app_competitors/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/app_competitors/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/app_intersection/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/app_intersection/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/dataforseo_labs/google/available_history`](https://docs.dataforseo.com/v3/dataforseo_labs/google/available_history/live/) | utility | free | active |
| POST | [`/v3/dataforseo_labs/google/bulk_app_metrics/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/bulk_app_metrics/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/bulk_keyword_difficulty/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/bulk_traffic_estimation/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/bulk_traffic_estimation/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/categories_for_domain/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/categories_for_domain/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/dataforseo_labs/google/categories_for_keywords/languages`](https://docs.dataforseo.com/v3/dataforseo_labs/google/categories_for_keywords/languages/) | utility | free | active |
| POST | [`/v3/dataforseo_labs/google/categories_for_keywords/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/categories_for_keywords/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/competitors_domain/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/domain_intersection/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/domain_intersection/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/domain_metrics_by_categories/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/domain_metrics_by_categories/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/domain_rank_overview/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/historical_bulk_traffic_estimation/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/historical_bulk_traffic_estimation/live/) | live | $0.12 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/historical_keyword_data/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/historical_keyword_data/live/) | live | free | active |
| POST | [`/v3/dataforseo_labs/google/historical_rank_overview/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/historical_rank_overview/live/) | live | $0.12 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/historical_search_volume/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live/) | live | free | active |
| POST | [`/v3/dataforseo_labs/google/historical_serps/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/historical_serps/live/) | live | $0.00012 per_serp | active |
| POST | [`/v3/dataforseo_labs/google/keyword_ideas/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/keyword_overview/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live/) | live | free | active |
| POST | [`/v3/dataforseo_labs/google/keyword_suggestions/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/keywords_for_app/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keywords_for_app/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/keywords_for_categories/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keywords_for_categories/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/keywords_for_site/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/page_intersection/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/page_intersection/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/ranked_keywords/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/related_keywords/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/relevant_pages/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/relevant_pages/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/search_intent/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/search_intent/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/serp_competitors/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/serp_competitors/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/subdomains/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/subdomains/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/google/top_searches/live`](https://docs.dataforseo.com/v3/dataforseo_labs/google/top_searches/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/dataforseo_labs/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/dataforseo_labs/locations_and_languages`](https://docs.dataforseo.com/v3/dataforseo_labs/locations_and_languages/) | utility | free | active |
| GET | [`/v3/dataforseo_labs/status`](https://docs.dataforseo.com/v3/dataforseo_labs/status/) | utility | free | active |

### Backlinks API (24)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| POST | [`/v3/backlinks/anchors/live`](https://docs.dataforseo.com/v3/backlinks/anchors/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| GET | [`/v3/backlinks/available_filters`](https://docs.dataforseo.com/v3/backlinks/filters/) | utility | free | active |
| POST | [`/v3/backlinks/backlinks/live`](https://docs.dataforseo.com/v3/backlinks/backlinks/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_backlinks/live`](https://docs.dataforseo.com/v3/backlinks/bulk_backlinks/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_new_lost_backlinks/live`](https://docs.dataforseo.com/v3/backlinks/bulk_new_lost_backlinks/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_new_lost_referring_domains/live`](https://docs.dataforseo.com/v3/backlinks/bulk_new_lost_referring_domains/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_pages_summary/live`](https://docs.dataforseo.com/v3/backlinks/bulk_pages_summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_ranks/live`](https://docs.dataforseo.com/v3/backlinks/bulk_ranks/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_referring_domains/live`](https://docs.dataforseo.com/v3/backlinks/bulk_referring_domains/live) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/bulk_spam_score/live`](https://docs.dataforseo.com/v3/backlinks/bulk_spam_score/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/competitors/live`](https://docs.dataforseo.com/v3/backlinks/competitors/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/domain_intersection/live`](https://docs.dataforseo.com/v3/backlinks/domain_intersection/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/domain_pages/live`](https://docs.dataforseo.com/v3/backlinks/domain_pages/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/domain_pages_summary/live`](https://docs.dataforseo.com/v3/backlinks/domain_pages_summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/backlinks/history/live`](https://docs.dataforseo.com/v3/backlinks/history/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/backlinks/index`](https://docs.dataforseo.com/v3/backlinks/index) | utility | free | active |
| POST | [`/v3/backlinks/page_intersection/live`](https://docs.dataforseo.com/v3/backlinks/page_intersection/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/referring_domains/live`](https://docs.dataforseo.com/v3/backlinks/referring_domains/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/referring_networks/live`](https://docs.dataforseo.com/v3/backlinks/referring_networks/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/summary/live`](https://docs.dataforseo.com/v3/backlinks/summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/timeseries_new_lost_summary/live`](https://docs.dataforseo.com/v3/backlinks/timeseries_new_lost_summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/backlinks/timeseries_summary/live`](https://docs.dataforseo.com/v3/backlinks/timeseries_summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |

### OnPage API (31)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/on_page/available_filters`](https://docs.dataforseo.com/v3/on_page/filters_and_thresholds/) | utility | free | active |
| POST | [`/v3/on_page/content_parsing`](https://docs.dataforseo.com/v3/on_page/content_parsing/) | live | free | active |
| POST | [`/v3/on_page/content_parsing/live`](https://docs.dataforseo.com/v3/on_page/content_parsing/live/) | live | $0.00015 per_task | active |
| POST | [`/v3/on_page/duplicate_content`](https://docs.dataforseo.com/v3/on_page/duplicate_content/) | task_result | free | active |
| POST | [`/v3/on_page/duplicate_tags`](https://docs.dataforseo.com/v3/on_page/duplicate_tags/) | task_result | free | active |
| POST | [`/v3/on_page/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/on_page/force_stop`](https://docs.dataforseo.com/v3/on_page/force_stop/) | task_result | free | active |
| POST | [`/v3/on_page/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| POST | [`/v3/on_page/instant_pages`](https://docs.dataforseo.com/v3/on_page/instant_pages) | live | $0.00015 per_task | active |
| POST | [`/v3/on_page/keyword_density`](https://docs.dataforseo.com/v3/on_page/keyword_density/) | task_result | free | active |
| GET | [`/v3/on_page/lighthouse/audits`](https://docs.dataforseo.com/v3/on_page/lighthouse/audits/) | utility | free | active |
| GET | [`/v3/on_page/lighthouse/languages`](https://docs.dataforseo.com/v3/on_page/lighthouse/languages/) | utility | free | active |
| POST | [`/v3/on_page/lighthouse/live/json`](https://docs.dataforseo.com/v3/on_page/lighthouse/live/json/) | live | $0.005 per_task | active |
| GET | [`/v3/on_page/lighthouse/task_get/json/{id}`](https://docs.dataforseo.com/v3/on_page/lighthouse/task_get/json/) | task_get | free | active |
| POST | [`/v3/on_page/lighthouse/task_post`](https://docs.dataforseo.com/v3/on_page/lighthouse/task_post/) | task_post | $0.005 per_task | active |
| GET | [`/v3/on_page/lighthouse/tasks_ready`](https://docs.dataforseo.com/v3/on_page/lighthouse/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/on_page/lighthouse/versions`](https://docs.dataforseo.com/v3/on_page/lighthouse/versions/) | utility | free | active |
| POST | [`/v3/on_page/links`](https://docs.dataforseo.com/v3/on_page/links/) | task_result | free | active |
| POST | [`/v3/on_page/microdata`](https://docs.dataforseo.com/v3/on_page/microdata/) | task_result | free | active |
| POST | [`/v3/on_page/non_indexable`](https://docs.dataforseo.com/v3/on_page/non_indexable/) | task_result | free | active |
| POST | [`/v3/on_page/page_screenshot`](https://docs.dataforseo.com/v3/on_page/page_screenshot) | live | $0.0048 per_task | active |
| POST | [`/v3/on_page/pages`](https://docs.dataforseo.com/v3/on_page/pages/) | task_result | free | active |
| POST | [`/v3/on_page/pages_by_resource`](https://docs.dataforseo.com/v3/on_page/page_by_resource/) | task_result | free | active |
| POST | [`/v3/on_page/raw_html`](https://docs.dataforseo.com/v3/on_page/raw_html) | task_result | free | active |
| POST | [`/v3/on_page/redirect_chains`](https://docs.dataforseo.com/v3/on_page/redirect_chains/) | task_result | free | active |
| POST | [`/v3/on_page/resources`](https://docs.dataforseo.com/v3/on_page/resources/) | task_result | free | active |
| GET | [`/v3/on_page/summary/{id}`](https://docs.dataforseo.com/v3/on_page/summary/) | task_result | free | active |
| POST | [`/v3/on_page/task_post`](https://docs.dataforseo.com/v3/on_page/task_post/) | task_post | $0.00015 per_page | active |
| GET | [`/v3/on_page/tasks_ready`](https://docs.dataforseo.com/v3/on_page/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/on_page/uncrawlable_resources`](https://docs.dataforseo.com/v3/on_page/uncrawlable_resources/) | task_result | free | active |
| POST | [`/v3/on_page/waterfall`](https://docs.dataforseo.com/v3/on_page/waterfall/) | task_result | free | active |

### Domain Analytics API (14)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| POST | [`/v3/domain_analytics/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| POST | [`/v3/domain_analytics/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| POST | [`/v3/domain_analytics/technologies/aggregation_technologies/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/aggregation_technologies/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/domain_analytics/technologies/available_filters`](https://docs.dataforseo.com/v3/domain_analytics/technologies/filters/) | utility | free | active |
| POST | [`/v3/domain_analytics/technologies/domain_technologies/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/domain_technologies/live/) | live | $0.012 per_task | active |
| POST | [`/v3/domain_analytics/technologies/domains_by_html_terms/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/domains_by_html_terms/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/domain_analytics/technologies/domains_by_technology/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/domains_by_technology/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/domain_analytics/technologies/languages`](https://docs.dataforseo.com/v3/domain_analytics/technologies/languages/) | utility | free | active |
| GET | [`/v3/domain_analytics/technologies/locations`](https://docs.dataforseo.com/v3/domain_analytics/technologies/locations/) | utility | free | active |
| GET | [`/v3/domain_analytics/technologies/technologies`](https://docs.dataforseo.com/v3/domain_analytics/technologies/technologies/) | utility | free | active |
| POST | [`/v3/domain_analytics/technologies/technologies_summary/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/technologies_summary/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/domain_analytics/technologies/technology_stats/live`](https://docs.dataforseo.com/v3/domain_analytics/technologies/technology_stats/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/domain_analytics/whois/available_filters`](https://docs.dataforseo.com/v3/domain_analytics/whois/filters/) | utility | free | active |
| POST | [`/v3/domain_analytics/whois/overview/live`](https://docs.dataforseo.com/v3/domain_analytics/whois/overview/live/) | live | $0.12 per_task_plus_per_item + per item | active |

### Content Analysis API (11)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/content_analysis/available_filters`](https://docs.dataforseo.com/v3/content_analysis/filters/) | utility | free | active |
| GET | [`/v3/content_analysis/categories`](https://docs.dataforseo.com/v3/content_analysis/categories/) | utility | free | active |
| POST | [`/v3/content_analysis/category_trends/live`](https://docs.dataforseo.com/v3/content_analysis/category_trends/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/content_analysis/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/content_analysis/languages`](https://docs.dataforseo.com/v3/content_analysis/languages/) | utility | free | active |
| GET | [`/v3/content_analysis/locations`](https://docs.dataforseo.com/v3/content_analysis/locations/) | utility | free | active |
| POST | [`/v3/content_analysis/phrase_trends/live`](https://docs.dataforseo.com/v3/content_analysis/phrase_trends/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/content_analysis/rating_distribution/live`](https://docs.dataforseo.com/v3/content_analysis/rating_distribution/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/content_analysis/search/live`](https://docs.dataforseo.com/v3/content_analysis/search/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/content_analysis/sentiment_analysis/live`](https://docs.dataforseo.com/v3/content_analysis/sentiment_analysis/live/) | live | $0.024 per_task_plus_per_row + per item | active |
| POST | [`/v3/content_analysis/summary/live`](https://docs.dataforseo.com/v3/content_analysis/summary/live/) | live | $0.024 per_task_plus_per_row + per item | active |

### Merchant API (41)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| POST | [`/v3/merchant/amazon/asin/live/advanced`](https://docs.dataforseo.com/v3/merchant/amazon/asin/live/advanced/) | live | $0.005 per_product | active |
| POST | [`/v3/merchant/amazon/asin/live/html`](https://docs.dataforseo.com/v3/merchant/amazon/asin/live/html/) | live | $0.005 per_product | active |
| GET | [`/v3/merchant/amazon/asin/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/asin/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/merchant/amazon/asin/task_get/html/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/asin/task_get/html/) | task_get | free | active |
| POST | [`/v3/merchant/amazon/asin/task_post`](https://docs.dataforseo.com/v3/merchant/amazon/asin/task_post/) | task_post | $0.0015 per_product | active |
| GET | [`/v3/merchant/amazon/asin/tasks_ready`](https://docs.dataforseo.com/v3/merchant/amazon/asin/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/merchant/amazon/languages`](https://docs.dataforseo.com/v3/merchant/amazon/languages/) | utility | free | active |
| GET | [`/v3/merchant/amazon/locations`](https://docs.dataforseo.com/v3/merchant/amazon/locations/) | utility | free | active |
| GET | [`/v3/merchant/amazon/locations/{country}`](https://docs.dataforseo.com/v3/merchant/amazon/locations/) | utility | free | active |
| POST | [`/v3/merchant/amazon/products/live/advanced`](https://docs.dataforseo.com/v3/merchant/amazon/products/live/advanced/) | live | $0.0033 per_serp | active |
| POST | [`/v3/merchant/amazon/products/live/html`](https://docs.dataforseo.com/v3/merchant/amazon/products/live/html/) | live | $0.0033 per_serp | active |
| GET | [`/v3/merchant/amazon/products/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/products/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/merchant/amazon/products/task_get/html/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/products/task_get/html/) | task_get | free | active |
| POST | [`/v3/merchant/amazon/products/task_post`](https://docs.dataforseo.com/v3/merchant/amazon/products/task_post/) | task_post | $0.0015 per_serp | active |
| GET | [`/v3/merchant/amazon/products/tasks_ready`](https://docs.dataforseo.com/v3/merchant/amazon/products/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/merchant/amazon/sellers/live/advanced`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/live/advanced/) | live | $0.0033 per_serp | active |
| POST | [`/v3/merchant/amazon/sellers/live/html`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/live/html/) | live | $0.0033 per_serp | active |
| GET | [`/v3/merchant/amazon/sellers/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/merchant/amazon/sellers/task_get/html/{id}`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/task_get/html) | task_get | free | active |
| POST | [`/v3/merchant/amazon/sellers/task_post`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/task_post/) | task_post | $0.0015 per_serp | active |
| GET | [`/v3/merchant/amazon/sellers/tasks_ready`](https://docs.dataforseo.com/v3/merchant/amazon/sellers/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/merchant/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| GET | [`/v3/merchant/google/languages`](https://docs.dataforseo.com/v3/merchant/google/languages/) | utility | free | active |
| GET | [`/v3/merchant/google/locations`](https://docs.dataforseo.com/v3/merchant/google/locations/) | utility | free | active |
| GET | [`/v3/merchant/google/locations/{country}`](https://docs.dataforseo.com/v3/merchant/google/locations/) | utility | free | active |
| GET | [`/v3/merchant/google/product_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/google/product_info/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/merchant/google/product_info/task_post`](https://docs.dataforseo.com/v3/merchant/google/product_info/task_post/) | task_post | $0.001 per_product | active |
| GET | [`/v3/merchant/google/product_info/tasks_ready`](https://docs.dataforseo.com/v3/merchant/google/product_info/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/merchant/google/products/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/google/products/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/merchant/google/products/task_get/html/{id}`](https://docs.dataforseo.com/v3/merchant/google/products/task_get/html/) | task_get | free | active |
| POST | [`/v3/merchant/google/products/task_post`](https://docs.dataforseo.com/v3/merchant/google/products/task_post) | task_post | $0.001 per_serp | active |
| GET | [`/v3/merchant/google/products/tasks_ready`](https://docs.dataforseo.com/v3/merchant/google/products/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/merchant/google/reviews/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/google/reviews/task_get/advanced/) | task_get | free | active, docs only |
| POST | [`/v3/merchant/google/reviews/task_post`](https://docs.dataforseo.com/v3/merchant/google/reviews/task_post/) | task_post | $0.00075 per_block | active, docs only |
| GET | [`/v3/merchant/google/reviews/tasks_ready`](https://docs.dataforseo.com/v3/merchant/google/reviews/tasks_ready/) | tasks_ready | free | active, docs only |
| GET | [`/v3/merchant/google/sellers/ad_url/{shop_ad_aclk}`](https://docs.dataforseo.com/v3/merchant/google/sellers/ad_url/) | live | $1e-06 per_request | active |
| GET | [`/v3/merchant/google/sellers/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/merchant/google/sellers/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/merchant/google/sellers/task_post`](https://docs.dataforseo.com/v3/merchant/google/sellers/task_post/) | task_post | $0.001 per_serp | active |
| GET | [`/v3/merchant/google/sellers/tasks_ready`](https://docs.dataforseo.com/v3/merchant/google/sellers/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/merchant/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/merchant/tasks_ready`](https://docs.dataforseo.com/v3/merchant/amazon/asin/tasks_ready/) | tasks_ready | free | active |

### App Data API (42)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/app_data/apple/app_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/apple/app_info/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/app_data/apple/app_info/task_post`](https://docs.dataforseo.com/v3/app_data/apple/app_info/task_post/) | task_post | $0.0006 per_result | active |
| GET | [`/v3/app_data/apple/app_info/tasks_ready`](https://docs.dataforseo.com/v3/app_data/apple/app_info/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/apple/app_list/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/apple/app_list/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/app_data/apple/app_list/task_post`](https://docs.dataforseo.com/v3/app_data/apple/app_list/task_post/) | task_post | $0.0012 per_serp | active |
| GET | [`/v3/app_data/apple/app_list/tasks_ready`](https://docs.dataforseo.com/v3/app_data/apple/app_list/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/apple/app_listings/categories`](https://docs.dataforseo.com/v3/app_data/apple/app_listings/categories/) | utility | free | active |
| POST | [`/v3/app_data/apple/app_listings/search/live`](https://docs.dataforseo.com/v3/app_data/apple/app_listings/search/live/) | live | $0.1 per_task_plus_per_item + per item | active |
| GET | [`/v3/app_data/apple/app_reviews/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/apple/app_reviews/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/app_data/apple/app_reviews/task_post`](https://docs.dataforseo.com/v3/app_data/apple/app_reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/app_data/apple/app_reviews/tasks_ready`](https://docs.dataforseo.com/v3/app_data/apple/app_reviews/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/apple/app_searches/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/apple/app_searches/task_get/advanced/) | task_get | free | active |
| POST | [`/v3/app_data/apple/app_searches/task_post`](https://docs.dataforseo.com/v3/app_data/apple/app_searches/task_post/) | task_post | $0.0012 per_serp | active |
| GET | [`/v3/app_data/apple/app_searches/tasks_ready`](https://docs.dataforseo.com/v3/app_data/apple/app_searches/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/apple/categories`](https://docs.dataforseo.com/v3/app_data/apple/categories/) | utility | free | active |
| GET | [`/v3/app_data/apple/languages`](https://docs.dataforseo.com/v3/app_data/apple/languages/) | utility | free | active |
| GET | [`/v3/app_data/apple/locations`](https://docs.dataforseo.com/v3/app_data/apple/locations/) | utility | free | active |
| POST | [`/v3/app_data/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| GET | [`/v3/app_data/google/app_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_info/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/app_data/google/app_info/task_get/html/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_info/task_get/html/) | task_get | free | active |
| POST | [`/v3/app_data/google/app_info/task_post`](https://docs.dataforseo.com/v3/app_data/google/app_info/task_post/) | task_post | $0.0006 per_result | active |
| GET | [`/v3/app_data/google/app_info/tasks_ready`](https://docs.dataforseo.com/v3/app_data/google/app_info/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/google/app_list/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_list/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/app_data/google/app_list/task_get/html/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_list/task_get/html/) | task_get | free | active |
| POST | [`/v3/app_data/google/app_list/task_post`](https://docs.dataforseo.com/v3/app_data/google/app_list/task_post/) | task_post | $0.0012 per_serp | active |
| GET | [`/v3/app_data/google/app_list/tasks_ready`](https://docs.dataforseo.com/v3/app_data/google/app_list/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/google/app_listings/categories`](https://docs.dataforseo.com/v3/app_data/google/app_listings/categories/) | utility | free | active |
| POST | [`/v3/app_data/google/app_listings/search/live`](https://docs.dataforseo.com/v3/app_data/google/app_listings/search/live/) | live | $0.1 per_task_plus_per_item + per item | active |
| GET | [`/v3/app_data/google/app_reviews/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_reviews/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/app_data/google/app_reviews/task_get/html/{id}`](None) | task_get | free | active |
| POST | [`/v3/app_data/google/app_reviews/task_post`](https://docs.dataforseo.com/v3/app_data/google/app_reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/app_data/google/app_reviews/tasks_ready`](https://docs.dataforseo.com/v3/app_data/google/app_reviews/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/google/app_searches/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_searches/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/app_data/google/app_searches/task_get/html/{id}`](https://docs.dataforseo.com/v3/app_data/google/app_searches/task_get/html/) | task_get | free | active |
| POST | [`/v3/app_data/google/app_searches/task_post`](https://docs.dataforseo.com/v3/app_data/google/app_searches/task_post/) | task_post | $0.0012 per_serp | active |
| GET | [`/v3/app_data/google/app_searches/tasks_ready`](https://docs.dataforseo.com/v3/app_data/google/app_searches/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/app_data/google/categories`](https://docs.dataforseo.com/v3/app_data/google/categories/) | utility | free | active |
| GET | [`/v3/app_data/google/languages`](https://docs.dataforseo.com/v3/app_data/google/languages/) | utility | free | active |
| GET | [`/v3/app_data/google/locations`](https://docs.dataforseo.com/v3/app_data/google/locations/) | utility | free | active |
| GET | [`/v3/app_data/google/locations/{country}`](https://docs.dataforseo.com/v3/app_data/google/locations/) | utility | free | active |
| POST | [`/v3/app_data/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| GET | [`/v3/app_data/tasks_ready`](https://docs.dataforseo.com/v3/app_data/apple/app_info/tasks_ready) | tasks_ready | free | active |

### Business Data API (54)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/business_data/business_listings/available_filters`](https://docs.dataforseo.com/v3/business_data/business_listings/filters/) | utility | free | active |
| GET | [`/v3/business_data/business_listings/categories`](https://docs.dataforseo.com/v3/business_data/business_listings/categories/) | utility | free | active |
| POST | [`/v3/business_data/business_listings/categories_aggregation/live`](https://docs.dataforseo.com/v3/business_data/business_listings/categories_aggregation/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| GET | [`/v3/business_data/business_listings/locations`](https://docs.dataforseo.com/v3/business_data/business_listings/locations/) | utility | free | active |
| POST | [`/v3/business_data/business_listings/search/live`](https://docs.dataforseo.com/v3/business_data/business_listings/search/live/) | live | $0.012 per_task_plus_per_item + per item | active |
| POST | [`/v3/business_data/errors`](https://docs.dataforseo.com/v3/appendix/api_errors/) | utility | free | active |
| GET | [`/v3/business_data/google/extended_reviews/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/extended_reviews/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/extended_reviews/task_post`](https://docs.dataforseo.com/v3/business_data/google/extended_reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/google/extended_reviews/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/extended_reviews/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/business_data/google/hotel_info/live/advanced`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/live/advanced/) | live | $0.004 per_result | active |
| POST | [`/v3/business_data/google/hotel_info/live/html`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/live/html/) | live | $0.004 per_result | active |
| GET | [`/v3/business_data/google/hotel_info/task_get/advanced/{id}`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/task_get/advanced/) | task_get | free | active |
| GET | [`/v3/business_data/google/hotel_info/task_get/html/{id}`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/task_get/html/) | task_get | free | active |
| POST | [`/v3/business_data/google/hotel_info/task_post`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/task_post/) | task_post | $0.0008 per_result | active |
| GET | [`/v3/business_data/google/hotel_info/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/hotel_info/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/business_data/google/hotel_searches/live`](https://docs.dataforseo.com/v3/business_data/google/hotel_searches/live/) | live | $0.004 per_result | active |
| GET | [`/v3/business_data/google/hotel_searches/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/hotel_searches/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/hotel_searches/task_post`](https://docs.dataforseo.com/v3/business_data/google/hotel_searches/task_post/) | task_post | $0.0008 per_result | active |
| GET | [`/v3/business_data/google/hotel_searches/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/hotel_searches/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/business_data/google/languages`](https://docs.dataforseo.com/v3/business_data/google/languages/) | utility | free | active |
| GET | [`/v3/business_data/google/locations`](https://docs.dataforseo.com/v3/business_data/google/locations/) | utility | free | active |
| GET | [`/v3/business_data/google/locations/{country}`](https://docs.dataforseo.com/v3/business_data/google/locations/) | utility | free | active |
| POST | [`/v3/business_data/google/my_business_info/live`](https://docs.dataforseo.com/v3/business_data/google/my_business_info/live/) | live | $0.0054 per_result | active |
| GET | [`/v3/business_data/google/my_business_info/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/my_business_info/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/my_business_info/task_post`](https://docs.dataforseo.com/v3/business_data/google/my_business_info/task_post/) | task_post | $0.0015 per_result | active |
| GET | [`/v3/business_data/google/my_business_info/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/my_business_info/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/business_data/google/my_business_updates/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/my_business_updates/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/my_business_updates/task_post`](https://docs.dataforseo.com/v3/business_data/google/my_business_updates/task_post/) | task_post | $0.0015 per_task_plus_per_block + per item | active |
| GET | [`/v3/business_data/google/my_business_updates/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/my_business_updates/tasks_ready/) | tasks_ready | free | active |
| POST | [`/v3/business_data/google/questions_and_answers/live`](https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/live/) | live | $0.0054 per_block | active |
| GET | [`/v3/business_data/google/questions_and_answers/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/questions_and_answers/task_post`](https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/google/questions_and_answers/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/business_data/google/reviews/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/google/reviews/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/google/reviews/task_post`](https://docs.dataforseo.com/v3/business_data/google/reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/google/reviews/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/reviews/tasks_ready) | tasks_ready | free | active |
| POST | [`/v3/business_data/id_list`](https://docs.dataforseo.com/v3/appendix/id_list/) | utility | free | active |
| POST | [`/v3/business_data/social_media/pinterest/live`](https://docs.dataforseo.com/v3/business_data/social_media/pinterest/live/) | live | n/a | active, docs only |
| GET | [`/v3/business_data/tasks_ready`](https://docs.dataforseo.com/v3/business_data/google/extended_reviews/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/business_data/tripadvisor/languages`](https://docs.dataforseo.com/v3/business_data/tripadvisor/languages/) | utility | free | active |
| GET | [`/v3/business_data/tripadvisor/locations`](https://docs.dataforseo.com/v3/business_data/tripadvisor/locations/) | utility | free | active |
| GET | [`/v3/business_data/tripadvisor/locations/{country}`](https://docs.dataforseo.com/v3/business_data/tripadvisor/locations/) | utility | free | active |
| GET | [`/v3/business_data/tripadvisor/reviews/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/tripadvisor/reviews/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/tripadvisor/reviews/task_post`](https://docs.dataforseo.com/v3/business_data/tripadvisor/reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/tripadvisor/reviews/tasks_ready`](https://docs.dataforseo.com/v3/business_data/tripadvisor/reviews/tasks_ready/) | tasks_ready | free | active |
| GET | [`/v3/business_data/tripadvisor/search/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/tripadvisor/search/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/tripadvisor/search/task_post`](https://docs.dataforseo.com/v3/business_data/tripadvisor/search/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/tripadvisor/search/tasks_ready`](https://docs.dataforseo.com/v3/business_data/tripadvisor/search/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/business_data/trustpilot/reviews/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/trustpilot/reviews/task_post`](https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/trustpilot/reviews/tasks_ready`](https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/tasks_ready) | tasks_ready | free | active |
| GET | [`/v3/business_data/trustpilot/search/task_get/{id}`](https://docs.dataforseo.com/v3/business_data/trustpilot/search/task_get/) | task_get | free | active |
| POST | [`/v3/business_data/trustpilot/search/task_post`](https://docs.dataforseo.com/v3/business_data/trustpilot/search/task_post/) | task_post | $0.00075 per_block | active |
| GET | [`/v3/business_data/trustpilot/search/tasks_ready`](https://docs.dataforseo.com/v3/business_data/trustpilot/search/tasks_ready) | tasks_ready | free | active |

### Appendix (4)

| Method | Path | Mode | Price (default tier) | Status |
|---|---|---|---|---|
| GET | [`/v3/appendix/errors`](https://docs.dataforseo.com/v3/appendix/errors) | utility | free | active |
| GET | [`/v3/appendix/status`](https://docs.dataforseo.com/v3/appendix/status/) | utility | free | active |
| GET | [`/v3/appendix/user_data`](https://docs.dataforseo.com/v3/appendix/user_data/) | utility | free | active |
| POST | [`/v3/appendix/webhook_resend`](https://docs.dataforseo.com/v3/appendix/webhook_resend/) | utility | free | active |
