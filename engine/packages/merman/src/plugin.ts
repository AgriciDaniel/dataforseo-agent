import { Plugin } from "@dataforseo-agent/plugin/tui"
import { createMermaidCodeBlockRenderer } from "./markdown.js"
import { resolveDataForSEOAgentDiagramPalette } from "./palette.js"

export default Plugin.define({
  id: "dataforseo-agent.merman",
  setup(context) {
    context.markdown.registerCodeBlockRenderer(
      "mermaid",
      createMermaidCodeBlockRenderer(context.renderer, () => ({
        colors: resolveDataForSEOAgentDiagramPalette(context.theme, context.themeMode),
      })),
    )
  },
})
