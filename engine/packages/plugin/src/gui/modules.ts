// The module lists only: `gui()` reads them at build time, so this file imports nothing.

/**
 * The modules a plugin's `./gui-experimental` bundle may require that both processes provide, each its own instance.
 * Main maps `@dataforseo-agent/plugin/gui` to the main SDK and a window maps `@dataforseo-agent/plugin/gui/main` to the window SDK:
 * both export the same `Plugin`, `Store`, `Ipc`, `Contract` and `Registry`, so one definition and contract serve both
 * processes. `@dataforseo-agent/plugin/rpc` is here because a plugin's `./rpc` contract imports it, and its GUI imports that
 * contract.
 */
export const pluginSharedModules = [
  "effect",
  "@dataforseo-agent/plugin/gui",
  "@dataforseo-agent/plugin/gui/main",
  "@dataforseo-agent/plugin/rpc",
  "@dataforseo-agent/schema/rpc",
  "@dataforseo-agent/client",
  "@dataforseo-agent/client/effect",
] as const

/**
 * The modules only a window provides to a plugin's `./gui-experimental` bundle; main gives the bundle an inert
 * placeholder.
 */
export const pluginWindowModules = [
  "solid-js",
  "solid-js/web",
  "solid-js/store",
  "@dataforseo-agent/plugin/gui/file",
  "@dataforseo-agent/plugin/gui/review",
  "@dataforseo-agent/plugin/gui/browser",
  "@dataforseo-agent/client/solid",
] as const

/** A module name in `pluginSharedModules` or `pluginWindowModules`. */
export type PluginModule = (typeof pluginSharedModules)[number] | (typeof pluginWindowModules)[number]
