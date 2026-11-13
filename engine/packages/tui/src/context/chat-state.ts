import type { useTheme } from "./theme"

export const chatStates = ["approval", "question", "error", "working", "done", "idle"] as const
export type ChatState = (typeof chatStates)[number]

export type ChatStatus = {
  attention: "permission" | "question" | false
  busy: boolean
  failed: boolean
  unread?: "error" | "activity"
}

export function chatState(status: ChatStatus): ChatState {
  if (status.attention === "permission") return "approval"
  if (status.attention === "question") return "question"
  if (status.failed) return "error"
  if (status.busy) return "working"
  if (status.unread) return "done"
  return "idle"
}

export const chatMarkers: Record<ChatState, string> = {
  approval: "!",
  question: "?",
  error: "×",
  working: "·",
  done: "●",
  idle: "",
}

export function chatNeedsUser(state: ChatState) {
  return state === "approval" || state === "question"
}

export function chatStateColor(state: ChatState, theme: ReturnType<typeof useTheme>) {
  if (state === "approval") return theme.text.feedback.warning.base
  if (state === "question" || state === "working") return theme.text.feedback.info.base
  if (state === "error") return theme.text.feedback.error.base
  if (state === "done") return theme.hue.accent[200]
  return theme.text.muted
}

export type ChatPromptTarget = {
  sessionID: string
  kind: "approval" | "question"
  id: string
}

export function selectChatPrompt<P extends { id: string }, F extends { id: string }>(
  permissions: readonly P[],
  forms: readonly F[],
  target?: ChatPromptTarget,
): { permission: P | undefined; form: F | undefined } {
  const form = target?.kind === "question" ? forms.find((item) => item.id === target.id) : undefined
  if (form) return { permission: undefined, form }
  const permission =
    (target?.kind === "approval" ? permissions.find((item) => item.id === target.id) : undefined) ?? permissions[0]
  return { permission, form: permission ? undefined : forms[0] }
}
