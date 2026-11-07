#!/usr/bin/env bash
# DataForSEO Agent launcher: loads only the DataForSEO credentials (never other secrets) from the file
# written by `dataforseo-agent-setup`, then starts the app. Variables already in the environment win.
cfg="${XDG_CONFIG_HOME:-$HOME/.config}/dataforseo-agent/credentials.env"
load() {
  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#export }"
    key="${line%%=*}"
    case "$key" in
      DATAFORSEO_LOGIN | DATAFORSEO_USERNAME | DATAFORSEO_PASSWORD) ;;
      *) continue ;;
    esac
    [ -n "${!key:-}" ] && continue
    value="${line#*=}"
    value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
    export "$key=$value"
  done < "$1"
}
if [ -f "$cfg" ]; then
  envfile="$(sed -n 's/^DATAFORSEO_ENV_FILE=//p' "$cfg" | head -1)"
  envfile="${envfile/#\~/$HOME}"
  load "$cfg"
  [ -n "$envfile" ] && [ -f "$envfile" ] && load "$envfile"
fi
# The MCP server reads DATAFORSEO_LOGIN; some setups name it DATAFORSEO_USERNAME. Provide both.
[ -z "${DATAFORSEO_LOGIN:-}" ] && [ -n "${DATAFORSEO_USERNAME:-}" ] && export DATAFORSEO_LOGIN="$DATAFORSEO_USERNAME"
[ -z "${DATAFORSEO_USERNAME:-}" ] && [ -n "${DATAFORSEO_LOGIN:-}" ] && export DATAFORSEO_USERNAME="$DATAFORSEO_LOGIN"
# `dataforseo-agent --check-account`: free balance check (/v3/appendix/user_data costs nothing).
if [ "${1:-}" = "--check-account" ]; then
  if [ -z "${DATAFORSEO_LOGIN:-}" ] || [ -z "${DATAFORSEO_PASSWORD:-}" ]; then
    echo "Not connected: no DataForSEO login found. Run dataforseo-agent-setup."; exit 1
  fi
  # The login goes to curl on stdin, so the password never shows in the process list.
  creds="$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD"; creds="${creds//\\/\\\\}"; creds="${creds//\"/\\\"}"
  # Exit 2 means a temporary task error (rate limit, server busy): try once more.
  for attempt in 1 2; do
    printf 'user = "%s"\n' "$creds" |
      curl -s -m 20 -K - https://api.dataforseo.com/v3/appendix/user_data |
      python3 -c 'import json,sys
try:
    d = json.load(sys.stdin)
    if d.get("status_code") != 20000: print("Could not sign in: %s" % d.get("status_message")); sys.exit(1)
    t = (d.get("tasks") or [{}])[0]
    if t.get("status_code") != 20000 or not t.get("result"):
        if t.get("status_code") in (40202, 50000): sys.exit(2)
        print("Could not check the account: %s" % t.get("status_message", "no result")); sys.exit(1)
    r = t["result"][0]; m = r["money"]
    print("Connected as %s. Balance $%.2f, spent today $%.3f." % (r.get("login"), m["balance"], m.get("statistics", {}).get("day", {}).get("total", 0)))
except SystemExit: raise
except Exception as e: print("Could not check the account: %s" % e); sys.exit(1)'
    code=$?
    [ $code -eq 2 ] || exit $code
    [ $attempt -eq 1 ] && sleep 5
  done
  echo "Could not check the account: DataForSEO is rate limiting this check. Try again in a minute."; exit 1
fi
exec "$HOME/.local/lib/dataforseo-agent/dataforseo-agent" "$@"
