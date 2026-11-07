#!/usr/bin/env bash
# Run the same checks as .github/workflows/ci.yml, locally, without installing anything.
# This copy of the Brain has no git remote, so the GitHub workflow never runs; use this instead.
# Usage: Brain/tools/check.sh   (needs python3 3.11+ and pytest; brainstein is used if installed)
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")/.."
export PYTHONPATH="$PWD${PYTHONPATH:+:$PYTHONPATH}" PYTHONDONTWRITEBYTECODE=1

echo "== compile"; python3 -m compileall -q scripts dataforseo_brain tests
echo "== CLI smoke"; python3 -c 'import sys; from dataforseo_brain.cli import main; sys.argv=["dataforseo-brain","--help"]; main()' >/dev/null
echo "== template vault lint"; python3 scripts/lint_vault.py --vault assets/template-brain --template
echo "== tests"; python3 -m pytest -q -p no:cacheprovider
if command -v brainstein >/dev/null; then
  echo "== brainstein validate"; brainstein validate .
fi
echo "== no em or en dashes in wiki/"
if grep -rlP '[\x{2013}\x{2014}]' wiki; then echo "dashes found in the files above" >&2; exit 1; fi
echo "All checks passed."
