# Changelog

All notable changes to DataForSEO Agent. Versions follow `tools/VERSION`.

## Unreleased

### Added
- Results pane: on a wide terminal the session's charts stay in view on the right, with previous
  and next. `/results` shows or hides it.
- Home screen stage: the three bots walk past six DataForSEO stations (keyword ideas, Google
  results, site audit, backlinks, local rank grid, AI answers) and work each one.
- Home starter prompts for common jobs.
- Balance and session spend in the prompt footer.
- Four more chart types: distribution, overlap, gauge and donut (16 in total).
- Durable cost guard: session spend is kept on disk and survives a restart, paid calls reserve their
  estimated cost before they are sent, and a call with an unknown outcome is never sent twice.
- Chat states in the sidebar (approval, question, error, working, finished) with a "need you"
  line, and `/activity`: every chat and child agent by state, with search.
- Detach and resume: quitting keeps chats and pending approvals alive under the background service,
  the last chat, pending prompts and terminals come back on start, `/detach`, and
  `service status` shows what is running. `service restart` now hands terminals over.
- Notifications entry in the command palette.
- CI: typecheck and tests on every push and pull request.
- Privacy and network section in the README.

### Changed
- Charts: a width cap, KPI cards with the previous value, evenly labelled axes, readable heatmap
  headers, one share bar with an aligned legend, series names beside grouped bars, and one quiet
  action line under each chart.
- Paid call prompt: four rows that lead with the price, then the endpoint, the parameters and the
  choices. Full screen still shows the whole request body.
- Chat sidebar: compact header with the logo mark, a filled New chat button, an Account panel with
  a full width budget bar, and lower panels that scroll on short screens.

## 0.1.0

First version: the DataForSEO expert in the terminal, with a cost guard that asks before every paid
call, 12 API specialists, 33 workflow skills, charts and an HTML report.
