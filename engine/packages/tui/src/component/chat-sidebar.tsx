// DataForSEO Agent: the chat sidebar on the left, like an AI chat app. The brand header, a new chat button, a
// search box, the chats (open session tabs, then recently closed ones under "Earlier"), and at the bottom the
// current session's DataForSEO account, context and MCP panels (the "sidebar.content" slot that used to sit in
// the right sidebar). It folds away with the sidebar keybind or the "«" control.
import { RGBA, TextAttributes } from "@opentui/core"
import { For, Show, createMemo, createSignal } from "solid-js"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useRoute } from "../context/route"
import { useSessionTabs } from "../context/session-tabs"
import { Slot } from "../plugin/render"
import { MARK, markCells } from "../logo"
import { tint } from "../theme/color"

const colors = new Map<string, RGBA>()
const hex = (value: string | undefined) => {
  if (!value) return undefined
  const known = colors.get(value)
  if (known) return known
  const color = RGBA.fromHex(value)
  colors.set(value, color)
  return color
}

/** Keeps the titles that match a search, ignoring case. An empty search keeps everything. */
export function filterChats<T extends { title: string }>(chats: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  return q === "" ? [...chats] : chats.filter((chat) => chat.title.toLowerCase().includes(q))
}

export function ChatSidebar(props: { width: number; onClose: () => void }) {
  const theme = useTheme()
  const data = useData()
  const route = useRoute()
  const tabs = useSessionTabs()
  const [query, setQuery] = createSignal("")
  const [hovered, setHovered] = createSignal<string>()
  const background = () => theme.background.raised.base
  const hover = () => tint(background(), theme.background.raised.high, 0.9)
  const selected = () => theme.background.raised.high
  const current = () => (route.data.type === "session" ? route.data.sessionID : undefined)
  const title = (sessionID: string, fallback: string | undefined) => data.session.get(sessionID)?.title || fallback || "New chat"
  const chats = createMemo(() =>
    filterChats(
      tabs.tabs().map((tab) => ({ sessionID: tab.sessionID, title: title(tab.sessionID, tab.title) })),
      query(),
    ),
  )
  const earlier = createMemo(() =>
    filterChats(
      tabs.recentlyClosed().map((tab) => ({ sessionID: tab.sessionID, title: tab.title || "Untitled chat" })),
      query(),
    ).slice(0, 12),
  )
  const inner = () => Math.max(8, props.width - 4)
  const cut = (text: string, n: number) => ([...text].length > n ? [...text].slice(0, n - 1).join("") + "…" : text)

  const Row = (row: { sessionID: string; title: string; earlier?: boolean }) => {
    const active = () => !row.earlier && current() === row.sessionID
    const status = () => (row.earlier ? undefined : tabs.status(row.sessionID))
    return (
      <box
        id={`chat-sidebar-chat-${row.sessionID}`}
        flexDirection="row"
        flexShrink={0}
        height={1}
        backgroundColor={active() ? selected() : hovered() === row.sessionID ? hover() : background()}
        onMouseOver={() => setHovered(row.sessionID)}
        onMouseOut={() => setHovered((value) => (value === row.sessionID ? undefined : value))}
        onMouseUp={() => (row.earlier ? tabs.reopen(row.sessionID) : tabs.select(row.sessionID))}
      >
        {/* The accent bar marks the chat on screen, as in the chat apps. */}
        <text fg={active() ? theme.hue.interactive[200] : background()} flexShrink={0} selectable={false}>
          ▌
        </text>
        <text
          fg={row.earlier ? theme.text.muted : active() ? theme.text.base : theme.text.muted}
          attributes={active() ? TextAttributes.BOLD : undefined}
          wrapMode="none"
          flexGrow={1}
          minWidth={0}
          selectable={false}
        >
          {" " + cut(row.title, inner() - 4)}
        </text>
        <Show when={status()?.busy || status()?.attention}>
          <text
            fg={status()?.attention ? theme.hue.accent[200] : theme.text.feedback.info.base}
            flexShrink={0}
            selectable={false}
          >
            {"• "}
          </text>
        </Show>
        <Show when={!row.earlier && hovered() === row.sessionID}>
          <text
            id={`chat-sidebar-close-${row.sessionID}`}
            fg={theme.text.muted}
            flexShrink={0}
            selectable={false}
            onMouseUp={(event: { stopPropagation(): void }) => {
              event.stopPropagation()
              tabs.close(row.sessionID)
            }}
          >
            {"× "}
          </text>
        </Show>
      </box>
    )
  }

  return (
    <box
      id="chat-sidebar"
      width={props.width}
      height="100%"
      flexShrink={0}
      flexDirection="column"
      backgroundColor={background()}
      paddingTop={1}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Brand header: the DataForSEO mark, exactly as in the main logo, with the name on its middle row. */}
      <box flexDirection="row" flexShrink={0} height={3} gap={2}>
        <box flexDirection="column" flexShrink={0} width={MARK[0].length}>
          <For each={markCells()}>
            {(row) => (
              <box flexDirection="row" height={1} width={MARK[0].length}>
                <For each={row}>
                  {(cell) => (
                    <text fg={hex(cell.fg)} bg={hex(cell.bg)} selectable={false}>
                      {cell.char}
                    </text>
                  )}
                </For>
              </box>
            )}
          </For>
        </box>
        <box flexGrow={1} minWidth={0} justifyContent="center">
          <text fg={theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none" selectable={false}>
            DataForSEO
          </text>
        </box>
        <box flexShrink={0} justifyContent="center">
          <text id="chat-sidebar-fold" fg={theme.text.muted} selectable={false} onMouseUp={props.onClose}>
            «
          </text>
        </box>
      </box>
      <box height={1} flexShrink={0} />
      <box
        id="chat-sidebar-new"
        flexShrink={0}
        border={["top", "bottom", "left", "right"]}
        borderStyle="rounded"
        borderColor={theme.hue.interactive[200]}
        paddingLeft={1}
        onMouseUp={() => tabs.add()}
      >
        <text fg={theme.text.base} selectable={false}>
          + New chat
        </text>
      </box>
      <box flexDirection="row" flexShrink={0} paddingLeft={1} paddingTop={1} gap={1}>
        <text fg={theme.text.muted} flexShrink={0} selectable={false}>
          ⌕
        </text>
        <input
          id="chat-sidebar-search"
          flexGrow={1}
          placeholder="Search chats"
          placeholderColor={theme.text.muted}
          textColor={theme.text.base}
          focusedTextColor={theme.text.base}
          backgroundColor={background()}
          focusedBackgroundColor={theme.background.formfield.base}
          onInput={(value: string) => setQuery(value)}
        />
      </box>
      <box height={1} flexShrink={0} />
      <text fg={theme.text.base} attributes={TextAttributes.BOLD} flexShrink={0} paddingLeft={1} selectable={false}>
        Chats
      </text>
      <scrollbox flexGrow={1} minHeight={2} horizontalScrollbarOptions={{ visible: false }}>
        <For each={chats()}>{(chat) => <Row sessionID={chat.sessionID} title={chat.title} />}</For>
        <Show when={chats().length === 0 && earlier().length === 0}>
          <text fg={theme.text.muted} paddingLeft={2} selectable={false}>
            {query() ? "No chats match" : "No chats yet"}
          </text>
        </Show>
        <Show when={earlier().length > 0}>
          <text fg={theme.text.muted} paddingLeft={1} paddingTop={1} selectable={false}>
            Earlier
          </text>
          <For each={earlier()}>{(chat) => <Row sessionID={chat.sessionID} title={chat.title} earlier />}</For>
        </Show>
      </scrollbox>
      {/* The current chat's account, context and MCP panels, formerly the right sidebar. */}
      <Show when={current()} keyed>
        {(sessionID) => (
          <box flexShrink={0} flexDirection="column">
            <text fg={tint(background(), theme.text.muted, 0.5)} wrapMode="none" selectable={false}>
              {"─".repeat(Math.max(1, props.width - 2))}
            </text>
            {/* Pinned to the bottom; on a short screen it keeps its rows and the chats list scrolls instead. */}
            <box flexShrink={0} gap={1} paddingLeft={1} paddingRight={1} paddingBottom={1}>
              <Slot path="sidebar.content" input={{ sessionID }} />
            </box>
          </box>
        )}
      </Show>
    </box>
  )
}

/** The "»" that brings the folded chat sidebar back, in the top left corner. */
export function ChatSidebarUnfold(props: { onOpen: () => void }) {
  const theme = useTheme()
  return (
    <box id="chat-sidebar-unfold" position="absolute" left={0} top={0} zIndex={50} onMouseUp={props.onOpen}>
      <text fg={theme.text.muted} selectable={false}>
        »
      </text>
    </box>
  )
}
