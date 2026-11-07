# DataForSEO Agent: the app

Use this guide for questions about the DataForSEO Agent app itself: setup, settings, models, commands,
charts, files and troubleshooting. For DataForSEO API questions, use the Brain, the catalog and the
workflow skills instead.

## Start and set up

- `dataforseo` (or `dataforseo-agent`) starts the app in the current folder. Saved charts and reports go to
  `./dataforseo-exports/` in that folder.
- `dataforseo-agent-setup` (run it in a terminal, not through the model) connects the DataForSEO account,
  sets the session budget and default market, and connects a model. The password is stored only in
  `~/.config/dataforseo-agent/credentials.env` (readable only by the user), or the setup points to an env
  file the user already keeps; only `DATAFORSEO_*` lines are read from it.
- `dataforseo-agent --check-account` checks the login and balance with the free `user_data` endpoint.
- `dataforseo-agent-update` pulls engine updates and regenerates agents and skills.
- Never ask the user to paste a DataForSEO password into the chat. Send them to `dataforseo-agent-setup`.

## Settings

`~/.config/dataforseo-agent/settings.json` holds `budget_per_session_usd` (a hard stop), `ask_above_usd`,
`default_location_code`, `default_language_code` and `prefer_mode` (cheapest, standard or live).
`/dfs-settings` shows and changes them. The sidebar shows balance, today's spend against the daily limit,
this session's spend against the budget, and the default market.

## Models

Any provider works. Claude through the user's Claude Code login: `dataforseo-agent auth login claude-agent`.
ChatGPT through the user's ChatGPT account: `dataforseo-agent auth login openai`. API keys (Gemini,
OpenAI, Anthropic, OpenRouter and others): `/connect` in the app, or the provider's usual environment
variable. Pick a model with `/models`.

## Commands

- `/dfs-route <question>`: the right endpoint and mode, with cost, without spending.
- `/dfs-cost <plan>`: a priced estimate.
- `/dfs-balance`: balance and limits (free).
- `/dfs-endpoint <path>`: one endpoint explained, with parameters, modes, limits and price.
- `/dfs-news`: what changed at DataForSEO lately.
- `/dfs-settings`: show or change budget, market and mode.
- `/models`, `/connect`, `/help`, and ctrl+p for every command.

## Spending gate

Every paid DataForSEO request shows a permission prompt with the method, path and request body. "Allow
once" runs it. "Always allow" applies to that one endpoint path only. "Reject" is final for that call.
Free endpoints (task results, lists, `user_data`, docs search) run without a prompt.
This prompt is the only approval: state the estimate in chat, then make the call, and do not also ask
"Run it for $X?" in chat, or the user approves the same call twice.

## Charts

The `chart` tool draws table, kpi, hbar, grouped-bar, share-bar, diverging-bar, line, sparkline, scatter,
heatmap, geogrid (local rank grids) and tilemap (US states). In the app, each chart has `[table]`,
`[copy CSV]`, `[save CSV]`, `[save report]` (one HTML file with every chart in the session) and
`[full screen]`. Clicking a table header sorts it. Pointing at a bar, marker or tile shows its value.

## Files

- Config, agents, skills, commands and catalog pages: `~/.config/dataforseo-agent/` (regenerated from the
  Brain; edit the Brain, not these files). The user's own overrides go in
  `~/.config/dataforseo-agent/dataforseo-agent.jsonc`, which is never overwritten.
- A project can add its own config in `dataforseo-agent.json` or a `.dataforseo-agent/` folder, plus an
  `AGENTS.md` with project notes.
- Sessions and logs: `~/.local/share/dataforseo-agent/`.

## Troubleshooting

- "Not connected" in the sidebar: run `dataforseo-agent-setup`, or set `DATAFORSEO_LOGIN` and
  `DATAFORSEO_PASSWORD`.
- `status_code` 40100 or 401: wrong API login or password (the API password is not the account password).
- 40200 or "payment required": the balance is too low.
- The `dataforseo` MCP server fails to start: it needs Node.js (`npx`). `dataforseo-agent mcp list` shows
  its status.
- A model is missing: connect its provider first, then `/models`.
