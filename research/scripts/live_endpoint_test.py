#!/usr/bin/env python3
"""Call every endpoint in research/endpoints.json and record what really happens.

Phase sandbox: every endpoint on https://sandbox.dataforseo.com (free, dummy data) to check request shapes.
Phase live:    every free endpoint, then one minimal real call per paid endpoint (cheapest settings), with a
               hard stop once the billed total reaches --cap. Task endpoints are posted, then collected with
               the free task_get when ready.

Credentials come from the environment (DATAFORSEO_LOGIN or DATAFORSEO_USERNAME, and DATAFORSEO_PASSWORD)
and are never printed or written. Results go to research/live-endpoint-test.json and .md.

Usage: live_endpoint_test.py [--phase sandbox|live|all] [--cap 10] [--only <path substring>]
"""
import argparse, base64, copy, json, os, re, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, "endpoints.json")
OUT_JSON = os.path.join(ROOT, "live-endpoint-test.json")
OUT_MD = os.path.join(ROOT, "live-endpoint-test.md")

LIVE = "https://api.dataforseo.com"
SANDBOX = "https://sandbox.dataforseo.com"
DUMMY_ID = "00000000-0000-0000-0000-000000000000"


def auth_header():
    login = os.environ.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_USERNAME")
    password = os.environ.get("DATAFORSEO_PASSWORD")
    if not login or not password:
        sys.exit("No DataForSEO credentials in the environment.")
    return "Basic " + base64.b64encode(f"{login}:{password}".encode()).decode()


AUTH = None


def call(base, method, path, body=None, timeout=120):
    for attempt in range(4):
        res = _call(base, method, path, body, timeout)
        j = res.get("json") or {}
        codes = {j.get("status_code")} | {t.get("status_code") for t in (j.get("tasks") or [])}
        if 40202 not in codes:
            return res
        time.sleep(20 * (attempt + 1))
    return res


def _call(base, method, path, body=None, timeout=120):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method,
                                 headers={"Authorization": AUTH, "Content-Type": "application/json"})
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read()
            http = res.status
    except urllib.error.HTTPError as e:
        raw, http = e.read(), e.code
    except Exception as e:  # network or timeout
        return {"http": 0, "error": str(e)[:200], "ms": int((time.time() - started) * 1000)}
    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = None
    return {"http": http, "json": parsed, "ms": int((time.time() - started) * 1000), "bytes": len(raw)}


def minimal(example, params, path=None):
    """The catalog example, trimmed to the cheapest settings the endpoint accepts."""
    task = copy.deepcopy(example[0]) if isinstance(example, list) and example else (copy.deepcopy(example) if isinstance(example, dict) else {})
    names = {p["name"] for p in params}
    if "limit" in names:
        task["limit"] = 1
    if "depth" in names and isinstance(task.get("depth"), int) and task["depth"] > 10:
        task["depth"] = 10
    if "max_crawl_pages" in names:
        task["max_crawl_pages"] = 1
    if "max_output_tokens" in names:
        task["max_output_tokens"] = 16
    fix = EXAMPLE_FIXES.get(path) or {}
    for k in fix.get("_drop", []):
        task.pop(k, None)
    task.update({k: v for k, v in fix.items() if k != "_drop"})
    dates(task)
    for heavy in ("calculate_rectangles", "load_resources", "enable_javascript", "enable_browser_rendering",
                  "include_serp_info", "include_clickstream_data", "historical_serp_mode"):
        if heavy in task and task[heavy] is True:
            task[heavy] = False
    return [task]


PATH_VALUES = {"country": "us", "id": DUMMY_ID, "task_id": DUMMY_ID}


def fill_path(path):
    return re.sub(r"\{([^}]*)\}", lambda m: PATH_VALUES.get(m.group(1), DUMMY_ID), path)


# Catalog examples known to be wrong (found by this test and the Brain review); the live call uses the fix,
# and the report lists them so the catalog gets corrected.
EXAMPLE_FIXES = {
    "/v3/serp/baidu/organic/task_post": {"language_code": "zh_CN"},
    "/v3/dataforseo_labs/google/historical_serps/live": {"_drop": ["datetime_from", "datetime_to", "limit"], "date_from": "DATE-30", "date_to": "DATE-1"},
    "/v3/backlinks/bulk_new_lost_referring_domains/live": {"_drop": ["datetime_from"], "date_from": "DATE-30"},
}


def dates(task):
    """Replace stale example dates with ones the API accepts today."""
    now = time.time()
    day = lambda n: time.strftime("%Y-%m-%d", time.gmtime(now + n * 86400))
    stamp = lambda n: time.strftime("%Y-%m-%d %H:%M:%S +00:00", time.gmtime(now + n * 86400))
    if "datetime_from" in task: task["datetime_from"] = stamp(-7)
    if "datetime_to" in task: task["datetime_to"] = stamp(0)
    if "check_in" in task: task["check_in"] = day(30)
    if "check_out" in task: task["check_out"] = day(32)
    for k, v in list(task.items()):
        if isinstance(v, str) and v.startswith("DATE-"):
            task[k] = day(-int(v[5:]))
    return task


def summarize(res):
    j = res.get("json") or {}
    tasks = j.get("tasks") or []
    t = tasks[0] if tasks else {}
    result = t.get("result")
    return {
        "http": res.get("http"),
        "ms": res.get("ms"),
        "status_code": j.get("status_code"),
        "status_message": j.get("status_message"),
        "task_status_code": t.get("status_code"),
        "task_status_message": t.get("status_message"),
        "task_id": t.get("id"),
        "cost": j.get("cost") if isinstance(j.get("cost"), (int, float)) else 0,
        "results": len(result) if isinstance(result, list) else (None if result is None else 1),
        "error": res.get("error"),
    }


# A free lookup sent a made-up task id answers with one of these: the route and the login still work.
DUMMY_ID_ANSWERS = {40004, 40401, 40403}


def ok(s):
    if s.get("http") == 200 and s.get("status_code") == 20000 and s.get("task_status_code") in DUMMY_ID_ANSWERS:
        return True
    return s.get("http") == 200 and s.get("status_code") == 20000 and (s.get("task_status_code") in (None, 20000, 20100))


def run_sandbox(endpoints):
    def one(e):
        body = None if e["method"] == "GET" else minimal(e.get("example"), e.get("params") or [], e["path"])
        return e["path"], summarize(call(SANDBOX, e["method"], fill_path(e["path"]), body, timeout=60))
    with ThreadPoolExecutor(4) as pool:
        return dict(pool.map(one, endpoints))


def run_live(endpoints, cap):
    results, spent = {}, 0.0
    free = [e for e in endpoints if (e.get("price") or {}).get("unit") == "free"]
    paid = [e for e in endpoints if (e.get("price") or {}).get("unit") != "free"]
    print(f"live: {len(free)} free, {len(paid)} paid, cap ${cap}", flush=True)
    # Free endpoints: several at a time (they cost nothing). Templated paths use a dummy id, so a
    # "not found" answer there still proves the route and auth work.
    def free_one(e):
        body = None if e["method"] == "GET" else minimal(e.get("example"), e.get("params") or [], e["path"])
        return e["path"], summarize(call(LIVE, e["method"], fill_path(e["path"]), body))
    with ThreadPoolExecutor(6) as pool:
        for path, s in pool.map(free_one, free):
            results[path] = s
            spent += s["cost"] or 0
    # Paid endpoints: one at a time, cheapest first, so the cap stops before the expensive ones.
    posted = []
    for e in sorted(paid, key=lambda e: (e.get("price") or {}).get("usd") or 0):
        if spent >= cap:
            results[e["path"]] = {"skipped": f"cap ${cap} reached"}
            continue
        if "{" in e["path"]:
            results[e["path"]] = {"skipped": "path needs a real id"}
            continue
        s = summarize(call(LIVE, "POST", e["path"], minimal(e.get("example"), e.get("params") or [], e["path"])))
        spent += s["cost"] or 0
        s["spent_so_far"] = round(spent, 4)
        results[e["path"]] = s
        print(f"  {s['status_code']}/{s['task_status_code']} ${s['cost']} {e['path']}", flush=True)
        if e["mode"] == "task_post" and s.get("task_id") and s["task_status_code"] == 20100:
            posted.append((e, s["task_id"]))
    # Collect posted tasks with the free task_get (standard queue can take a few minutes).
    deadline = time.time() + 20 * 60
    pending = list(posted)
    while pending and time.time() < deadline:
        time.sleep(30)
        still = []
        for e, tid in pending:
            get_path = guess_task_get(e["path"], endpoints)
            if not get_path:
                results[e["path"]]["task_get"] = "no task_get endpoint found"
                continue
            g = summarize(call(LIVE, "GET", get_path.replace("{id}", tid)))
            if g["task_status_code"] in (40601, 40602):  # task in queue or in progress
                still.append((e, tid))
                continue
            results[e["path"]]["task_get"] = {"path": get_path, **g}
        pending = still
    for e, tid in pending:
        results[e["path"]]["task_get"] = "not ready within 20 minutes"
    return results, spent


def guess_task_get(post_path, endpoints):
    base = post_path.rsplit("/task_post", 1)[0]
    gets = [e["path"] for e in endpoints if e["path"].startswith(base + "/task_get")]
    gets.sort(key=lambda p: ("/regular/" not in p, "/advanced/" not in p, len(p)))
    return gets[0] if gets else None


def report(endpoints, data):
    lines = ["# Live endpoint test", "", f"Run: {time.strftime('%Y-%m-%d %H:%M')}. Catalog: {len(endpoints)} endpoints.", ""]
    for phase in ("sandbox", "live"):
        res = data.get(phase)
        if not res:
            continue
        done = {p: s for p, s in res.items() if "skipped" not in s}
        good = [p for p, s in done.items() if ok(s)]
        bad = {p: s for p, s in done.items() if not ok(s)}
        lines += [f"## {phase.title()}", "",
                  f"{len(good)} of {len(done)} answered OK; {len(bad)} did not; {len(res) - len(done)} skipped.", ""]
        if phase == "live":
            lines += [f"Billed total: ${data.get('live_spent', 0):.4f}.", ""]
        if bad:
            lines += ["| Path | HTTP | Status | Task status | Message |", "|---|---|---|---|---|"]
            for p, s in sorted(bad.items()):
                msg = (s.get("task_status_message") or s.get("status_message") or s.get("error") or "").replace("|", "/")
                lines.append(f"| `{p}` | {s.get('http')} | {s.get('status_code')} | {s.get('task_status_code')} | {msg[:90]} |")
            lines.append("")
    live = data.get("live") or {}
    by_path = {e["path"]: e for e in endpoints}
    rows = []
    for p, s in sorted(live.items()):
        e = by_path.get(p)
        if not e or "skipped" in s or (e.get("price") or {}).get("unit") == "free":
            continue
        base = (e.get("price") or {}).get("usd") or 0
        billed = s.get("cost") or 0
        if base and billed > base * 1.6 + 0.0005:
            rows.append(f"| `{p}` | ${base:.4f} | ${billed:.4f} |")
    if rows:
        lines += ["## Billed above the catalog price", "", "| Path | Catalog | Billed |", "|---|---|---|", *rows, ""]
    open(OUT_MD, "w").write("\n".join(lines) + "\n")


def main():
    global AUTH
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", default="all")
    ap.add_argument("--cap", type=float, default=10.0)
    ap.add_argument("--only")
    a = ap.parse_args()
    if a.phase != "report":
        AUTH = auth_header()
    endpoints = [e for e in json.load(open(CATALOG))["endpoints"] if e.get("status", "active") == "active"]
    if a.only:
        endpoints = [e for e in endpoints if a.only in e["path"]]
    data = json.load(open(OUT_JSON)) if os.path.exists(OUT_JSON) else {}
    if a.phase == "report":
        report(endpoints, data)
        return
    if a.phase in ("sandbox", "all"):
        data["sandbox"] = run_sandbox(endpoints)
        json.dump(data, open(OUT_JSON, "w"), indent=1)
        print("sandbox done", flush=True)
    if a.phase in ("live", "all"):
        data["live"], data["live_spent"] = run_live(endpoints, a.cap)
        json.dump(data, open(OUT_JSON, "w"), indent=1)
    report(endpoints, data)
    print("report:", OUT_MD)


if __name__ == "__main__":
    main()
