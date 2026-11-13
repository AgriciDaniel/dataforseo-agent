import { createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { useData } from "../context/data"
import { useSessionTabs } from "../context/session-tabs"
import { useRoute } from "../context/route"
import { useTheme } from "../context/theme"
import {
  chatMarkers,
  chatNeedsUser,
  chatStateColor,
  chatStates,
  type ChatPromptTarget,
  type ChatState,
} from "../context/chat-state"
import { useDialog } from "../ui/dialog"
import { DialogSelect } from "../ui/dialog-select"
import { permissionPresentation } from "../util/permission"

export type ActivityRow = {
  sessionID: string
  title: string
  agent?: string
  state: ChatState
  reason: string
  target?: ChatPromptTarget
}

export function filterActivity(rows: readonly ActivityRow[], query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return rows
    .filter((row) => {
      const text = `${row.title} ${row.agent ?? ""} ${row.state} ${row.reason}`.toLowerCase()
      return words.every((word) => text.includes(word))
    })
    .toSorted((a, b) => chatStates.indexOf(a.state) - chatStates.indexOf(b.state))
}

export function activityFinished(idle: number | undefined, now: number) {
  if (idle === undefined) return "finished"
  const seconds = Math.max(0, Math.floor((now - idle) / 1000))
  if (seconds < 60) return "finished just now"
  if (seconds < 3600) return `finished ${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `finished ${Math.floor(seconds / 3600)}h ago`
  return `finished ${Math.floor(seconds / 86400)}d ago`
}

export function DialogActivity() {
  const data = useData()
  const tabs = useSessionTabs()
  const route = useRoute()
  const theme = useTheme().surface("dialog")
  const dialog = useDialog()
  const [query, setQuery] = createSignal("")
  const [now, setNow] = createSignal(Date.now())
  const timer = setInterval(() => setNow(Date.now()), 30_000)
  onCleanup(() => clearInterval(timer))
  onMount(() => dialog.setSize("large"))

  const rows = createMemo(() =>
    tabs.tabs().flatMap((tab) => {
      const root = data.session.get(tab.sessionID)
      const members = Array.from(new Set([tab.sessionID, ...data.session.family(tab.sessionID)]))
      const row = (sessionID: string, state: ChatState): ActivityRow => {
        const session = data.session.get(sessionID)
        // Root rows represent the family; child rows target only that child's prompt.
        const sources = sessionID === tab.sessionID ? members : [sessionID]
        const permission =
          state === "approval" ? sources.flatMap((id) => data.session.permission.list(id) ?? [])[0] : undefined
        const form = state === "question" ? sources.flatMap((id) => data.session.form.list(id) ?? [])[0] : undefined
        const messages = sources.flatMap((id) => data.session.message.list(id) ?? [])
        const tool = messages
          .toReversed()
          .flatMap((message) =>
            message.type === "assistant"
              ? message.content.filter((part) => part.type === "tool" && part.state.status === "running")
              : [],
          )[0]
        const failure = messages.toReversed().find((message) => message.type === "idle" && message.outcome === "failed")
        const source = permission?.source
        const message = source ? data.session.message.get(permission!.sessionID, source.messageID) : undefined
        const part =
          message?.type === "assistant"
            ? message.content.find((part) => part.type === "tool" && part.id === source?.id)
            : undefined
        const permissionTitle = permission
          ? permissionPresentation({
              ...permission,
              input: part?.type === "tool" && part.state.status !== "streaming" ? part.state.input : undefined,
              toolMetadata:
                part?.type === "tool" && part.state.status !== "streaming" ? part.state.metadata : undefined,
            }).title
          : undefined
        const running =
          tool?.type === "tool" && tool.state.status === "running"
            ? typeof tool.state.metadata.title === "string" && tool.state.metadata.title
              ? tool.state.metadata.title
              : tool.name
            : session?.title || "agent"
        const reason = permission
          ? `waiting for approval: ${permissionTitle}`
          : form
            ? `asked a question: ${form.title}`
            : state === "error"
              ? `last turn failed${failure?.type === "idle" && failure.error ? `: ${failure.error.message}` : ""}`
              : state === "working"
                ? `running: ${running}`
                : state === "done"
                  ? activityFinished(root?.time.idle, now())
                  : "idle"
        return {
          sessionID,
          title:
            sessionID === tab.sessionID
              ? root?.title || tab.title || "New chat"
              : `${root?.title || tab.title || "New chat"} / ${session?.title || "Child agent"}`,
          agent: sessionID === tab.sessionID ? undefined : session?.agent || "Subagent",
          state,
          reason,
          target: permission
            ? { sessionID: tab.sessionID, kind: "approval", id: permission.id }
            : form
              ? { sessionID: tab.sessionID, kind: "question", id: form.id }
              : undefined,
        }
      }
      return [
        row(tab.sessionID, tabs.state(tab.sessionID)),
        ...members
          .filter((id) => id !== tab.sessionID)
          .flatMap((id) => {
            const state = tabs.memberStatus(id).state
            return state === "working" || chatNeedsUser(state) ? [row(id, state)] : []
          }),
      ]
    }),
  )
  const options = createMemo(() =>
    filterActivity(rows(), query()).map((row) => ({
      title: row.agent ? `${row.title} (${row.agent})` : row.title,
      category: row.state,
      description: row.reason,
      detail: row.reason,
      value: row.sessionID,
      gutter: () => <text fg={chatStateColor(row.state, theme)}>{chatMarkers[row.state] || " "}</text>,
      onSelect: () => {
        if (row.target) tabs.focusPrompt(row.target)
        else route.navigate({ type: "session", sessionID: row.sessionID })
        dialog.clear()
      },
    })),
  )

  return (
    <DialogSelect
      title="Activity"
      searchInTitle
      titlePlaceholder="Search chats or states"
      placeholder="Search chats or states"
      options={options()}
      skipFilter
      onFilter={setQuery}
      emptyView={<text fg={theme.text.muted}>No open chats</text>}
      noMatchView={<text fg={theme.text.muted}>No matching activity</text>}
    />
  )
}
