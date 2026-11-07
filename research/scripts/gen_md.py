import sys, json, collections
S, R = sys.argv[1], sys.argv[2]
d = json.load(open(R + '/endpoints.json'))
bd = json.load(open(S + '/brain_diff.json'))
eps = d['endpoints']
NAMES = {'serp': 'SERP API', 'ai-optimization': 'AI Optimization API', 'keywords-data': 'Keywords Data API',
         'labs': 'DataForSEO Labs API', 'backlinks': 'Backlinks API', 'onpage': 'OnPage API',
         'domain-analytics': 'Domain Analytics API', 'content-analysis': 'Content Analysis API',
         'merchant': 'Merchant API', 'app-data': 'App Data API', 'business-data': 'Business Data API',
         'appendix': 'Appendix'}
L = []
w = L.append
c = d['counts']
w('# DataForSEO v3 endpoint index')
w('')
w(f"Checked {d['checked']}. Machine-readable twin: `endpoints.json`. Sources: `sources.json`.")
w('')
w(f"**{c['total']} endpoints** (method plus path) across **12 API namespaces** (11 data APIs plus Appendix). "
  f"{c['from_openapi']} come from the official OpenAPI spec; {c['docs_only']} are documented on docs.dataforseo.com "
  f"but missing from the spec. {c['total'] - c['active']} are deprecated (Google Events). "
  f"Databases is a file product with no endpoints, and Content Generation is discontinued.")
w('')
w('## Counts by module')
w('')
modes = ['live', 'task_post', 'task_get', 'tasks_ready', 'standard', 'other']
w('| Module | Total | ' + ' | '.join(modes) + ' |')
w('|---|---:|' + '---:|' * len(modes))
bym = collections.defaultdict(collections.Counter)
for e in eps:
    bym[e['module']][e['mode']] += 1
for m in NAMES:
    w(f"| {NAMES[m]} (`{m}`) | {sum(bym[m].values())} | " + ' | '.join(str(bym[m][x]) for x in modes) + ' |')
w(f"| **Total** | **{c['total']}** | " + ' | '.join(f"**{c['by_mode'].get(x, 0)}**" for x in modes) + ' |')
w('')
w('Mode legend: `standard` here means reference or account endpoints (locations, languages, filters, models, id_list, errors, status, user_data), '
  'not the DataForSEO "Standard method" queue, which is the `task_post` / `tasks_ready` / `task_get` trio. '
  '`other` is `tasks_fixed` (re-parsed SERP tasks) or OnPage `task_result` (reading crawl results); see `mode_detail`.')
w('')
w(d['global_limits'])
w('')
w('## Diff against the existing DataForSEO Brain')
w('')
w('The Brain (`~/Desktop/Vaults/DataForSEO Brain/wiki`, read only) says "12 modules, ~200+ endpoints", live-verified 2026-06-26.')
w('')
w('| Brain claim | Current fact (2026-11-06) |')
w('|---|---|')
w(f"| ~200+ endpoints | {c['total']} method plus path endpoints ({c['by_mode']['live']} live, {c['by_mode']['task_post']} task_post). The Brain scrape covered 185 docs pages; the docs index now has 617 pages. |")
w('| 12 modules including Databases | 11 data APIs plus Appendix have endpoints. Databases is listed in the docs index but is a bulk file product with no API endpoints. |')
w('| Content Generation (lead brief listed it) | Discontinued: docs 404, no OpenAPI paths, product URL redirects to Content Analysis. The Brain does not cover it either. |')
w('| Official MCP = 10 modules, ENABLED_MODULES, v2.9.9 | The v2 server is deprecated. The current server is v3 (npm `dataforseo-mcp-server` 3.1.3), with 4 generic tools and no module flags. See `mcp.md`. |')
w('| Prices (2026-06-26 snapshot) | Many rose about 20 percent: Backlinks $0.02 to $0.024 per request, Labs $0.01 to $0.012 per task. SERP Google Organic is unchanged ($0.0006 / $0.0012 / $0.002). See `brain-facts.md`. |')
w('')
w(f"Of the {bd['brain_cited_paths']} distinct `/v3/...` strings cited in the Brain, these real endpoint paths are not current:")
w('')
w('| Brain path | Status now |')
w('|---|---|')
ex = {x['path']: x for x in d['excluded']}
for p in bd['not_in_catalog']:
    if p.endswith('/overview') or p.endswith('/live') and p.count('/') <= 4 or '{' in p or p in ('/v3/ai_optimization/llm_responses', '/v3/ai_optimization/llm_scraper', '/v3/appendix/sandbox', '/v3/databases/overview'):
        continue
    x = ex.get(p)
    if x:
        st = x['status'] + (f", replaced by `{x['replaced_by']}`" if x.get('replaced_by') else '')
    elif p.startswith('/v3/merchant/google/product_spec'):
        st = 'removed (docs 404, not in OpenAPI)'
    elif p == '/v3/merchant/google/products/live/advanced':
        st = 'never existed: Google Shopping products has no live mode (task_post only)'
    else:
        st = 'not found'
    w(f'| `{p}` | {st} |')
w('')
w('Not counted above: docs overview pages, wildcard shorthand such as `/v3/backlinks/bulk_{metric}/live`, and `appendix/sandbox`, which is a docs page, not an endpoint.')
w('')
w('## Excluded (legacy, unavailable, removed)')
w('')
for x in d['excluded']:
    w(f"- `{x['method']} {x['path']}`: {x['status']}." + (f" Use `{x['replaced_by']}`." if x.get('replaced_by') else '') + f" {x['note']}")
w('')
w('## Endpoints by module')
for m in NAMES:
    rows = [e for e in eps if e['module'] == m]
    w('')
    w(f'### {NAMES[m]} ({len(rows)})')
    w('')
    w('| Method | Path | Mode | Price (default tier) | Status |')
    w('|---|---|---|---|---|')
    for e in rows:
        p = e['price']
        if p['unit'] == 'free':
            pr = 'free'
        elif p['usd'] is None:
            pr = 'n/a'
        else:
            pr = f"${p['usd']:g} {p['unit']}"
            if 'base' in (p.get('note') or ''):
                pr += ' + per item'
        st = 'active' if e['status'] == 'active' else 'deprecated'
        if e['sources'] == ['docs']:
            st += ', docs only'
        w(f"| {e['method']} | [`{e['path']}`]({e['docs']}) | {e['mode_detail']} | {pr} | {st} |")
open(R + '/endpoints.md', 'w').write('\n'.join(L) + '\n')
print(len(L))
