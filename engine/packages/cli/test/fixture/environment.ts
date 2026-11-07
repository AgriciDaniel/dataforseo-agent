import os from "node:os"
import path from "node:path"

// Each isolated home gets its own XDG_CACHE_HOME, where Bun would otherwise keep its transpiler cache,
// so every spawned CLI process would transpile the source from scratch. Share one cache instead.
export const transpilerCache = path.join(os.tmpdir(), "dataforseo-agent-test-transpiler-cache")

export function isolatedEnv(root: string, overrides: Record<string, string | undefined> = {}) {
  return {
    ...process.env,
    BUN_RUNTIME_TRANSPILER_CACHE_PATH: transpilerCache,
    HOME: root,
    DATAFORSEO_AGENT_CLI_CONFIG_CONTENT: undefined,
    DATAFORSEO_AGENT_CONFIG_CONTENT: "{}",
    DATAFORSEO_AGENT_CONFIG_DIR: path.join(root, "config"),
    DATAFORSEO_AGENT_DB: path.join(root, "dataforseo-agent.db"),
    DATAFORSEO_AGENT_DISABLE_FILEWATCHER: "true",
    DATAFORSEO_AGENT_DISABLE_MODELS_FETCH: "true",
    DATAFORSEO_AGENT_TEST_HOME: root,
    XDG_CACHE_HOME: path.join(root, "cache"),
    XDG_CONFIG_HOME: path.join(root, "xdg-config"),
    XDG_DATA_HOME: path.join(root, "data"),
    XDG_STATE_HOME: path.join(root, "state"),
    ...overrides,
  }
}
