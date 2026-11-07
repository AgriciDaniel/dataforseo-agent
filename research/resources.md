# Official freshness sources

Checked 2026-11-06. Everything here is official DataForSEO (or its official GitHub and npm), free to read, and
needs no paid call. Use them to check whether the catalog, prices or the Brain have drifted.

## Machine-readable (best for the agent)

| What | URL | Notes |
|---|---|---|
| API updates feed (RSS) | https://dataforseo.com/feed?post_type=update | Product changes, new fields, limits. Newest item 2026-11-04. `https://dataforseo.com/updates/feed` is the comments feed, not this one. |
| Docs index for LLMs | https://docs.dataforseo.com/v3/llms.txt | Every docs page (617 today) with a one-line summary. Each page also has a `.md` version: add `.md` to the page path. |
| Docs sitemap | https://docs.dataforseo.com/v3/wp-sitemap-posts-page-1.xml | All docs pages with last-modified dates (index: `wp-sitemap.xml`). |
| OpenAPI spec | https://github.com/dataforseo/OpenApiDocumentation (branch `master`, file `openapi_specification.yaml`) | Source of `endpoints.json`. Commit feed: https://github.com/dataforseo/OpenApiDocumentation/commits/master.atom |
| MCP server releases | https://github.com/dataforseo/mcp-server-typescript/releases.atom | Release feed for the official MCP server. |
| MCP package version | https://registry.npmjs.org/dataforseo-mcp-server/latest | JSON; `version` field. 3.1.3 today. |
| API status (endpoint) | `GET https://api.dataforseo.com/v3/appendix/status` | Free, at most 10 requests per minute; per-API status and issue descriptions. |
| Error codes (endpoint) | `GET https://api.dataforseo.com/v3/appendix/errors` | Free; same table as `status-codes.json`. |
| Account prices and limits | `GET https://api.dataforseo.com/v3/appendix/user_data` | Free; the account's own prices (base cost only), rates, limits and balance. |

## Human pages

| What | URL |
|---|---|
| Updates (announcements by API) | https://dataforseo.com/updates (categories such as https://dataforseo.com/updates/category/announcement) |
| Status page | https://status.dataforseo.com/ (a JavaScript app with no RSS or JSON; use the status endpoint above) |
| Pricing hub | https://dataforseo.com/pricing (per-API pages under `/pricing/...`; parsed into `endpoints.json` prices) |
| Docs home | https://docs.dataforseo.com/v3/ |
| Help center | https://dataforseo.com/help-center |
| Blog (RSS) | https://dataforseo.com/feed (tutorials and use cases, not change notices) |

## Recent official updates (from the feed, 2026-11-06)

| Date | Update |
|---|---|
| 2026-11-04 | AI Overview element references now in Yahoo SERP API |
| 2026-11-02 | Google's new GoTo URL limits and how this affects results |
| 2026-10-30 | Search results in ChatGPT, Claude and Perplexity LLM Responses API |
| 2026-10-29 | Naver SERP API default depth increased to 20 |
| 2026-10-22 | Code snippets in the Google AI Mode SERP API |
| 2026-10-20 | New fields for shopping elements in Google AI Mode SERP API |
| 2026-10-19 | Default API rate limit increased to 10,000 requests per minute |
| 2026-10-15 | New fields for Popular Products and Hotel Packs in Google SERP API |
| 2026-10-08 | New snippet field in Google Shopping results |
| 2026-10-06 | Organic result checks in Google SERPs |

## Suggested freshness routine

1. Read the updates feed; anything newer than the catalog date (`checked` in `endpoints.json`) is a candidate change.
2. Compare the OpenAPI commit feed and the npm `latest` version with the versions in `sources.json`.
3. Before quoting a price, prefer the catalog; if the catalog is older than 30 days, check the matching pricing page.
4. When a call fails oddly, check `GET /v3/appendix/status` before retrying.
