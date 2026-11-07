import { Plugin } from "@dataforseo-agent/plugin/tui"

// A dialog that throws while rendering (AgriciDaniel/dataforseo-agent#61101).
export default Plugin.define({
  id: "fixture.dialog-throw",
  setup(context) {
    context.ui.dialog.show(() => {
      throw new Error("dialog exploded")
    })
  },
})
