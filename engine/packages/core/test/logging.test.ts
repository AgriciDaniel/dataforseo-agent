import { describe, expect, test } from "bun:test"
import path from "path"
import { Global } from "@dataforseo-agent/util/global"
import { Logging } from "@dataforseo-agent/util/observability/logging"

describe("Logging", () => {
  test("uses a local-specific log file for local installs", () => {
    expect(Logging.file(true, "local")).toBe(path.join(Global.Path.log, "dataforseo-agent-local.log"))
  })

  test("keeps non-local installs on the default log file", () => {
    expect(Logging.file(false, "next")).toBe(path.join(Global.Path.log, "dataforseo-agent.log"))
  })
})
