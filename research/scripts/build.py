"""Build DataForSEO v3 endpoint catalog from official sources.
args: scratch_dir out_json
"""
import sys, os, re, json, html, glob, collections
S = sys.argv[1]
sys.path.insert(0, S + '/scripts')
from load import load

CHECKED = '2026-11-06'
spec = load(S + '/dl/OpenApiDocumentation/openapi_specification.yaml')
schemas = spec['components']['schemas']
DOCS = S + '/docs'
pricing = json.load(open(S + '/pricing_uniq.json'))
v2 = json.load(open(S + '/v2tools.json'))
v2_extra = {'ai_optimization_chat_gpt_scraper_locations': '/v3/ai_optimization/chat_gpt/llm_scraper/locations',
            'merchant_amazon_locations': '/v3/merchant/amazon/locations',
            'on_page_lighthouse': '/v3/on_page/lighthouse/live/json'}

MODULES = {
    'serp': 'SERP API', 'ai_optimization': 'AI Optimization API', 'keywords_data': 'Keywords Data API',
    'dataforseo_labs': 'DataForSEO Labs API', 'backlinks': 'Backlinks API', 'on_page': 'OnPage API',
    'domain_analytics': 'Domain Analytics API', 'content_analysis': 'Content Analysis API',
    'merchant': 'Merchant API', 'app_data': 'App Data API', 'business_data': 'Business Data API',
    'appendix': 'Appendix',
}


def text(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    return re.sub(r'\s+', ' ', s.replace('‌', '').replace('​', '')).strip()


def first_sentence(s, n=220):
    s = text(s)
    sents = re.findall(r'.+?[.!?](?=\s|$)', s) or [s]
    good = [x.strip() for x in sents if not re.match(r'\s*(note|please note|if you|\*)', x.strip(), re.I)
            and not re.search(r'adwords|upgrade to', x, re.I)]
    if not good:
        return None
    s = good[0].strip()
    return s if len(s) <= n else s[:n - 3].rstrip() + '...'


def ref(o):
    if not isinstance(o, dict):
        return None
    if '$ref' in o:
        return schemas.get(o['$ref'].split('/')[-1])
    for k in ('oneOf', 'anyOf', 'allOf'):
        if k in o:
            for x in o[k]:
                r = ref(x)
                if r:
                    return r
    if 'items' in o:
        return ref(o['items'])
    return o if o.get('properties') else None


def param_info(name, sch):
    d = text(sch.get('description', ''))
    low = d.lower()
    if re.search(r'required field if|required if|required field when|required when|required field, if', low):
        req = 'conditional'
    elif 'required field' in low:
        req = True
    else:
        req = False
    p = {'name': name, 'type': sch.get('type') or ('object' if '$ref' in sch else None), 'required': req}
    m = re.search(r'default value:\s*([^\s;]+)', d, re.I)
    if m:
        p['default'] = m.group(1).strip('`.,')
    m = re.search(r'max(?:imum)? value:\s*([^\s;]+)', d, re.I)
    if m:
        p['max'] = m.group(1).strip('`.,')
    m = re.search(r'(?:maximum number of [a-z ]+(?: you can specify)?|you can specify up to|up to) :?\s*([\d,]+)\s*([a-z]+)?', d, re.I)
    if m and 'max' not in p:
        p['limit_note'] = m.group(0)[:80]
    return p


def params_for(op, path):
    out = []
    for prm in op.get('parameters', []) or []:
        out.append({'name': prm.get('name'), 'in': prm.get('in'), 'type': (prm.get('schema') or {}).get('type'),
                    'required': bool(prm.get('required'))})
    rb = (((op.get('requestBody') or {}).get('content') or {}).get('application/json') or {}).get('schema')
    sch = ref(rb) if rb else None
    if sch:
        for name, ps in (sch.get('properties') or {}).items():
            out.append(param_info(name, ps))
    return out


def docpath(path):
    p = path[len('/v3/'):]
    p = '/'.join(seg for seg in p.split('/') if not seg.startswith('{'))
    return p


def mode_for(path, module):
    segs = path.split('/')
    if 'live' in segs:
        return 'live'
    if 'task_post' in segs:
        return 'task_post'
    if 'task_get' in segs:
        return 'task_get'
    if 'tasks_ready' in segs:
        return 'tasks_ready'
    if 'tasks_fixed' in segs:
        return 'tasks_fixed'
    return None


LIVE_NO_SEGMENT = {'/v3/on_page/instant_pages', '/v3/on_page/page_screenshot', '/v3/serp/screenshot',
                   '/v3/serp/ai_summary', '/v3/on_page/content_parsing', '/v3/merchant/google/sellers/ad_url'}


def classify(path, module, method):
    m = mode_for(path, module)
    if m:
        return m
    base = re.sub(r'/\{[^}]+\}', '', path)
    if base in LIVE_NO_SEGMENT:
        return 'live'
    if module == 'on_page' and not re.search(r'/(locations|languages|available_filters|errors|id_list|audits|versions)$', base):
        return 'task_result'
    return 'utility'


# docs pages
docs = {}
for f in glob.glob(DOCS + '/*.md'):
    key = os.path.basename(f)[:-3].replace('__', '/')
    t = open(f, encoding='utf-8', errors='replace').read()
    if not t.startswith('---'):
        continue
    url = re.search(r'^url: "([^"]+)"', t, re.M)
    date = re.search(r'^date: "([^"]+)"', t, re.M)
    t2 = t.replace('\\_', '_')
    api = set()
    for meth, u in re.findall(r'\b(GET|POST)\s+https://api\.dataforseo\.com/(v3/[^\s)`|]+)', t2):
        u = '/' + u.rstrip('.,"\'')
        u = re.sub(r'\$(\w+)', r'{\1}', u)
        api.add((meth.lower(), u))
    lim = []
    for sent in re.findall(r'[^.\n|]{0,250}(?:per minute|simultaneous|can contain only one task|no more than \d+ tasks|up to \d[\d,]* tasks|keywords in one)[^.\n|]{0,250}\.', t2[:60000]):
        s = text(sent).strip(' *')
        if s and s not in lim and len(s) < 300:
            lim.append(s)
    # free only when the Pricing line says so; 'not be charged for the keywords omitted' is a param note
    free = bool(re.search(r'account will not be charged for using', t2)) and not re.search(r'will be charged for each request', t2)
    body = t2.split('---', 2)[-1][:900]
    dep = re.search(r'[^\n]*(deprecated|no longer available|discontinued)[^\n]*', body, re.I)
    charged = re.search(r'Your account will be charged (\$[0-9.]+)([^.]*)\.', t2)
    price_link = re.search(r'\((https://dataforseo\.com/pricing[^)\s"]*)', t2)
    ttl = re.search(r'^title: "([^"]+)"', t, re.M)
    docs[key] = dict(title=ttl.group(1) if ttl else None, url=(url.group(1).split('?')[0] if url else 'https://docs.dataforseo.com/v3/' + key + '/'),
                     date=date.group(1) if date else None, api=api, limits=lim[:5], free=free,
                     pricing_link=price_link.group(1) if price_link else None,
                     deprecated=text(dep.group(0)).strip('`* ') if dep else None,
                     charged=(charged.group(1), text(charged.group(0))) if charged else None)

api_to_doc = {}
for k, d in docs.items():
    for meth, u in d['api']:
        api_to_doc.setdefault(re.sub(r'/\{[^}]+\}', '', u), k)


def find_doc(path):
    dp = docpath(path)
    if dp in docs:
        return dp
    base = re.sub(r'/\{[^}]+\}', '', path)
    if base in api_to_doc:
        return api_to_doc[base]
    if base.endswith('/tasks_fixed'):
        return 'appendix/tasks_fixed'
    if base.endswith('/errors') and base != '/v3/appendix/errors':
        return 'appendix/api_errors'
    if base.endswith('/id_list'):
        return 'appendix/id_list'
    return None


# pricing rows whose name covers sibling endpoints (row name in comment)
PRICE_ALIAS = [
    ('/serp/google/finance_markets', '/serp/google/finance_explore'),        # Google Finance
    ('/serp/google/finance_quote', '/serp/google/finance_explore'),
    ('/serp/google/finance_ticker_search', '/serp/google/finance_explore'),
    ('/serp/youtube/video_comments', '/serp/youtube/organic'),               # YouTube Search / Comments
    ('/serp/youtube/video_subtitles', '/serp/youtube/video_info'),           # YouTube Video Info / Subtitles
    ('/dataforseo_labs/apple', '/dataforseo_labs/app_store'),                # Labs App Store endpoints
    ('/merchant/amazon/sellers', '/merchant/amazon/products'),               # Amazon Products & Sellers
    ('/business_data/business_listings/categories_aggregation', '/business_data/business_listings/search'),
    ('/business_data/google/hotel_searches', '/business_data/google/hotel_info'),  # Hotel Info / Hotel Searches
]


def price_for(path, mode, doc):
    if doc and docs[doc]['free']:
        return {'free': True, 'note': 'docs: your account will not be charged for using this endpoint'}
    if mode in ('task_get', 'tasks_ready', 'tasks_fixed', 'utility'):
        return None
    rel = path[len('/v3'):]
    rel = re.sub(r'/\{[^}]+\}', '', rel)
    for a, b in PRICE_ALIAS:
        if rel.startswith(a):
            rel = b + rel[len(a):]
            break
    best = []
    bestscore = -1
    for r in pricing:
        pat = '^' + re.escape(r['path']).replace(r'\*', '[^ ]*') + '(/.*)?$'
        if re.match(pat, rel):
            score = len(r['path'].replace('*', ''))
            if score > bestscore:
                best, bestscore = [r], score
            elif score == bestscore:
                best.append(r)
    if not best:
        if doc and docs[doc]['charged']:
            return {'tiers': [{'mode': 'per docs', 'billing_unit': 'per request', 'price_usd': docs[doc]['charged'][0],
                               'price_note': docs[doc]['charged'][1]}], 'source': docs[doc]['url']}
        return None
    want = {'live': ['Live mode', 'GET'], 'task_post': ['Standard queue', 'Priority queue', 'Crawl mode']}.get(mode)
    rows = [r for r in best if not want or r['cells']['Mode']['main'] in want] or best
    return {'tiers': [{'mode': r['cells']['Mode']['main'], 'billing_unit': (r['cells']['Billing unit']['main'] + ' ' + r['cells']['Billing unit'].get('sub', '')).strip(),
                       'price_usd': r['cells']['Price']['main'], 'price_note': r['cells']['Price'].get('sub'),
                       'pricing_row': r['name'] + ' ' + r['path']} for r in rows],
            'source': rows[0]['page']}


v2map = collections.defaultdict(list)
for t in v2:
    ps = [p['path'] for p in t['paths']] or [v2_extra.get(t['tool'])]
    for p in ps:
        if not p:
            continue
        p = p.split('?')[0]
        # expand ${params.search_engine} style templates into a regex
        p2 = re.sub(r'\$\{[^}]*\}', 'TPLVAR', p)
        rx = '^' + re.escape(p2).replace('TPLVAR', '[^/]+') + '$'
        v2map[rx].append(t['tool'])

endpoints = []
seen = set()
for path, ops in spec['paths'].items():
    for method, op in ops.items():
        if method not in ('get', 'post'):
            continue
        module = path.split('/')[2]
        mode = classify(path, module, method)
        doc = find_doc(path)
        base = re.sub(r'/\{[^}]+\}', '', path)
        tools = sorted({t for rx, ts in v2map.items() for t in ts if re.match(rx, base) or re.match(rx, path)})
        e = {
            'path': path, 'method': method.upper(), 'module': module, 'module_name': MODULES.get(module, module),
            'mode': mode, 'operation_id': op.get('operationId'),
            'purpose': first_sentence(op.get('description', '')) or (docs[doc]['title'] if doc else None),
            'params': params_for(op, path),
            'limits': docs[doc]['limits'] if doc else [],
            'price': price_for(path, mode, doc),
            'docs_url': docs[doc]['url'] if doc else None,
            'docs_page_date': docs[doc]['date'] if doc else None,
            'mcp_v2_tools': tools,
            'status': ('deprecated: ' + docs[doc]['deprecated']) if doc and docs[doc]['deprecated'] else 'active',
            'sources': ['openapi'] + (['docs'] if doc else []),
            'date_checked': CHECKED,
        }
        if doc and not e['price'] and docs[doc]['pricing_link'] and mode in ('live', 'task_post'):
            e['price'] = {'tiers': [], 'source': docs[doc]['pricing_link'], 'note': 'price not in a pricing table; see linked pricing page'}
        endpoints.append(e)
        seen.add((method, re.sub(r'/\{[^}]+\}', '', path)))

# docs-only endpoints (documented API URLs missing from OpenAPI)
docs_only = []
patterns = []
for k, d in docs.items():
    for meth, u in sorted(d['api']):
        b = re.sub(r'/\{[^}]+\}', '', u)
        if (meth, b) in seen:
            continue
        if '{path}' in u:
            patterns.append({'pattern': u, 'method': meth.upper(), 'docs_url': d['url']})
            seen.add((meth, b))
            continue
        module = u.split('/')[2]
        mode = classify(u, module, meth)
        seen.add((meth, b))
        e = {'path': u, 'method': meth.upper(), 'module': module, 'module_name': MODULES.get(module, module),
             'mode': mode, 'operation_id': None, 'purpose': d.get('title'), 'params': [],
             'limits': d['limits'], 'price': price_for(u, mode, k), 'docs_url': d['url'], 'docs_page_date': d['date'],
             'mcp_v2_tools': [], 'sources': ['docs'], 'date_checked': CHECKED,
             'status': ('deprecated: ' + d['deprecated']) if d['deprecated'] else 'active',
             'note': 'documented on docs.dataforseo.com but absent from the OpenAPI spec'}
        docs_only.append(e)
        endpoints.append(e)

endpoints.sort(key=lambda e: (list(MODULES).index(e['module']) if e['module'] in MODULES else 99, e['path'], e['method']))
out = {
    'generated': CHECKED,
    'api_base': 'https://api.dataforseo.com',
    'sandbox_base': 'https://sandbox.dataforseo.com',
    'mode_legend': {
        'live': 'one POST returns results immediately (one task per call)',
        'task_post': 'Standard method: queue tasks (up to 100 per call), billed here',
        'task_get': 'Standard method: fetch results of a queued task by id',
        'tasks_ready': 'Standard method: list completed, uncollected task ids',
        'tasks_fixed': 'list re-parsed tasks',
        'task_result': 'OnPage: read results of a crawl started with task_post',
        'utility': 'reference or account data (locations, languages, filters, ids, errors, status, user_data)',
    },
    'counts': {},
    'generic_patterns': patterns,
    'endpoints': endpoints,
}
c = collections.Counter(e['module'] for e in endpoints)
out['counts'] = {'total': len(endpoints), 'openapi': len(endpoints) - len(docs_only), 'docs_only': len(docs_only),
                 'by_module': dict(c), 'by_mode': dict(collections.Counter(e['mode'] for e in endpoints)),
                 'deprecated': sum(1 for e in endpoints if e['status'] != 'active')}
json.dump(out, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print(json.dumps(out['counts'], indent=1))
nodoc = [e['path'] for e in endpoints if not e['docs_url']]
print('no doc:', len(nodoc), nodoc[:30])
print('docs_only:', [(e['method'], e['path']) for e in docs_only][:60])
lp = [e['path'] for e in endpoints if e['mode'] in ('live', 'task_post') and not e['price']]
print('paid modes without price:', len(lp), lp[:60])
