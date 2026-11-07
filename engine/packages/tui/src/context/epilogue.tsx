import { createSimpleContext } from "./helper"
import type { SessionEpilogue } from "../util/presentation"

// What the banner printed after the TUI closes should mention.
export type Epilogue = {
  session(value?: SessionEpilogue): void
}

export const { use: useEpilogue, provider: EpilogueProvider } = createSimpleContext({
  name: "Epilogue",
  init: (props: { value: Epilogue }) => props.value,
})
