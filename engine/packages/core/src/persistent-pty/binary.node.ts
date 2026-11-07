export const available = true

export async function resolveBinary() {
  return process.env.DATAFORSEO_AGENT_PTY_BIN || "dataforseo-agent-pty"
}
