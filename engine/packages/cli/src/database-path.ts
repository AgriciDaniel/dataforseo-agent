import path from "node:path"
import { DATAFORSEO_AGENT_CHANNEL } from "./version"

export function databasePath(data: string) {
  const filename =
    process.env.DATAFORSEO_AGENT_DB ??
    (["latest", "dev", "beta", "next", "prod"].includes(DATAFORSEO_AGENT_CHANNEL) ||
    process.env.DATAFORSEO_AGENT_DISABLE_CHANNEL_DB === "1" ||
    process.env.DATAFORSEO_AGENT_DISABLE_CHANNEL_DB === "true"
      ? "dataforseo-agent.db"
      : `dataforseo-agent-${DATAFORSEO_AGENT_CHANNEL.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
  return filename === ":memory:" ? filename : path.resolve(data, filename)
}
