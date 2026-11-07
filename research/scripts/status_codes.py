import re, json, sys, html
src, out = sys.argv[1], sys.argv[2]
t = open(src).read()
rows = re.findall(r'^\| `(\d{3,5})` \| (.*?) \| (.*?) \|\s*$', t, re.M)


def clean(s):
    s = html.unescape(s).replace('\\_', '_')
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1 (\2)', s)
    s = s.replace('*', '').replace('`', '').replace(' \u2014 ', ', ').replace('\u2014', ', ').replace('\u2013', '-')
    return re.sub(r'\s+', ' ', s).strip()


# agent policy, derived from the official descriptions (retry: never | once | backoff | later | poll)
POLICY = {
    '401': ('auth', 'never', 'Check DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD (API Access tab, not the account password).'),
    '402': ('payment', 'never', 'Stop. Tell the user to check the balance; do not retry.'),
    '404': ('request', 'never', 'Wrong endpoint path; look it up in the catalog.'),
    '500': ('server', 'later', 'Retry later with backoff.'),
    '20000': ('success', 'n/a', 'Success. Read the result and report the cost field.'),
    '20100': ('success', 'n/a', 'Task queued. Poll tasks_ready, then fetch with task_get.'),
    '40000': ('request', 'never', 'Live endpoints take one task per call; split the array.'),
    '40001': ('request', 'never', 'Use the task id returned to this account.'),
    '40002': ('request', 'never', 'Fetch the id from the same search engine path it was posted to.'),
    '40003': ('request', 'never', 'Fetch the id from the same search type path it was posted to.'),
    '40004': ('request', 'never', 'Fetch the id from the same function path it was posted to.'),
    '40006': ('request', 'never', 'Send at most 100 tasks per POST; split the batch.'),
    '40007': ('notice', 'n/a', 'Informational: read the optimization advice and pass it to the user.'),
    '40100': ('auth', 'never', 'Credentials rejected; check login and API password.'),
    '40101': ('upstream', 'once', 'Search engine error; resubmit once, then report.'),
    '40102': ('no_data', 'never', 'No results for this query; report it as an empty result, not a failure.'),
    '40103': ('task', 'once', 'Resubmit the task once.'),
    '40104': ('account', 'never', 'Account needs email or phone verification in the dashboard; tell the user.'),
    '40105': ('task', 'never', 'Task deleted; post a new task if still needed (costs money: re-estimate and ask).'),
    '40106': ('partial', 'n/a', 'Partial results; unretrieved pages were not charged. Report what is missing.'),
    '40200': ('payment', 'never', 'Stop. Balance must be recharged; tell the user. Never retry.'),
    '40201': ('account', 'never', 'Account paused for unusual activity; tell the user to contact DataForSEO support.'),
    '40202': ('rate_limit', 'backoff', 'Per-minute rate limit hit; wait about a minute and slow down.'),
    '40203': ('payment', 'never', 'Daily cost limit reached (set in api-settings); stop and tell the user. Never retry.'),
    '40205': ('limit', 'never', 'Hourly duplicate-task limit reached; reuse earlier results instead of reposting.'),
    '40206': ('limit', 'never', 'Daily duplicate-task limit reached; reuse earlier results instead of reposting.'),
    '40207': ('account', 'never', 'IP not whitelisted; the user must add it in the API Access settings.'),
    '40209': ('rate_limit', 'backoff', 'Over 30 simultaneous requests; lower concurrency and retry.'),
    '40210': ('payment', 'never', 'Insufficient funds; stop and tell the user. Never retry.'),
    '40400': ('request', 'never', 'Resource does not exist; check the URL against the catalog.'),
    '40401': ('task', 'never', 'Task id not found; check the id.'),
    '40402': ('request', 'never', 'Invalid path; check it against the catalog.'),
    '40403': ('task', 'never', 'Results older than about a month expired; a new task is needed (re-estimate and ask).'),
    '40404': ('sandbox', 'never', 'Sandbox has no prepared data for this request; change the request or skip the sandbox check.'),
    '40405': ('target', 'never', 'Target page has too little text; pick another page.'),
    '40406': ('task', 'never', 'Page was not part of the crawl; check the OnPage task.'),
    '40407': ('request', 'never', 'Duplicate hosts in the request; deduplicate targets.'),
    '40408': ('target', 'never', 'Target URL invalid or returns 404; check the URL.'),
    '40501': ('request', 'never', 'Invalid field value; check parameters against the docs page.'),
    '40502': ('request', 'never', 'POST body empty; send a JSON array of task objects.'),
    '40503': ('request', 'never', 'POST body malformed; it must be a JSON array of task objects.'),
    '40504': ('request', 'never', 'Too many intersecting keywords (over 10 million); use other domains.'),
    '40505': ('request', 'never', 'Outdated location parameters; refresh from the locations endpoint.'),
    '40506': ('request', 'never', 'Unknown fields in the body; remove them (see the docs page).'),
    '40601': ('pending', 'poll', 'Task received, not yet queued; poll tasks_ready later.'),
    '40602': ('pending', 'poll', 'Task in queue; poll tasks_ready later.'),
    '50000': ('server', 'later', 'Internal error; retry later, then report.'),
    '50001': ('server', 'later', 'Balance check failed; retry later, then report.'),
    '50100': ('request', 'never', 'Non-existent task or parameter; check the body.'),
    '50301': ('upstream', 'later', 'Third-party source (for example Google Ads) unavailable; retry later.'),
    '50303': ('server', 'later', 'API is updating; retry after a few minutes.'),
    '50304': ('server', 'never', 'Function temporarily unavailable; report and suggest another endpoint.'),
    '50401': ('server', 'once', 'Live task timed out after 120 seconds; retry once (a retry is billed again: tell the user).'),
    '50402': ('target', 'later', 'Target page took over 50 seconds; retry later or use another page.'),
}
codes = []
for c, msg, desc in rows:
    if c in {x['code'] for x in codes}:
        continue
    cls, retry, action = POLICY.get(c, ('unknown', 'never', 'See the official description.'))
    codes.append({'code': c, 'kind': 'http' if len(c) == 3 else 'internal', 'message': clean(msg),
                  'description': clean(desc), 'class': cls, 'retry': retry, 'agent_action': action})
missing = set(POLICY) - {x['code'] for x in codes}
doc = {
    'checked': '2026-11-06',
    'source': 'https://docs.dataforseo.com/v3/appendix/errors/',
    'notes': [
        'HTTP status is 200 for nearly everything; read the top-level status_code and each tasks[].status_code.',
        'description is the official text; class, retry and agent_action are agent policy derived from it.',
        'retry values: never (fix or stop), once (one resubmit), backoff (wait and slow down), later (retry after minutes), poll (task still running), n/a (not an error).',
        'Never retry spend errors 40200, 40203, 40210; a retry of a live call is billed again.',
        '40204 (subscription required) is no longer in the official table; Backlinks and LLM Mentions are pay as you go since 2026-07-01.',
        'GET /v3/appendix/errors returns this list from the API for free.',
    ],
    'codes': codes,
}
json.dump(doc, open(out, 'w'), indent=1, ensure_ascii=False)
print(len(codes), 'policy without row:', missing, 'rows without policy:', [x['code'] for x in codes if x['class'] == 'unknown'])
