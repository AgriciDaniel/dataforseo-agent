---
type: meta
title: "Conventions"
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, meta, policy]
---

# Conventions

How notes in this brain are written. Applies to every file under `wiki/`.

## Frontmatter
- Every note has YAML frontmatter with `type`, `title`, `domain: dataforseo`, `status`, `confidence`, `created`, `updated`, `tags`.
- Module notes add `module` and `agent_description`; workflow notes add `skill`, `description` (starts "Use when"), `modules`. The bridge reads these fields, so do not rename them.
- Notes that quote prices add `prices_as_of`. Notes loaded every turn (`hot`, `cost/`, `platform/`) and module, workflow and routing notes contain no dollar figures.

## Confidence
- `confidence:` uses the four levels in `references/CONFIDENCE_TAGS.md`. Canon entries use `#confidence/<level>` tags.
- A note is only `evidence-based` if its DataForSEO facts trace to an official source or the endpoint catalog.

## Wikilinks
- Link by note name (`[[cost-model]]`), not by path. Names are unique across the vault.
- Every new note is linked from [[index]] and from at least one related note. No dead links.

## Sources and quotes
- `.raw/` holds captured source material and fixtures. It is immutable: add new files, never edit old ones.
- Notes paraphrase official docs by default. A verbatim quote is wrapped in quotation marks and followed by its source, for example: "Your account will not be charged for using Sandbox endpoints" (source: DataForSEO sandbox docs).
- Dated sources go in `references/source-ledger.json`; high-stakes claims also go in `references/claim-ledger.md`.

## One home per fact
- Endpoint paths, parameters and prices live in the catalog, not in notes. Judgement lives in one note and is linked from others.

## Publish and release
- This brain ships inside the DataForSEO Agent, not as a public site. What may be published is defined in `PUBLISHING_NOTICE.md`: `.raw/`, the claim ledger and source evidence stay private.
- No dashes (em or en) in any note.
