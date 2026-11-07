import { ensurePluginRuntime, provides } from "@dataforseo-agent/plugin/runtime"
import { Plugin, PluginContextProvider, usePlugin } from "@dataforseo-agent/plugin/tui"
import { ensureRuntimePluginSupport } from "@opentui/solid/runtime-plugin-support/configure"

ensurePluginRuntime()
ensureRuntimePluginSupport({
  additional: {
    "@dataforseo-agent/plugin/tui": { Plugin, PluginContextProvider, usePlugin },
  },
  preserve: provides,
})
