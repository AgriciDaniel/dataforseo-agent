# DataForSEO Brain

The knowledge layer of the DataForSEO Agent: source-cited operating memory for the DataForSEO v3 API.

## Buyer
SEO engineers, agencies and AI-search (GEO) builders who use DataForSEO and want an agent that picks the
right endpoint, prices it before spending, and runs proven workflows.

## Outputs
Routing table, one note per API module (sub-agents), workflow skills with cost formulas, cost and platform
rules loaded every turn, claim ledger and canon of official facts. See `SKILL.md`.

## Boundaries
DataForSEO only; read-only; prices and endpoint parameters come from the endpoint catalog; no paid call
without approval. Full list: `docs/PRODUCT_BOUNDARIES.md`. Publishing rules: `PUBLISHING_NOTICE.md`.

## Quick start
Read `wiki/hot.md`, then `wiki/routing/which-api-for-which-job.md`, then the module note and workflow you
need. Maintenance steps: `docs/OPERATOR_KIT.md`.

## Maturity
Recorded per Brainstein run in `_review/` with date, status and score; not claimed here.

`assets/template-brain/`, `examples/`, `CHANGELOG.md`, `RELEASE_CHECKLIST.md` and `.github/workflows/ci.yml`
support Brainstein validation and the brain's own tests; the agent bridge ignores them.
This copy has no git remote, so the CI workflow never runs here; `tools/check.sh` runs the same checks locally.
