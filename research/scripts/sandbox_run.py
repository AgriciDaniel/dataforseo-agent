"""Run the planned sandbox checks. Sandbox host only. Never prints credentials.
args: endpoints.json env_file out_json"""
import sys, json, base64, urllib.request, urllib.error, os, time

HOST = 'https://sandbox.dataforseo.com'
PLAN = [
    ('POST', '/v3/serp/google/organic/live/advanced'),
    ('POST', '/v3/serp/google/ads_search/live/advanced'),
    ('POST', '/v3/ai_optimization/llm_mentions/search_mentions/live'),
    ('POST', '/v3/ai_optimization/chat_gpt/llm_responses/live'),
    ('POST', '/v3/keywords_data/google_ads/search_volume/live'),
    ('POST', '/v3/dataforseo_labs/google/ranked_keywords/live'),
    ('POST', '/v3/dataforseo_labs/google/keyword_ideas/live'),
    ('POST', '/v3/backlinks/summary/live'),
    ('POST', '/v3/on_page/instant_pages'),
    ('POST', '/v3/domain_analytics/whois/overview/live'),
    ('POST', '/v3/content_analysis/search/live'),
    ('POST', '/v3/merchant/amazon/products/task_post'),
    ('POST', '/v3/app_data/google/app_info/task_post'),
    ('POST', '/v3/business_data/business_listings/search/live'),
    ('GET', '/v3/appendix/user_data'),
]


def env(path):
    vals = {}
    for line in open(os.path.expanduser(path)):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            vals[k.strip().removeprefix('export ').strip()] = v.strip().strip('"').strip("'")
    return vals


cat = {(e['method'], e['path']): e for e in json.load(open(sys.argv[1]))['endpoints']}
e = env(sys.argv[2])
login, pwd = e.get('DATAFORSEO_USERNAME') or e.get('DATAFORSEO_LOGIN'), e.get('DATAFORSEO_PASSWORD')
assert login and pwd, 'credentials missing'
auth = 'Basic ' + base64.b64encode(f'{login}:{pwd}'.encode()).decode()
del login, pwd, e

results = []
for method, path in PLAN:
    ep = cat[(method, path)]
    url = HOST + path
    assert url.startswith('https://sandbox.dataforseo.com/v3/'), url
    body = json.dumps(ep['example']).encode() if method == 'POST' else None
    req = urllib.request.Request(url, data=body, method=method,
                                 headers={'Authorization': auth, 'Content-Type': 'application/json',
                                          'User-Agent': 'dataforseo-agent-research'})
    r = {'method': method, 'path': path, 'mode': ep['mode']}
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            r['http'] = resp.status
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        r['http'] = err.code
        try:
            data = json.loads(err.read().decode())
        except Exception:
            data = {}
    except Exception as err:
        r['error'] = type(err).__name__
        results.append(r)
        continue
    r['status_code'] = data.get('status_code')
    r['status_message'] = data.get('status_message')
    r['cost'] = data.get('cost')
    t = (data.get('tasks') or [{}])[0] or {}
    r['task_status_code'] = t.get('status_code')
    r['task_status_message'] = t.get('status_message')
    res = (t.get('result') or [None])[0]
    if isinstance(res, dict):
        r['result_keys'] = sorted(res.keys())
        items = res.get('items')
        if isinstance(items, list) and items:
            ks = set()
            for it in items:
                if isinstance(it, dict):
                    ks |= set(it.keys())
            r['item_keys'] = sorted(ks)
            r['item_types'] = sorted({it.get('type') for it in items if isinstance(it, dict) and it.get('type')})
    want = 20100 if ep['mode'] == 'task_post' else 20000
    r['pass'] = r['status_code'] == 20000 and r['task_status_code'] == want
    # key-field check: are the catalog's response_key_fields present?
    kf = ep.get('response_key_fields') or []
    present, absent = [], []
    for f in kf:
        name = f.split('.')[-1]
        pool = set(r.get('result_keys', [])) | set(r.get('item_keys', []))
        if f.startswith('tasks[]'):
            pool = set(t.keys())
        (present if name in pool else absent).append(f)
    r['key_fields_present'], r['key_fields_absent'] = present, absent
    results.append(r)
    time.sleep(0.5)
json.dump(results, open(sys.argv[3], 'w'), indent=1)
for r in results:
    print(r['method'], r['path'], r.get('http'), r.get('status_code'), r.get('task_status_code'), r.get('task_status_message'),
          'PASS' if r.get('pass') else 'FAIL', 'absent:', r.get('key_fields_absent'))
