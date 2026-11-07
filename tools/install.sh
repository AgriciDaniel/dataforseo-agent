#!/usr/bin/env bash
# Build DataForSEO Agent from source, install it as `dataforseo-agent` (short command `dataforseo`),
# and generate its agents, skills and MCP config from the Brain.
set -euo pipefail
root="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
# Each build gets its own version, so a background service left over from an earlier build is replaced on next start.
version="$(cat "$root/tools/VERSION")+$(date -u +%Y%m%d%H%M%S)"
bin="$HOME/.local/bin"
export PATH="$HOME/.bun/bin:$PATH"

for tool in bun python3; do
  command -v "$tool" >/dev/null || { echo "Missing $tool. Install it first (Bun: https://bun.sh)."; exit 1; }
done
# First run on a fresh clone: fetch the engine's dependencies.
[ -d "$root/engine/node_modules" ] || (cd "$root/engine" && bun install --frozen-lockfile)

(cd "$root/engine/packages/cli" && DATAFORSEO_AGENT_CHANNEL=local DATAFORSEO_AGENT_VERSION="$version" bun run script/build.ts --single)

lib="$HOME/.local/lib/dataforseo-agent"
mkdir -p "$bin" "$lib"
# Replace rather than write over the file: a running copy keeps its old binary intact.
built="$(ls "$root"/engine/packages/cli/dist/cli-*/bin/dataforseo-agent 2>/dev/null | head -1)"
[ -n "$built" ] || { echo "Build failed: no binary in engine/packages/cli/dist."; exit 1; }
cp "$built" "$lib/.dataforseo-agent.new"
mv -f "$lib/.dataforseo-agent.new" "$lib/dataforseo-agent"
# `dataforseo-agent` and `dataforseo` are the launcher: it loads the DataForSEO login saved by setup, then runs the app.
cp "$root/tools/launcher.sh" "$bin/.dataforseo-agent.new"
chmod +x "$bin/.dataforseo-agent.new"
mv -f "$bin/.dataforseo-agent.new" "$bin/dataforseo-agent"
ln -sf "$bin/dataforseo-agent" "$bin/dataforseo"
# The short command used to be `dfa`: remove that old link, but only when it is ours.
[ -L "$bin/dfa" ] && [ "$(readlink "$bin/dfa")" = "$bin/dataforseo-agent" ] && rm -f "$bin/dfa" || true
ln -sf "$root/tools/update.sh" "$bin/dataforseo-agent-update"
ln -sf "$root/tools/setup.sh" "$bin/dataforseo-agent-setup"

if [ -f "$root/tools/bridge.py" ]; then
  python3 -I "$root/tools/bridge.py" --brain "$root/Brain" --catalog "$root/research/endpoints.json" --login-env "${DATAFORSEO_LOGIN_ENV:-DATAFORSEO_LOGIN}"
fi
# Stop a running background service now, so the next start runs this build.
"$bin/dataforseo-agent" service stop >/dev/null 2>&1 || true
"$bin/dataforseo-agent" --version
