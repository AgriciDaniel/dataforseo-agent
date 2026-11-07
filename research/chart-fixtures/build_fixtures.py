"""Build chart fixtures from real responses. Run: python3 -I build_fixtures.py  (from this folder)
Values are read from response files; nothing is typed by hand except titles."""
import json, os, glob, collections

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, '../../Brain/.raw/sources/dataforseo-research'))
SRC = os.path.join(HERE, 'sources')


def rel(p):
    return os.path.relpath(p, os.path.normpath(os.path.join(HERE, '../..')))


def load(p):
    return json.load(open(p))


def result(p):
    return load(p)['tasks'][0]['result'][0]


def cost(p):
    return load(p)['tasks'][0].get('cost')


def ep_for(path):
    b = os.path.basename(path)[:-5]
    if b.startswith('sandbox-'):
        return 'POST ' + load(path)['_fixture']['path']
    mod = os.path.basename(os.path.dirname(os.path.dirname(path)))
    if mod == 'labs':
        se, _, rest = b.partition('-')
        return f'POST /v3/dataforseo_labs/{se}/{rest.replace("-", "_")}/live'
    return None


def raw(name):
    return os.path.join(RAW, name)


def sbx(name):
    return os.path.join(SRC, f'sandbox-{name}.json')


out = []


# series where a fall is good (renderer colours a decrease green); matches the workflows' Visuals notes
LOWER = {'position', 'rank_group', 'is_lost', 'lost_backlinks', 'lost_referring_domains', 'broken_backlinks',
         'backlinks_spam_score', 'keyword_difficulty'}


def case(name, workflow, endpoint, source, spec, expect='valid', notes=''):
    for se in spec.get('series', []):
        if se.get('name') in LOWER:
            se['lower_is_better'] = True
    if spec.get('type') == 'heatmap' and spec.get('unit') == 'position':
        spec['lower_is_better'] = True
    srcs = source if isinstance(source, list) else [source]
    out.append({'case': name, 'workflow': workflow, 'endpoint': endpoint,
                'source': [rel(s) for s in srcs] if len(srcs) > 1 else rel(srcs[0]),
                'source_cost_usd': [cost(s) for s in srcs] if len(srcs) > 1 else cost(srcs[0]),
                'expect': expect, 'notes': notes, 'spec': spec})


# keyword pool across real Labs fixtures plus two sandbox Labs responses
POOL_FILES = sorted(glob.glob(raw('labs/fixtures/*.json'))) + [sbx('S1-keyword-ideas'), sbx('S5-ranked-keywords')]
pool = {}


def walk(x, src):
    if isinstance(x, dict):
        kw, ki, kp = x.get('keyword'), x.get('keyword_info') or {}, x.get('keyword_properties') or {}
        if kw and isinstance(ki, dict) and ki.get('search_volume') is not None and kw not in pool:
            pool[kw] = {'kw': kw, 'sv': ki['search_volume'], 'kd': kp.get('keyword_difficulty'),
                        'ms': ki.get('monthly_searches'), 'cpc': ki.get('cpc'), 'src': src}
        for v in x.values():
            walk(v, src)
    elif isinstance(x, list):
        for v in x:
            walk(v, src)


for f in POOL_FILES:
    walk(load(f), f)
pool_files_used = sorted({p['src'] for p in pool.values()})


def months12(ms):
    ms = sorted(ms, key=lambda m: (m['year'], m['month']))[-12:]
    return [f"{m['year']}-{m['month']:02d}" for m in ms], [m['search_volume'] for m in ms]


# ---------------- table ----------------
rk = [raw('labs/fixtures/google-ranked-keywords.json'), sbx('S5-ranked-keywords')]
rows = []
for f in rk:
    for it in result(f)['items']:
        kd, se = it['keyword_data'], it['ranked_serp_element']['serp_item']
        rows.append((kd['keyword'], se.get('rank_group'), kd['keyword_info'].get('search_volume'), kd['keyword_info'].get('cpc'),
                     (kd.get('keyword_properties') or {}).get('keyword_difficulty'), se.get('etv'),
                     ((kd.get('search_intent_info') or {}).get('main_intent')), se.get('url')))
cols = ['position', 'search_volume', 'cpc', 'keyword_difficulty', 'etv', 'main_intent', 'url']
case('table-ranked-keywords-8-columns-long-urls', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/ranked_keywords/live', rk,
     {'type': 'table', 'title': 'Keywords dataforseo.com ranks for', 'subtitle': 'Google US, Labs ranked keywords',
      'x': [r[0] for r in rows], 'series': [{'name': c, 'values': [r[i + 1] for r in rows]} for i, c in enumerate(cols)],
      'unit': None, 'sort': 'asc:position', 'limit': 25},
     notes='8 columns (keyword plus 7). URLs are long; cpc and keyword_difficulty contain nulls; mixed string and number columns.')

org = raw('serp/fixtures/google-organic.json')
items = result(org)['items']
case('table-serp-snapshot-mixed-types', 'serp-snapshot', 'POST /v3/serp/google/organic/live/advanced', org,
     {'type': 'table', 'title': 'SERP snapshot', 'subtitle': f"\"{result(org)['keyword']}\", Google US",
      'x': [str(i.get('rank_absolute')) for i in items],
      'series': [{'name': 'type', 'values': [i.get('type') for i in items]},
                 {'name': 'rank_group', 'values': [i.get('rank_group') for i in items]},
                 {'name': 'domain', 'values': [i.get('domain') for i in items]},
                 {'name': 'title', 'values': [i.get('title') for i in items]},
                 {'name': 'url', 'values': [i.get('url') for i in items]}],
      'unit': None, 'sort': 'none', 'limit': 25},
     notes='Non-organic elements have null domain, title or url; x is rank_absolute as text.')

# ---------------- sparkline inside table ----------------
spark = [p for p in pool.values() if p['ms'] and len(p['ms']) >= 12]
spark.sort(key=lambda p: -p['sv'])
pick = spark[:9] + [p for p in spark if len(set(months12(p['ms'])[1])) <= 3][:1]
case('sparkline-table-keyword-trends', 'keyword-research', 'POST /v3/dataforseo_labs/google/keyword_ideas/live (and other Labs keyword endpoints)',
     sorted({p['src'] for p in pick}),
     {'type': 'table', 'title': 'Keyword demand, last 12 months', 'subtitle': 'Labs keyword_info.monthly_searches',
      'x': [p['kw'] for p in pick],
      'series': [{'name': 'search_volume', 'values': [p['sv'] for p in pick]},
                 {'name': 'trend', 'values': [months12(p['ms'])[1] for p in pick]}],
      'unit': 'searches', 'sort': 'desc:search_volume', 'limit': 10},
     notes='The trend column holds arrays of 12 numbers: render as a sparkline. The last row is nearly flat (few distinct values); volumes span several orders of magnitude.')

rkpick = []
for f in rk:
    for it in result(f)['items']:
        ki = it['keyword_data']['keyword_info']
        if ki.get('monthly_searches'):
            rkpick.append((it['keyword_data']['keyword'], it['ranked_serp_element']['serp_item'].get('rank_group'), months12(ki['monthly_searches'])[1]))
case('sparkline-table-zeros-in-series', 'rank-tracking', 'POST /v3/dataforseo_labs/google/ranked_keywords/live', rk,
     {'type': 'table', 'title': 'Ranked keywords with demand trend', 'subtitle': 'zeros inside the series',
      'x': [r[0] for r in rkpick],
      'series': [{'name': 'position', 'values': [r[1] for r in rkpick]}, {'name': 'trend', 'values': [r[2] for r in rkpick]}],
      'unit': None, 'sort': 'asc:position', 'limit': 10},
     notes='Some trend arrays contain 0 months; the sparkline must not divide by zero or drop the point.')

# ---------------- kpi ----------------
bs = sbx('S8-backlinks-summary')
r = result(bs)
case('kpi-backlinks-summary-no-previous', 'backlink-audit', 'POST /v3/backlinks/summary/live', bs,
     {'type': 'kpi', 'title': f"Backlink profile: {r['target']}", 'subtitle': 'current values only',
      'x': [], 'series': [{'name': k, 'values': [r[k]]} for k in ['backlinks', 'referring_domains', 'referring_main_domains', 'rank', 'broken_backlinks', 'backlinks_spam_score']],
      'unit': None, 'sort': 'none', 'limit': 6},
     notes='No previous values: render without deltas. Values range from 16 to 289221.')

hro = sbx('S9-historical-rank-overview')
hi = sorted(result(hro)['items'], key=lambda i: (i['year'], i['month']))
cur, prev = hi[-1]['metrics']['organic'], hi[-2]['metrics']['organic']
case('kpi-rank-overview-with-previous', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/historical_rank_overview/live', hro,
     {'type': 'kpi', 'title': 'Organic visibility, month over month',
      'subtitle': f"{hi[-1]['year']}-{hi[-1]['month']:02d} vs {hi[-2]['year']}-{hi[-2]['month']:02d}",
      'x': [], 'series': [{'name': k, 'values': [cur[k], prev[k]]} for k in ['count', 'etv', 'pos_1', 'is_new', 'is_lost']],
      'unit': None, 'sort': 'none', 'limit': 5},
     notes='values = [current, previous]; etv is a float; some metrics go down (render negative deltas).')

# ---------------- hbar ----------------
mp = sbx('S4-google-maps')
mi = [i for i in result(mp)['items'] if (i.get('rating') or {}).get('votes_count') is not None]
mi.sort(key=lambda i: -i['rating']['votes_count'])
mi = mi[:25]
case('hbar-25-long-business-names', 'local-seo-tracking', 'POST /v3/serp/google/maps/live/advanced', mp,
     {'type': 'hbar', 'title': 'Most reviewed places for "pizza"', 'subtitle': 'Google Maps, review count',
      'x': [i['title'] for i in mi], 'series': [{'name': 'votes_count', 'values': [i['rating']['votes_count'] for i in mi]}],
      'unit': 'reviews', 'sort': 'desc', 'limit': 25},
     notes=f'25 bars; labels up to {max(len(i["title"]) for i in mi)} characters; must truncate labels, not wrap.')

top = sorted(pool.values(), key=lambda p: -p['sv'])[:25]
case('hbar-25-keywords-wide-range', 'keyword-research', 'POST /v3/dataforseo_labs/google/keyword_ideas/live (and other Labs keyword endpoints)',
     sorted({p['src'] for p in top}),
     {'type': 'hbar', 'title': 'Top 25 keywords by search volume', 'subtitle': 'pooled Labs responses',
      'x': [p['kw'] for p in top], 'series': [{'name': 'search_volume', 'values': [p['sv'] for p in top]}],
      'unit': 'searches', 'sort': 'desc', 'limit': 25},
     notes='The largest value is many times the smallest: tiny bars must still show at least one cell.')

# ---------------- grouped-bar ----------------
comp = [raw('labs/fixtures/google-competitors-domain.json'), sbx('S6-competitors-domain')]
ci = [it for f in comp for it in result(f)['items']]
case('grouped-bar-competitor-position-buckets', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/competitors_domain/live', comp,
     {'type': 'grouped-bar', 'title': 'Top-10 footprint by competitor', 'subtitle': 'organic keywords by position bucket',
      'x': [it['domain'] for it in ci],
      'series': [{'name': b, 'values': [it['metrics']['organic'][b] for it in ci]} for b in ['pos_1', 'pos_2_3', 'pos_4_10']],
      'unit': 'keywords', 'sort': 'none', 'limit': 10},
     notes='3 series; several sandbox competitors are 0 in every series (zero-height groups).')

case('grouped-bar-monthly-buckets', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/historical_rank_overview/live', hro,
     {'type': 'grouped-bar', 'title': 'Position buckets per month', 'subtitle': 'one domain over time',
      'x': [f"{i['year']}-{i['month']:02d}" for i in hi],
      'series': [{'name': b, 'values': [i['metrics']['organic'][b] for i in hi]} for b in ['pos_1', 'pos_2_3', 'pos_4_10']],
      'unit': 'keywords', 'sort': 'none', 'limit': 12},
     notes='Date order on x; pos_4_10 dwarfs pos_1.')

# ---------------- share-bar ----------------
tc = collections.Counter(i['type'] for i in items)
case('share-bar-serp-features-7-parts', 'serp-snapshot', 'POST /v3/serp/google/organic/live/advanced', org,
     {'type': 'share-bar', 'title': 'SERP composition', 'subtitle': f"\"{result(org)['keyword']}\" (element count)",
      'x': list(tc.keys()), 'series': [{'name': 'elements', 'values': list(tc.values())}],
      'unit': 'elements', 'sort': 'desc', 'limit': 7},
     notes='7 parts: one large (organic) and six of size 1 (about 7 percent each); tiny parts need a legend entry even when too narrow to label.')

r3 = result(sbx('S3-google-organic'))
tc3 = collections.Counter(i['type'] for i in r3['items'])
case('share-bar-serp-features-local', 'serp-snapshot', 'POST /v3/serp/google/organic/live/advanced', sbx('S3-google-organic'),
     {'type': 'share-bar', 'title': 'SERP composition', 'subtitle': 'local intent SERP (sandbox)',
      'x': list(tc3.keys()), 'series': [{'name': 'elements', 'values': list(tc3.values())}],
      'unit': 'elements', 'sort': 'desc', 'limit': 7},
     notes='5 parts; sorted descending by the renderer.')

# ---------------- diverging-bar ----------------
ts = sbx('S2-timeseries-new-lost')
ti = sorted(result(ts)['items'], key=lambda i: i['date'])[-30:]
case('diverging-bar-new-lost-backlinks-30-days', 'new-lost-links-monitor', 'POST /v3/backlinks/timeseries_new_lost_summary/live', ts,
     {'type': 'diverging-bar', 'title': 'New vs lost backlinks per day', 'subtitle': '30 days (sandbox dates)',
      'x': [i['date'][:10] for i in ti],
      'series': [{'name': 'new_backlinks', 'values': [i['new_backlinks'] for i in ti]},
                 {'name': 'lost_backlinks', 'values': [i['lost_backlinks'] for i in ti]}],
      'unit': 'backlinks', 'sort': 'none', 'limit': 30},
     notes='First series goes up, second goes down; date order. Sandbox returns 2021 dates whatever the request.')

case('diverging-bar-new-lost-keywords-monthly', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/historical_rank_overview/live', hro,
     {'type': 'diverging-bar', 'title': 'New vs lost ranking keywords', 'subtitle': 'per month',
      'x': [f"{i['year']}-{i['month']:02d}" for i in hi],
      'series': [{'name': 'is_new', 'values': [i['metrics']['organic']['is_new'] for i in hi]},
                 {'name': 'is_lost', 'values': [i['metrics']['organic']['is_lost'] for i in hi]}],
      'unit': 'keywords', 'sort': 'none', 'limit': 12},
     notes='Only 6 periods; values are large on both sides.')

# ---------------- line ----------------
one = max((p for p in pool.values() if p['ms'] and len(p['ms']) >= 12 and len(set(months12(p['ms'])[1])) > 6), key=lambda p: p['sv'])
lx, lv = months12(one['ms'])
case('line-monthly-searches-12', 'keyword-research', ep_for(one['src']), one['src'],
     {'type': 'line', 'title': f"Monthly searches: {one['kw']}", 'subtitle': 'last 12 months',
      'x': lx, 'series': [{'name': one['kw'], 'values': lv}], 'unit': 'searches', 'sort': 'none', 'limit': 12},
     notes='12 points in month order (the API returns newest first; the fixture is already sorted oldest first).')

three = [p for p in sorted(pool.values(), key=lambda p: -p['sv']) if p['ms'] and len(p['ms']) >= 12][3:6]
x3 = months12(three[0]['ms'])[0]
case('line-monthly-searches-3-series', 'keyword-research', 'POST /v3/dataforseo_labs/google/keyword_ideas/live (and other Labs keyword endpoints)',
     sorted({p['src'] for p in three}),
     {'type': 'line', 'title': 'Monthly searches, 3 keywords', 'subtitle': 'last 12 months',
      'x': x3, 'series': [{'name': p['kw'], 'values': months12(p['ms'])[1]} for p in three],
      'unit': 'searches', 'sort': 'none', 'limit': 12},
     notes='3 series on one axis with different magnitudes; needs a legend.')

tr = sbx('S7-google-trends-explore')
td = result(tr)['items'][0]['data']
case('line-trends-weekly', 'trends-research', 'POST /v3/keywords_data/google_trends/explore/live', tr,
     {'type': 'line', 'title': f"Google Trends interest: {result(tr)['items'][0]['keywords'][0]}", 'subtitle': 'weekly, 0 to 100',
      'x': [d['date_from'] for d in td], 'series': [{'name': 'interest', 'values': [d['values'][0] for d in td]}],
      'unit': 'index', 'sort': 'none', 'limit': 60},
     notes=f'{len(td)} weekly points: more points than columns at narrow widths, so the renderer must downsample.')

# ---------------- scatter ----------------
pts = [p for p in pool.values() if p['kd'] is not None]
case('scatter-difficulty-vs-volume', 'keyword-research', 'POST /v3/dataforseo_labs/google/keyword_ideas/live (and other Labs keyword endpoints)',
     sorted({p['src'] for p in pts}),
     {'type': 'scatter', 'title': 'Keyword difficulty vs search volume', 'subtitle': f'{len(pts)} keywords, pooled Labs responses',
      'x': [p['kw'] for p in pts], 'x_label': 'search_volume (log)', 'y_label': 'keyword_difficulty',
      'series': [{'name': 'keywords', 'values': [[p['sv'], p['kd']] for p in pts]}],
      'unit': None, 'sort': 'none', 'limit': 100},
     notes=f'{len(pts)} real points (every pooled keyword with both fields; 40 were asked for, the fixtures hold {len(pts)}). Volume spans 10 to 226000000: use a log x axis.')

sp = [i for i in result(mp)['items'] if (i.get('rating') or {}).get('value') is not None]
case('scatter-rating-vs-reviews', 'local-seo-tracking', 'POST /v3/serp/google/maps/live/advanced', mp,
     {'type': 'scatter', 'title': 'Rating vs review count', 'subtitle': 'Google Maps "pizza"',
      'x': [i['title'] for i in sp], 'x_label': 'votes_count (log)', 'y_label': 'rating',
      'series': [{'name': 'places', 'values': [[i['rating']['votes_count'], i['rating']['value']] for i in sp]}],
      'unit': None, 'sort': 'none', 'limit': 120},
     notes=f'{len(sp)} points; y is bunched between about 3.5 and 5; many overlapping points.')

# ---------------- heatmap ----------------
geo = [i for i in result(mp)['items'] if i.get('latitude') is not None and i.get('longitude') is not None]
la0, la1 = min(i['latitude'] for i in geo), max(i['latitude'] for i in geo)
lo0, lo1 = min(i['longitude'] for i in geo), max(i['longitude'] for i in geo)
N = 7
grid = [[None] * N for _ in range(N)]
for i in geo:
    r_ = min(N - 1, int((la1 - i['latitude']) / (la1 - la0) * N))
    c_ = min(N - 1, int((i['longitude'] - lo0) / (lo1 - lo0) * N))
    v = i.get('rank_group')
    grid[r_][c_] = v if grid[r_][c_] is None else min(grid[r_][c_], v)
nulls = sum(1 for row in grid for v in row if v is None)
case('heatmap-7x7-local-grid-with-nulls', 'local-seo-tracking', 'POST /v3/serp/google/maps/live/advanced', mp,
     {'type': 'heatmap', 'title': 'Best map position by area', 'subtitle': '7 x 7 grid, north at top, lower is better',
      'rows': [f'r{k + 1}' for k in range(N)], 'cols': [f'c{k + 1}' for k in range(N)], 'values': grid,
      'x': [], 'series': [], 'unit': 'position', 'sort': 'asc', 'limit': 49},
     notes=f'Built from one Maps response: listings binned by latitude and longitude into 7 x 7 cells, cell = best rank_group in that cell, null = no listing ({nulls} null cells). A live local grid would instead run one request per grid point (see the local-seo-tracking workflow); the shape and nulls are what matter here. Lower is better: invert the colour scale.')

cats = sbx('S9-historical-rank-overview')
bk = ['pos_1', 'pos_2_3', 'pos_4_10', 'pos_11_20', 'pos_21_30', 'pos_31_40', 'pos_41_50']
case('heatmap-months-by-position-bucket', 'competitor-gap-analysis', 'POST /v3/dataforseo_labs/google/historical_rank_overview/live', hro,
     {'type': 'heatmap', 'title': 'Keywords per position bucket per month', 'subtitle': 'no nulls',
      'rows': [f"{i['year']}-{i['month']:02d}" for i in hi], 'cols': bk,
      'values': [[i['metrics']['organic'][b] for b in bk] for i in hi],
      'x': [], 'series': [], 'unit': 'keywords', 'sort': 'none', 'limit': 49},
     notes='6 x 7, all numeric; higher is more.')

# ---------------- bad specs ----------------
case('bad-line-fewer-than-3-points', 'keyword-research', ep_for(one['src']), one['src'],
     {'type': 'line', 'title': 'Monthly searches (too short)', 'subtitle': '2 points',
      'x': lx[-2:], 'series': [{'name': one['kw'], 'values': lv[-2:]}], 'unit': 'searches', 'sort': 'none', 'limit': 12},
     expect='error: fewer than 3 points (visuals.md: never chart fewer than 3 points; answer in prose)')
case('bad-hbar-mismatched-lengths', 'keyword-research', 'POST /v3/dataforseo_labs/google/keyword_ideas/live', sorted({p['src'] for p in top}),
     {'type': 'hbar', 'title': 'Top keywords (broken)', 'subtitle': 'x has 25 labels, series has 24 values',
      'x': [p['kw'] for p in top], 'series': [{'name': 'search_volume', 'values': [p['sv'] for p in top][:-1]}],
      'unit': 'searches', 'sort': 'desc', 'limit': 25},
     expect='error: series "search_volume" has 24 values but x has 25 labels')
case('bad-unknown-type-pie', 'serp-snapshot', 'POST /v3/serp/google/organic/live/advanced', org,
     {'type': 'pie', 'title': 'SERP composition as a pie', 'subtitle': 'unsupported type',
      'x': list(tc.keys()), 'series': [{'name': 'elements', 'values': list(tc.values())}], 'unit': 'elements', 'sort': 'desc', 'limit': 7},
     expect='error: unknown type "pie" (no pies; use share-bar)')

# write files
for f in glob.glob(os.path.join(HERE, '*.json')):
    os.remove(f)
for c in out:
    json.dump(c, open(os.path.join(HERE, c['case'] + '.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out), 'fixtures')
print(collections.Counter(c['spec']['type'] for c in out if c['expect'] == 'valid'))
