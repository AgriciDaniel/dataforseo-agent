import { expect, test } from "bun:test"
import { ServiceStatus } from "../src/services/service-status"

test("status distinguishes empty activity from an unavailable terminal daemon", () => {
  expect(
    ServiceStatus.format({
      uptime: 65,
      runningTurns: 2,
      pendingApprovals: 3,
      pendingQuestions: 1,
      openTerminals: null,
    }),
  ).toBe("Running turns: 2\nPending approvals: 3\nPending questions: 1\nOpen terminals: unavailable\nUptime: 65s")
  expect(
    ServiceStatus.format({ uptime: 0, runningTurns: 0, pendingApprovals: 0, pendingQuestions: 0, openTerminals: 0 }),
  ).toContain("Open terminals: 0")
})
