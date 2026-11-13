# Contributing

Thanks for wanting to help. Small, focused pull requests are the easiest to review.

## Set up

You need [Bun](https://bun.sh) 1.4.4, Python 3 and Node 22 or newer.

```bash
git clone https://github.com/AgriciDaniel/dataforseo-agent.git
cd dataforseo-agent/engine
bun install --frozen-lockfile
bun run dev            # runs the app from source
```

## Before you open a pull request

Run the checks for the package you changed. Do not run tests from the `engine` root.

```bash
cd engine/packages/util && bun run typecheck && bun test
cd engine/packages/tui  && bun run typecheck && bun test --timeout 30000
cd engine/packages/core && bun run typecheck
cd Brain && python -m pytest -q tests
```

## Ground rules

- **Never spend money in a test.** Tests must not call `api.dataforseo.com`. Use the sandbox, a
  fixture or a fake.
- **Never commit credentials.** Keys live in `~/.config/dataforseo-agent/credentials.env` or your
  own env file, not in the repo.
- **Keep the cost guard strict.** A change that lets a paid call run without the approval prompt or
  past the session budget will not be merged.
- The engine is a fork of an upstream terminal agent. Keep changes to shared engine files small, and
  put DataForSEO features in their own files where you can, so upstream updates stay easy to merge.
- Match the style of the code around your change, and do not add a dependency without saying why.

## Where things live

- `engine/packages/tui`: the terminal interface.
- `engine/packages/core`: the agent, tools and the approval gate for paid calls.
- `engine/packages/util`: charts, the price catalog and DataForSEO helpers.
- `Brain`: the DataForSEO knowledge base, agents and workflow skills.
- `tools`: install, setup, update and the launcher.
