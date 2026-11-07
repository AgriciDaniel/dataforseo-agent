# Rebuilding the catalog

Scripts used to build `../endpoints.json` and `../endpoints.md` on 2026-11-06. They expect a work dir with:
`dl/OpenApiDocumentation` and `dl/mcp-server-typescript-deprecated` (git clones), `docs/` (every llms.txt page
saved as `path__with__underscores.md`), `pricing/` (dataforseo.com/pricing pages as HTML) and `brain_paths.txt`.

Order: `pricing.py pricing/ pricing_rows.json`, dedupe to `pricing_uniq.json` (see build notes), `v2tools.py`,
`build.py WORK WORK/endpoints.json`, `finalize.py WORK ../`, `gen_md.py WORK ../`. Run Python with `-I`.
