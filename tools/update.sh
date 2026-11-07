#!/usr/bin/env bash
# Pull the latest DataForSEO Agent, then rebuild and reinstall it.
set -euo pipefail
root="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
export PATH="$HOME/.bun/bin:$PATH"
cd "$root"

if [ -n "$(git status --porcelain)" ]; then
  echo "This folder has uncommitted changes. Commit or set them aside first, then run dataforseo-agent-update again." >&2
  exit 1
fi
git pull --ff-only
(cd "$root/engine" && bun install)
"$root/tools/install.sh"
