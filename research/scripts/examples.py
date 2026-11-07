"""Extract request examples and key response fields from the official OpenAPI spec.
args: scratch_dir out_json"""
import sys, json, re
S = sys.argv[1]
sys.path.insert(0, S + '/scripts')
from load import load
d = load(S + '/dl/OpenApiDocumentation/openapi_specification.yaml')
sc = d['components']['schemas']


def deref(x, seen=0):
    if not isinstance(x, dict) or seen > 12:
        return {}
    if '$ref' in x:
        return deref(sc.get(x['$ref'].split('/')[-1], {}), seen + 1)
    for k in ('oneOf', 'anyOf'):
        if k in x and x[k]:
            return deref(x[k][0], seen + 1)
    return x


def props(x, seen=0):
    x = deref(x)
    out = {}
    for part in x.get('allOf', []):
        out.update(props(part, seen + 1))
    out.update(x.get('properties') or {})
    return out


def item_schema(p):
    x = deref(p)
    if x.get('type') == 'array' or 'items' in x:
        return x.get('items', {})
    return x


def union_props(p):
    """props of an array item; for polymorphic items (oneOf of many types) union all variants"""
    x = item_schema(p)
    if isinstance(x, dict) and '$ref' not in x and len(x.get('oneOf', [])) > 1:
        out = {}
        cnt = {}
        for v in x['oneOf']:
            for k, val in props(v).items():
                out.setdefault(k, val)
                cnt[k] = cnt.get(k, 0) + 1
        return dict(sorted(out.items(), key=lambda kv: -cnt[kv[0]])), True
    base = deref(x)
    dm = (base.get('discriminator') or {}).get('mapping') or {}
    if dm:
        def var(ref):
            return props({'$ref': ref})
        for pref in ('organic', 'maps_search', 'news_search', 'images_search', 'google_shopping_serp', 'local_pack',
                     'youtube_video', 'app', 'event_item', 'jobs_item'):
            if pref in dm:
                return {**props(base), **var(dm[pref])}, True
        out = dict(props(base))
        for ref in dm.values():
            for k, v in var(ref).items():
                out.setdefault(k, v)
        return out, True
    return props(x), False


PRIORITY = ['keyword', 'se_domain', 'url', 'domain', 'target', 'title', 'type', 'rank_group', 'rank_absolute', 'position',
            'search_volume', 'cpc', 'competition', 'competition_level', 'keyword_difficulty', 'search_intent_info',
            'main_domain', 'etv', 'count', 'rank', 'backlinks', 'referring_domains', 'referring_main_domains',
            'domain_from', 'url_from', 'url_to', 'anchor', 'dofollow', 'is_new', 'is_lost', 'first_seen', 'last_seen',
            'backlinks_spam_score', 'rating', 'reviews_count', 'review_text', 'price', 'seller', 'shop_ad_aclk',
            'product_id', 'app_id', 'question', 'answer', 'sources', 'ai_search_volume', 'mentions', 'model_name',
            'items', 'metrics', 'keyword_info', 'keyword_properties', 'impressions_info', 'serp_info', 'description',
            'onpage_score', 'status_code', 'resource_type', 'meta', 'page_timing', 'checks', 'technologies',
            'expiration_datetime', 'registrar', 'sentiment_connotations', 'content_info', 'snippet', 'cid', 'place_id',
            'address', 'phone', 'category', 'total_rating', 'value', 'date', 'timestamp', 'location_code',
            'language_code', 'name', 'country_iso_code', 'location_name', 'language_name', 'text', 'markdown', 'id']
SUMMARY = ['total_count', 'items_count', 'se_results_count', 'check_url', 'crawl_progress', 'datetime']


def key_fields(op):
    try:
        s = op['responses']['200']['content']['application/json']['schema']
    except KeyError:
        return []
    top = props(s)
    task = props(item_schema(top.get('tasks', {})))
    if 'result' not in task:
        return ['tasks[].id', 'tasks[].status_code', 'tasks[].status_message', 'tasks[].cost']
    res = props(item_schema(task['result']))
    out = [f for f in SUMMARY if f in res][:2]
    if 'items' in res:
        it, poly = union_props(res['items'])
        names = list(it)
        if poly:
            PRIO = ['type', 'rank_group', 'rank_absolute', 'domain', 'title', 'url', 'description']
            names = [f for f in PRIO if f in names] + [f for f in names if f not in PRIO]
        prefix = 'items[].'
        if set(names) <= {'type'} or not names:
            names, prefix = list(res), ''
    else:
        names, prefix = list(res), ''
    ranked = [f for f in PRIORITY if f in names] + [f for f in names if f not in PRIORITY]
    for f in ranked:
        if len(out) >= 8:
            break
        if prefix == '' and f in out:
            continue
        out.append(prefix + f)
    return out or ['tasks[].id', 'tasks[].status_code', 'tasks[].status_message', 'tasks[].cost']


# keys that add cost, need a callback server, or are cosmetic; removed from the minimal example
DROP = {'calculate_rectangles', 'load_async_ai_overview', 'people_also_ask_click_depth', 'include_clickstream_data',
        'pingback_url', 'postback_url', 'postback_data', 'tag', 'custom_js', 'load_resources', 'enable_javascript',
        'enable_browser_rendering', 'browser_screen_width', 'browser_screen_height', 'browser_screen_resolution_ratio',
        'store_raw_html', 'max_crawl_pages_extra', 'priority', 'search_param', 'expand_ai_overview', 'include_serp_info',
        'load_rank_absolute', 'switch_pool', 'disable_cookie_popup', 'return_despite_timeout', 'accept_language',
        'enable_xhr', 'calculate_keyword_density', 'validate_micromarkup', 'check_spell', 'allow_subdomains',
        'enable_www_redirect_check', 'enable_content_parsing', 'force_sitewide_checks', 'checks_threshold'}
DROPPED_LAST = set()


def minimal(ex):
    DROPPED_LAST.clear()
    out = []
    for t in ex:
        if isinstance(t, dict):
            k = {}
            for a, b in t.items():
                if a in DROP:
                    DROPPED_LAST.add(a)
                else:
                    k[a] = b
            out.append(k)
        else:
            out.append(t)
    return out[:1]


res = {}
for path, ops in d['paths'].items():
    for m, op in ops.items():
        rb = (((op.get('requestBody') or {}).get('content') or {}).get('application/json') or {}).get('schema') or {}
        ex = rb.get('example')
        ex_min = minimal(ex) if isinstance(ex, list) else None
        if m == 'get':
            params = [p['name'] for p in op.get('parameters', []) or [] if p.get('in') == 'path']
            ex_val = None
            exsrc = 'openapi (GET, no body' + (', path params: ' + ', '.join(params) if params else '') + ')'
        else:
            ex_val = ex_min
            exsrc = ('openapi requestBody example' + (', trimmed: removed ' + ', '.join(sorted(DROPPED_LAST)) if DROPPED_LAST else '')) if ex is not None else None
        res[f'{m.upper()} {path}'] = {'example': ex_val, 'example_official': ex if m == 'post' else None,
                                      'example_source': exsrc, 'response_key_fields': key_fields(op)}
json.dump(res, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print(len(res), sum(1 for v in res.values() if v['example'] is not None), sum(1 for v in res.values() if not v['response_key_fields']))
for k in ['POST /v3/backlinks/backlinks/live', 'POST /v3/serp/google/organic/live/advanced', 'POST /v3/dataforseo_labs/google/ranked_keywords/live',
          'POST /v3/keywords_data/google_ads/search_volume/live', 'GET /v3/serp/google/locations', 'POST /v3/ai_optimization/llm_mentions/search_mentions/live',
          'POST /v3/on_page/task_post', 'POST /v3/on_page/pages', 'POST /v3/business_data/google/my_business_info/live']:
    print(k, json.dumps(res.get(k))[:400])
