# Operator kit

Maintenance of the DataForSEO Brain. Maturity and audit score: see the dated runs in `_review/`.

## Monthly refresh
1. Refresh the endpoint catalog (app repo `research/`), then re-check every path in `wiki/routing/`, `wiki/modules/` and `wiki/workflows/` against it.
2. Read the DataForSEO updates feed; log changes in `wiki/log.md` and update `wiki/hot.md`.
3. Re-verify `references/source-ledger.json` and `references/claim-ledger.md`; set new `refresh_due` dates.
4. Run `brainstein validate .` and `brainstein audit-brain --checklist .` from `Brain/`; save outputs under `_review/`.
5. Regenerate the agent config with the bridge script and smoke-test the app.

## Rules
- Follow `wiki/meta/CONVENTIONS.md` and the policies in `wiki/meta/`.
- Keep `wiki/hot.md` + `wiki/cost/` + `wiki/platform/` under about 25 KB (loaded every turn).
- No paid API calls during maintenance without approval; use the sandbox.
- Archive, do not delete: superseded files go to `_review/archive/`.
