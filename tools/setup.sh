#!/usr/bin/env bash
# DataForSEO Agent setup: connect your DataForSEO account, choose spending limits and your default market,
# and pick a model. Your password goes only into a private file on this machine, never to a model.
set -euo pipefail
dir="${XDG_CONFIG_HOME:-$HOME/.config}/dataforseo-agent"
cred="$dir/credentials.env"
settings="$dir/settings.json"
mkdir -p "$dir"
bold=$'\e[1m'; dim=$'\e[2m'; blue=$'\e[38;2;40;98;168m'; gold=$'\e[38;2;234;189;89m'; green=$'\e[32m'; red=$'\e[31m'; off=$'\e[0m'

echo
echo "${blue}▌${off}${gold}▌${off} ${bold}DataForSEO Agent setup${off}"
echo "${dim}Three steps: account, spending and market, model. Press Enter to keep a default.${off}"

# 1. Account
echo; echo "${bold}1. DataForSEO account${off}"
echo "   Your API login and password are at https://app.dataforseo.com/api-access"
echo "   1) type them now (saved to $cred, readable only by you)"
echo "   2) use an env file you already keep (only DATAFORSEO_* lines are read from it)"
echo "   3) skip"
read -rp "   Choose [1]: " how; how="${how:-1}"
umask 077
case "$how" in
  1)
    read -rp "   API login (email): " login
    read -rsp "   API password (hidden): " password; echo
    printf 'DATAFORSEO_LOGIN=%s\nDATAFORSEO_PASSWORD=%s\n' "$login" "$password" > "$cred"
    ;;
  2)
    read -rp "   Path to the env file: " envfile
    envfile="${envfile/#\~/$HOME}"
    [ -f "$envfile" ] || { echo "   ${red}No file at $envfile${off}"; exit 1; }
    printf 'DATAFORSEO_ENV_FILE=%s\n' "$envfile" > "$cred"
    ;;
  *) echo "   Skipped." ;;
esac
chmod 600 "$cred" 2>/dev/null || true

# Check the account with the free user_data endpoint (costs nothing).
if [ -f "$cred" ]; then
  if out="$(dataforseo-agent --check-account 2>&1)"; then echo "   ${green}${out}${off}"; else echo "   ${red}${out}${off}"; fi
fi

# 2. Spending and market
echo; echo "${bold}2. Spending and market${off}"
cur() { python3 -c 'import json,sys
try: print(json.load(open(sys.argv[1])).get(sys.argv[2], sys.argv[3]))
except Exception: print(sys.argv[3])' "$settings" "$1" "$2"; }
read -rp "   Budget per session in USD, a hard stop [$(cur budget_per_session_usd 1)]: " budget
read -rp "   Run without asking below this cost in USD, 0 = always ask [$(cur ask_above_usd 0)]: " askabove
echo "   Default market: 2840 US, 2826 UK, 2124 Canada, 2036 Australia, 2276 Germany, 2250 France, 2724 Spain,"
echo "   2380 Italy, 2642 Romania, 2356 India (any DataForSEO location code works)"
read -rp "   Location code [$(cur default_location_code 2840)]: " loc
read -rp "   Language code [$(cur default_language_code en)]: " lang
read -rp "   Mode when you don't say: cheapest, standard or live [$(cur prefer_mode cheapest)]: " mode
python3 - "$settings" "$budget" "$askabove" "$loc" "$lang" "$mode" <<'PY'
import json, sys
path, budget, ask, loc, lang, mode = sys.argv[1:]
try:
    s = json.load(open(path))
except Exception:
    s = {}
s.setdefault("budget_per_session_usd", 1.0); s.setdefault("ask_above_usd", 0.0)
s.setdefault("default_location_code", 2840); s.setdefault("default_language_code", "en"); s.setdefault("prefer_mode", "cheapest")
if budget: s["budget_per_session_usd"] = float(budget)
if ask: s["ask_above_usd"] = float(ask)
if loc: s["default_location_code"] = int(loc)
if lang: s["default_language_code"] = lang
if mode in ("cheapest", "standard", "live"): s["prefer_mode"] = mode
json.dump(s, open(path, "w"), indent=2); open(path, "a").write("\n")
print("   Saved " + path)
PY

# 3. Model
echo; echo "${bold}3. Model${off}"
echo "   Any provider works. The easiest:"
command -v claude >/dev/null && echo "   a) Claude, through your Claude Code login (no API key)"
echo "   b) ChatGPT, through your ChatGPT account"
echo "   c) an API key (Gemini, OpenAI, Anthropic, OpenRouter and more): choose it inside the app with /connect"
read -rp "   Connect now? a, b or Enter to skip: " m
case "$m" in
  a) dataforseo-agent auth login claude-agent ;;
  b) dataforseo-agent auth login openai ;;
esac

echo; echo "${green}Done.${off} Start with ${bold}dataforseo${off}. Inside, try /dfs-balance or /dfs-route <your question>."
