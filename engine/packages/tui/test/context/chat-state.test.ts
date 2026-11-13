import { describe, expect, test } from "bun:test"
import { resolveTheme, selectTheme } from "@dataforseo-agent/theme/tui"
import { getDataForSEOAgentTheme } from "../../src/theme"
import {
  chatMarkers,
  chatNeedsUser,
  chatState,
  chatStateColor,
  chatStates,
  selectChatPrompt,
  type ChatStatus,
} from "../../src/context/chat-state"

const idle: ChatStatus = { attention: false, busy: false, failed: false }

describe("chat state", () => {
  test("uses the specified priority for overlapping signals", () => {
    expect(chatStates).toEqual(["approval", "question", "error", "working", "done", "idle"])
    expect(chatState({ attention: "permission", failed: true, busy: true, unread: "activity" })).toBe("approval")
    expect(chatState({ attention: "question", failed: true, busy: true, unread: "error" })).toBe("question")
    expect(chatState({ ...idle, failed: true, busy: true, unread: "error" })).toBe("error")
    expect(chatState({ ...idle, busy: true, unread: "activity" })).toBe("working")
    expect(chatState({ ...idle, unread: "activity" })).toBe("done")
    expect(chatState(idle)).toBe("idle")
  })

  test("a seen failed turn remains an error while a seen success is idle", () => {
    expect(chatState({ ...idle, failed: true })).toBe("error")
    expect(chatState({ ...idle, unread: "activity" })).toBe("done")
    expect(chatState({ ...idle, unread: undefined })).toBe("idle")
  })

  test("only approvals and questions need the user and markers occupy one cell", () => {
    expect(chatStates.filter(chatNeedsUser)).toEqual(["approval", "question"])
    expect(chatStates.map((state) => [...chatMarkers[state]].length)).toEqual([1, 1, 1, 1, 1, 0])
  })

  test("uses semantic feedback colors and the accent for done in both theme modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const theme = resolveTheme(selectTheme(getDataForSEOAgentTheme(), mode))
      expect(chatStateColor("approval", theme)).toBe(theme.text.feedback.warning.base)
      expect(chatStateColor("question", theme)).toBe(theme.text.feedback.info.base)
      expect(chatStateColor("error", theme)).toBe(theme.text.feedback.error.base)
      expect(chatStateColor("working", theme)).toBe(theme.text.feedback.info.base)
      expect(chatStateColor("done", theme)).toBe(theme.hue.accent[200])
      expect(chatStateColor("idle", theme)).toBe(theme.text.muted)
    }
  })
})

describe("activity prompt selection", () => {
  const permissions = [{ id: "parent-approval" }, { id: "child-approval" }]
  const forms = [{ id: "parent-question" }, { id: "child-question" }]

  test("keeps the normal approval before question ordering without a target", () => {
    expect(selectChatPrompt(permissions, forms)).toEqual({ permission: permissions[0], form: undefined })
    expect(selectChatPrompt([], forms)).toEqual({ permission: undefined, form: forms[0] })
    expect(selectChatPrompt([], [])).toEqual({ permission: undefined, form: undefined })
  })

  test("selects the requested child's approval without answering another prompt", () => {
    expect(selectChatPrompt(permissions, forms, { sessionID: "root", kind: "approval", id: "child-approval" })).toEqual(
      { permission: permissions[1], form: undefined },
    )
    expect(permissions).toHaveLength(2)
  })

  test("a requested child's question takes focus even with other approvals waiting", () => {
    expect(selectChatPrompt(permissions, forms, { sessionID: "root", kind: "question", id: "child-question" })).toEqual(
      { permission: undefined, form: forms[1] },
    )
    expect(forms).toHaveLength(2)
  })

  test("falls back after a targeted prompt is answered or cancelled", () => {
    expect(selectChatPrompt(permissions, forms, { sessionID: "root", kind: "question", id: "removed" })).toEqual({
      permission: permissions[0],
      form: undefined,
    })
    expect(selectChatPrompt([], forms, { sessionID: "root", kind: "approval", id: "removed" })).toEqual({
      permission: undefined,
      form: forms[0],
    })
  })
})
