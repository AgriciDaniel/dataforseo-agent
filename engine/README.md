<p align="center">
  <a href="https://github.com/AgriciDaniel/dataforseo-agent">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="DataForSEO Agent logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://github.com/AgriciDaniel/dataforseo-agent"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/@dataforseo-agent/cli"><img alt="npm" src="https://img.shields.io/npm/v/@dataforseo-agent/cli?style=flat-square" /></a>
  <a href="https://github.com/AgriciDaniel/dataforseo-agent/actions/workflows/release.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/AgriciDaniel/dataforseo-agent/release.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![DataForSEO Agent Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/AgriciDaniel/dataforseo-agent)

---

### Installation

```bash
# YOLO
curl -fsSL https://github.com/AgriciDaniel/dataforseo-agent | bash

# Package managers
npm i -g @dataforseo-agent/cli@latest      # or bun/pnpm/yarn
brew install anomalyco/tap/dataforseo-agent-v2 # macOS and Linux (recommended, always up to date)
brew install dataforseo-agent              # macOS and Linux (official brew formula, updated less)
sudo pacman -S dataforseo-agent            # Arch Linux (Stable)
paru -S dataforseo-agent-beta              # Arch Linux (Latest from AUR)
mise use -g dataforseo-agent               # Any OS
nix run github:AgriciDaniel/dataforseo-agent  # Nix
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

DataForSEO Agent is also available as a desktop application. Download it from [dataforseo-agent.ai/download](https://github.com/AgriciDaniel/dataforseo-agent).

| Platform              | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `dataforseo-agent-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `dataforseo-agent-desktop-mac-x64.dmg`     |
| Windows               | `dataforseo-agent-desktop-win-x64.exe`     |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`     |

```bash
# macOS (Homebrew)
brew install --cask dataforseo-agent-desktop
```

#### Installation Directory

The install script installs DataForSEO Agent to `$HOME/.dataforseo-agent/bin`.

### Agents

DataForSEO Agent includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://github.com/AgriciDaniel/dataforseo-agent).

### Documentation

For more info on how to configure DataForSEO Agent, [**head over to our docs**](https://github.com/AgriciDaniel/dataforseo-agent).

### Contributing

If you're interested in contributing to DataForSEO Agent, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on DataForSEO Agent

If you are working on a project that's related to DataForSEO Agent and is using "dataforseo-agent" as part of its name, for example "dataforseo-agent-dashboard" or "dataforseo-agent-mobile", please add a note to your README to clarify that it is not built by the DataForSEO Agent team and is not affiliated with us in any way.

---

**Join our community** [Discord](https://discord.gg/dataforseo-agent) | [X.com](https://x.com/dataforseo-agent)
