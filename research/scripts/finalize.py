"""Convert raw catalog to the bridge contract and write research/ outputs.
args: scratch_dir research_dir
"""
import sys, json, re, collections
S, R = sys.argv[1], sys.argv[2]
raw = json.load(open(S + '/endpoints.json'))
brain_paths = [l.strip() for l in open(S + '/brain_paths.txt') if l.strip()]

MOD = {'serp': 'serp', 'keywords_data': 'keywords-data', 'dataforseo_labs': 'labs', 'backlinks': 'backlinks',
       'on_page': 'onpage', 'domain_analytics': 'domain-analytics', 'content_analysis': 'content-analysis',
       'business_data': 'business-data', 'merchant': 'merchant', 'app_data': 'app-data',
       'ai_optimization': 'ai-optimization', 'appendix': 'appendix'}
MODE = {'live': 'live', 'task_post': 'task_post', 'task_get': 'task_get', 'tasks_ready': 'tasks_ready',
        'utility': 'standard', 'tasks_fixed': 'other', 'task_result': 'other'}
KEY = ['target', 'targets', 'keyword', 'keywords', 'location_code', 'language_code', 'depth', 'limit', 'offset',
       'filters', 'order_by', 'device', 'os', 'se_type', 'item_types', 'include_subdomains', 'include_serp_info',
       'date_from', 'date_to', 'max_crawl_pages', 'calculate_rectangles', 'load_async_ai_overview',
       'people_also_ask_click_depth', 'priority', 'postback_url', 'pingback_url', 'tag', 'platform', 'model_name',
       'user_prompt', 'web_search', 'url', 'id', 'asin', 'app_id', 'mode', 'search_partners', 'sort_by']
GLOBAL_LIMITS = ('Account wide: up to 10000 API calls per minute (error 40202) and at most 30 simultaneous '
                 'requests (error 40209), per docs.dataforseo.com/v3/appendix/errors.')
EXCLUDED = [
    {'path': '/v3/merchant/amazon/reviews/task_post', 'method': 'POST', 'status': 'unavailable',
     'note': 'Docs page still resolves but says "This endpoint is temporarily unavailable"; absent from the OpenAPI spec and from the docs index (llms.txt).',
     'docs': 'https://docs.dataforseo.com/v3/merchant/amazon/reviews/task_post/'},
    {'path': '/v3/merchant/amazon/reviews/tasks_ready', 'method': 'GET', 'status': 'unavailable', 'note': 'see task_post', 'docs': None},
    {'path': '/v3/merchant/amazon/reviews/task_get/advanced/{id}', 'method': 'GET', 'status': 'unavailable', 'note': 'see task_post', 'docs': None},
    {'path': '/v3/content_generation/*', 'method': '*', 'status': 'discontinued',
     'note': 'Content Generation API: docs pages return 404, no OpenAPI paths, not in the docs index, https://dataforseo.com/apis/content-generation-api redirects to the Content Analysis page.',
     'docs': None},
    {'path': '/v3/merchant/google/product_spec/*', 'method': '*', 'status': 'removed',
     'note': 'Google Shopping Product Spec: docs pages return 404 and no OpenAPI paths.', 'docs': None},
] + [
    {'path': f'/v3/ai_optimization/llm_mentions/{old}/live', 'method': 'POST', 'status': 'legacy',
     'replaced_by': f'/v3/ai_optimization/llm_mentions/{new}/live',
     'note': 'Docs page titled "(Legacy)" says this endpoint has been replaced; absent from OpenAPI and the docs index. The deprecated v2 MCP server still calls it.',
     'docs': f'https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/{old}/live/'}
    for old, new in [('search', 'search_mentions'), ('aggregated_metrics', 'target_metrics'),
                     ('cross_aggregated_metrics', 'multi_target_metrics'), ('top_domains', 'top_mentioned_domains'),
                     ('top_pages', 'top_mentioned_pages')]
]
DATABASES = 'https://docs.dataforseo.com/v3/databases/overview/'


def unit_of(b):
    b = b.lower()
    for k, v in [('per task + per row', 'per_task_plus_per_row'), ('per task + per item', 'per_task_plus_per_item'),
                 ('per task + per keyword', 'per_task_plus_per_item'), ('per task + per domain', 'per_task_plus_per_item'),
                 ('per task + per returned item', 'per_task_plus_per_item'), ('per task + per 10', 'per_task_plus_per_block'),
                 ('per crawled page', 'per_page'), ('per serp', 'per_serp'), ('per result', 'per_result'),
                 ('per product', 'per_product'), ('per request', 'per_request'), ('per task', 'per_task'),
                 ('per url', 'per_request'), ('per hotel', 'per_result'), ('per business', 'per_result'),
                 ('per block', 'per_block'), ('reviews', 'per_block'), ('questions', 'per_block'), ('listings', 'per_block')]:
        if k in b:
            return v
    return 'other'


def norm_price(e):
    p = e['price']
    if p is None:
        if e['mode'] in ('task_get', 'tasks_ready', 'tasks_fixed', 'task_result'):
            return {'unit': 'free', 'usd': 0.0, 'note': 'not billed separately; cost is charged when the task is set (task_post) or the crawl runs'}
        return {'unit': None, 'usd': None, 'note': 'no published price found'}
    if p.get('free'):
        return {'unit': 'free', 'usd': 0.0, 'note': p['note']}
    tiers = p.get('tiers') or []
    if not tiers:
        return {'unit': None, 'usd': None, 'note': p.get('note'), 'source': p.get('source')}
    pref = 'Live mode' if e['mode'] == 'live' else 'Standard queue'
    t = next((x for x in tiers if x['mode'] == pref), tiers[0])
    nums = re.findall(r'\$([0-9.,]+)', t['price_usd'])
    usd = float(nums[0].replace(',', '')) if nums else None
    note = '; '.join(f"{x['mode']}: {x['price_usd']} {x['billing_unit']}".strip() for x in tiers)
    if len(nums) > 1:
        note = f"base {t['price_usd']} (usd = per-task part). " + note
    return {'unit': unit_of(t['billing_unit']), 'usd': usd, 'note': note, 'tiers': tiers, 'source': p.get('source')}


EX = json.load(open(S + '/examples.json'))
import os, glob


def docs_example(url):
    if not url:
        return None
    key = url.replace('https://docs.dataforseo.com/v3/', '').strip('/').replace('/', '__') + '.md'
    f = os.path.join(S, 'docs', key)
    if not os.path.exists(f):
        return None
    t = open(f, errors='replace').read()
    m = re.search(r"--data-raw '(\[.*?\])'", t, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def sibling_fields(path):
    base = re.sub(r'/\{[^}]+\}', '', path)
    cands = []
    if '/live/' in base:
        cands.append(base.replace('/live/', '/task_get/') + '/{id}')
    if '/task_get/' in base:
        cands.append(base.replace('/task_get/', '/live/'))
        cands.append(re.sub(r'/task_get/(advanced|html|regular)$', r'/task_get/advanced', base) + '/{id}')
    MANUAL = {  # from docs result tables, 2026-11-06
        '/v3/keywords_data/bing/keyword_suggestions_for_url': ['items[].keyword', 'items[].confidence_score'],
        '/v3/merchant/google/reviews': ['items_count', 'items[].type', 'items[].rank_absolute', 'items[].title',
                                        'items[].review_text', 'items[].rating', 'items[].author', 'items[].provided_by'],
        '/v3/business_data/social_media/pinterest': ['items[].type', 'items[].page_url', 'items[].pins_count'],
    }
    for k, v in MANUAL.items():
        if base.startswith(k):
            return v
    leaf = base.rsplit('/', 1)[-1]
    if leaf in ('locations', 'languages', 'tasks_ready'):
        cands.append('/v3/serp/google/' + leaf if leaf != 'languages' else '/v3/serp/google/languages')
        cands.append('/v3/serp/google/organic/tasks_ready')
    for c in cands:
        for m in ('POST', 'GET'):
            x = EX.get(f'{m} {c}')
            if x and x['response_key_fields']:
                return x['response_key_fields']
    return []


out_eps = []
for e in raw['endpoints']:
    params = e['params']
    req = [p['name'] for p in params if p['required'] is True]
    cond = [p['name'] for p in params if p['required'] == 'conditional']
    opt = [p['name'] for p in params if p['required'] is not True]
    key = [k for k in KEY if k in opt][:12] or opt[:8]
    status = e.get('status', 'active')
    if e['path'].startswith('/v3/serp/google/events/'):
        status = 'deprecated: The Events service has been deprecated by Google and is no longer available in DataForSEO SERP API (docs, Google Events overview)'
    lim = ' '.join(re.sub(r'\*+', '', x) for x in e['limits'])
    out_eps.append({
        'path': e['path'], 'method': e['method'], 'module': MOD[e['module']], 'mode': MODE[e['mode']],
        'mode_detail': e['mode'], 'purpose': e['purpose'],
        'params_required': req, 'params_conditional': cond, 'params_key': key,
        'limits': lim or None, 'price': norm_price(e), 'docs': e['docs_url'],
        'status': status, 'params': params, 'operation_id': e['operation_id'],
        'mcp_v2_tools': e['mcp_v2_tools'], 'sources': e['sources'],
        'docs_page_date': e['docs_page_date'], 'checked': e['date_checked'],
        **({'note': e['note']} if e.get('note') else {}),
    })
    x = EX.get(f"{e['method']} {e['path']}")
    if x:
        out_eps[-1].update(example=x['example'], example_official=x['example_official'],
                           example_source=x['example_source'], response_key_fields=x['response_key_fields'])
    else:
        dx = docs_example(e['docs_url']) if e['method'] == 'POST' else None
        out_eps[-1].update(example=dx[:1] if dx else None, example_official=dx,
                           example_source=('docs cURL example' if dx else ('GET, no body' if e['method'] == 'GET' else None)),
                           response_key_fields=['tasks[].id', 'tasks[].status_code', 'tasks[].cost'] if e['mode'] == 'task_post' else sibling_fields(e['path']))

sources = json.load(open(R + '/sources.json'))['sources'] if False else None
doc = {
    'checked': raw['generated'],
    'sources': [
        'https://github.com/dataforseo/OpenApiDocumentation (openapi_specification.yaml, commit 55a4ed09, 2026-10-26)',
        'https://docs.dataforseo.com/v3/llms.txt (617 docs pages, each fetched as .md on 2026-11-06)',
        'https://dataforseo.com/pricing (76 pricing pages, 154 unique price rows, fetched 2026-11-06)',
        'https://github.com/dataforseo/mcp-server-typescript-deprecated (v2 tool to endpoint map, commit a89b4aa9)',
        'see research/sources.json for the full dated list',
    ],
    'api_base': raw['api_base'], 'sandbox_base': raw['sandbox_base'],
    'global_limits': GLOBAL_LIMITS,
    'mode_legend': {
        'live': 'one POST returns results immediately; one task per call',
        'task_post': 'Standard method step 1: queue up to 100 tasks per call; this is where the task is billed (Standard or Priority queue)',
        'task_get': 'Standard method step 3: fetch a queued task result by id; not billed separately',
        'tasks_ready': 'Standard method step 2: list completed, uncollected task ids; free; usually 20 calls per minute',
        'standard': 'reference or account endpoints (locations, languages, categories, filters, models, id_list, errors, status, user_data); mostly free',
        'other': 'see mode_detail: tasks_fixed (re-parsed SERP tasks) or task_result (OnPage crawl results read after task_post)',
    },
    'price_note': 'usd is the per-call or per-unit base for the default tier (Live for live, Standard queue for task_post). For two-part prices (task + row/item) usd is the task part; the row/item part is in note and tiers. Extra-charge parameters (for example calculate_rectangles, load_async_ai_overview, search operators x5) are in each docs page, not here.',
    'modules_without_endpoints': {
        'databases': {'note': 'Bulk data products delivered as files, not API endpoints.', 'docs': DATABASES},
        'content-generation': {'note': 'Discontinued; see excluded.', 'docs': None},
    },
    'generic_patterns': raw['generic_patterns'],
    'excluded': EXCLUDED,
    'counts': {},
    'endpoints': out_eps,
}
try:
    SB = {(r['method'], r['path']): r for r in json.load(open(S + '/sandbox_results.json'))}
except FileNotFoundError:
    SB = {}
for e in out_eps:
    r = SB.get((e['method'], e['path']))
    if r:
        e['sandbox_verified'] = {'date': '2026-11-06', 'pass': r.get('pass'), 'task_status_code': r.get('task_status_code')}
c = collections.Counter(e['module'] for e in out_eps)
doc['counts'] = {'total': len(out_eps), 'active': sum(1 for e in out_eps if e['status'] == 'active'),
                 'from_openapi': sum(1 for e in out_eps if 'openapi' in e['sources']),
                 'docs_only': sum(1 for e in out_eps if e['sources'] == ['docs']),
                 'by_module': dict(c), 'by_mode': dict(collections.Counter(e['mode'] for e in out_eps)),
                 'by_mode_detail': dict(collections.Counter(e['mode_detail'] for e in out_eps))}
json.dump(doc, open(R + '/endpoints.json', 'w'), indent=1, ensure_ascii=False)

# Brain diff on cited paths
cat = set()
for e in out_eps:
    cat.add(re.sub(r'/\{[^}]+\}', '', e['path']))
stale = []
for bp in brain_paths:
    b = bp.rstrip('/')
    if b in cat or any(x.startswith(b + '/') for x in cat):
        continue
    if '*' in b or b.count('/') < 3:
        continue
    stale.append(b)
json.dump({'brain_cited_paths': len(brain_paths), 'not_in_catalog': stale}, open(S + '/brain_diff.json', 'w'), indent=1)
print(json.dumps(doc['counts'], indent=1))
print('brain paths', len(brain_paths), 'not in catalog', len(stale))
for s in stale:
    print('  ', s)
