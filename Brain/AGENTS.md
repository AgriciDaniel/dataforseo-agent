# DataForSEO Brain Agent Instructions

The canonical agent entrypoint is `SKILL.md`; this file exists for agent
runtimes that load project-level `AGENTS.md` instructions.

## Read Order

1. `SKILL.md`
2. `wiki/hot.md` (what is current and what is stale)
3. `wiki/routing/which-api-for-which-job.md` (router)
4. `references/source-ledger.json`
5. `_review/REVIEW.md` (2026-11-06 audit and target structure)

## Operating Rules

- Do not call this brain market-ready unless `brainstein audit` reports
  market-ready.
- A scaffold is not a finished brain.
- Domain-specific claims require dated trustworthy sources.
- Research evidence must be recorded in `references/source-ledger.json`.
- Adapter completion must be recorded in `references/adapter-manifest.json`.
- Preserve `.raw/` as immutable source material.
- Keep Obsidian `wiki/`, `CODEX.md`, dashboards, canvases, frontmatter,
  wikilinks, graph hygiene, and source citations healthy.
- V1 is advisory and read-only unless a future release defines approval and
  rollback for mutations.

## Verification

```bash
python -m compileall scripts dataforseo_brain tests
python tests/test_pipeline.py
brainstein audit-brain --checklist .
python scripts/package_release.py --version 0.1.0
```
