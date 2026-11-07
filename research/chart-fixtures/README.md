# Chart fixtures

One JSON file per case: `{ case, workflow, endpoint, source, spec }`, plus `expect` (`valid` or the validation error
the renderer should raise) and `notes`. The spec follows `Brain/wiki/platform/visuals.md`. Values are copied from
real response shapes, never retyped by hand:
- `Brain/.raw/sources/dataforseo-research/*/fixtures/*.json`: real production responses from 2026-06-26 (already paid for).
- `sources/sandbox-*.json`: free sandbox responses (`sandbox.dataforseo.com`, dummy values, production structure).

## Sandbox calls (listed before running, all free)

| # | Method and path | For |
|---|---|---|
| S1 | POST /v3/dataforseo_labs/google/keyword_ideas/live (limit 100) | hbar 25, scatter 40 |
| S2 | POST /v3/backlinks/timeseries_new_lost_summary/live (30 days, group_range day) | diverging-bar |
| S3 | POST /v3/serp/google/organic/live/advanced | share-bar of SERP features |
| S4 | POST /v3/serp/google/maps/live/advanced | heatmap response shape |
| S5 | POST /v3/dataforseo_labs/google/ranked_keywords/live (limit 50) | table, sparkline table |
| S6 | POST /v3/dataforseo_labs/google/competitors_domain/live (limit 20) | grouped-bar |
| S7 | POST /v3/keywords_data/google_trends/explore/live (3 keywords) | 3-series line |
| S8 | POST /v3/backlinks/summary/live | kpi |
| S9 | POST /v3/dataforseo_labs/google/historical_rank_overview/live | kpi with previous, line |

## Cases

| Case | Type | Workflow | Expect | Source |
|---|---|---|---|---|
| `bad-hbar-mismatched-lengths` | hbar | keyword-research | error | 7 files |
| `bad-line-fewer-than-3-points` | line | keyword-research | error | raw: labs/fixtures/google-keyword-ideas.json |
| `bad-unknown-type-pie` | pie | serp-snapshot | error | raw: serp/fixtures/google-organic.json |
| `diverging-bar-new-lost-backlinks-30-days` | diverging-bar | new-lost-links-monitor | valid | sources/sandbox-S2-timeseries-new-lost.json |
| `diverging-bar-new-lost-keywords-monthly` | diverging-bar | competitor-gap-analysis | valid | sources/sandbox-S9-historical-rank-overview.json |
| `grouped-bar-competitor-position-buckets` | grouped-bar | competitor-gap-analysis | valid | 2 files |
| `grouped-bar-monthly-buckets` | grouped-bar | competitor-gap-analysis | valid | sources/sandbox-S9-historical-rank-overview.json |
| `hbar-25-keywords-wide-range` | hbar | keyword-research | valid | 7 files |
| `hbar-25-long-business-names` | hbar | local-seo-tracking | valid | sources/sandbox-S4-google-maps.json |
| `heatmap-7x7-local-grid-with-nulls` | heatmap | local-seo-tracking | valid | sources/sandbox-S4-google-maps.json |
| `heatmap-months-by-position-bucket` | heatmap | competitor-gap-analysis | valid | sources/sandbox-S9-historical-rank-overview.json |
| `kpi-backlinks-summary-no-previous` | kpi | backlink-audit | valid | sources/sandbox-S8-backlinks-summary.json |
| `kpi-rank-overview-with-previous` | kpi | competitor-gap-analysis | valid | sources/sandbox-S9-historical-rank-overview.json |
| `line-monthly-searches-12` | line | keyword-research | valid | raw: labs/fixtures/google-keyword-ideas.json |
| `line-monthly-searches-3-series` | line | keyword-research | valid | 2 files |
| `line-trends-weekly` | line | trends-research | valid | sources/sandbox-S7-google-trends-explore.json |
| `scatter-difficulty-vs-volume` | scatter | keyword-research | valid | 9 files |
| `scatter-rating-vs-reviews` | scatter | local-seo-tracking | valid | sources/sandbox-S4-google-maps.json |
| `share-bar-serp-features-7-parts` | share-bar | serp-snapshot | valid | raw: serp/fixtures/google-organic.json |
| `share-bar-serp-features-local` | share-bar | serp-snapshot | valid | sources/sandbox-S3-google-organic.json |
| `sparkline-table-keyword-trends` | table | keyword-research | valid | 4 files |
| `sparkline-table-zeros-in-series` | table | rank-tracking | valid | 2 files |
| `table-ranked-keywords-8-columns-long-urls` | table | competitor-gap-analysis | valid | 2 files |
| `table-serp-snapshot-mixed-types` | table | serp-snapshot | valid | raw: serp/fixtures/google-organic.json |

Rebuild: `python3 -I build_fixtures.py` from this folder (reads the sources above; no API calls).
