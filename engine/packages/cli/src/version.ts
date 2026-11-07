import { Option, Schema } from "effect"

declare const DATAFORSEO_AGENT_VERSION: string
declare const DATAFORSEO_AGENT_CHANNEL: string
declare const DATAFORSEO_AGENT_ARTIFACT: string
declare const DATAFORSEO_AGENT_RELEASE_HIGHLIGHTS: string

const version = typeof DATAFORSEO_AGENT_VERSION === "string" ? DATAFORSEO_AGENT_VERSION : "local"
const channel = typeof DATAFORSEO_AGENT_CHANNEL === "string" ? DATAFORSEO_AGENT_CHANNEL : "local"
const artifact = typeof DATAFORSEO_AGENT_ARTIFACT === "string" ? DATAFORSEO_AGENT_ARTIFACT : "cli"
// Stable release builds embed the release notes' Highlights; every other build has none.
const highlights =
  typeof DATAFORSEO_AGENT_RELEASE_HIGHLIGHTS === "string"
    ? Option.getOrElse(
        Schema.decodeUnknownOption(
          Schema.fromJsonString(Schema.Array(Schema.Struct({ title: Schema.String, body: Schema.String }))),
        )(DATAFORSEO_AGENT_RELEASE_HIGHLIGHTS),
        () => [],
      )
    : []

export {
  version as DATAFORSEO_AGENT_VERSION,
  channel as DATAFORSEO_AGENT_CHANNEL,
  artifact as DATAFORSEO_AGENT_ARTIFACT,
  highlights as DATAFORSEO_AGENT_HIGHLIGHTS,
}
export const DATAFORSEO_AGENT_LOCAL = channel === "local"
