// DataForSEO Agent: the chat sidebar on the left, like an AI chat app. The brand header, a new chat button, a
// search box, the chats (open session tabs, then recently closed ones under "Earlier"), and at the bottom the
// current session's DataForSEO account, context and MCP panels (the "sidebar.content" slot that used to sit in
// the right sidebar). It folds away with the sidebar keybind or the "«" control.
import { RGBA, TextAttributes } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import { For, Show, createMemo, createSignal } from "solid-js"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useRoute } from "../context/route"
import { useSessionTabs } from "../context/session-tabs"
import { chatMarkers, chatNeedsUser, chatStateColor } from "../context/chat-state"
import { Slot } from "../plugin/render"
import { MARK_SIDEBAR, accent, markCells } from "../logo"
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

export function sidebarLayout(height: number) {
  const available = Math.max(0, height - 8)
  return {
    chats: Math.min(6, available),
    panels: Math.max(0, Math.min(22, available - 6, Math.floor(available / 2))),
  }
}

export function ChatSidebar(props: { width: number; onClose: () => void }) {
  const theme = useTheme()
  const dimensions = useTerminalDimensions()
  const layout = createMemo(() => sidebarLayout(dimensions().height))
  const data = useData()
  const route = useRoute()
  const tabs = useSessionTabs()
  const [query, setQuery] = createSignal("")
  const [hovered, setHovered] = createSignal<string>()
  const [panelRows, setPanelRows] = createSignal(0)
  const background = () => theme.background.raised.base
  const hover = () => tint(background(), theme.background.raised.high, 0.9)
  const selected = () => theme.background.raised.high
  const current = () => (route.data.type === "session" ? route.data.sessionID : undefined)
  const title = (sessionID: string, fallback: string | undefined) =>
    data.session.get(sessionID)?.title || fallback || "New chat"
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
  const waiting = createMemo(() => tabs.tabs().filter((tab) => chatNeedsUser(tabs.state(tab.sessionID))))
  const inner = () => Math.max(8, props.width - 4)
  const cut = (text: string, n: number) => ([...text].length > n ? [...text].slice(0, n - 1).join("") + "…" : text)

  const Row = (row: { sessionID: string; title: string; earlier?: boolean }) => {
    const active = () => !row.earlier && current() === row.sessionID
    const state = () => (row.earlier ? "idle" : tabs.state(row.sessionID))
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
        <Show when={state() !== "idle"}>
          <text
            id={`chat-sidebar-state-${row.sessionID}`}
            fg={chatStateColor(state(), theme)}
            flexShrink={0}
            selectable={false}
          >
            {chatMarkers[state()] + " "}
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
      {/* Brand header: the DataForSEO mark (5 by 6 pixels, the ring and its lens as in the logo) and the name on
          its middle row in the wordmark's white and gold. Each mark row is one text line, so it never runs into
          the name. */}
      <box flexDirection="row" flexShrink={0} height={3} gap={2} paddingLeft={1}>
        <box flexDirection="column" flexShrink={0} width={MARK_SIDEBAR[0].length}>
          <For each={markCells(MARK_SIDEBAR)}>
            {(row) => (
              <text wrapMode="none" selectable={false}>
                <For each={row}>
                  {(cell) => <span style={{ fg: hex(cell.fg), bg: hex(cell.bg) }}>{cell.char}</span>}
                </For>
              </text>
            )}
          </For>
        </box>
        <box flexGrow={1} minWidth={0} justifyContent="center">
          <text fg={theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none" selectable={false}>
            DataForSEO <span style={{ fg: hex(accent) }}>Agent</span>
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
        height={1}
        backgroundColor={tint(background(), theme.hue.interactive[200], hovered() === "new" ? 0.5 : 0.3)}
        paddingLeft={1}
        onMouseOver={() => setHovered("new")}
        onMouseOut={() => setHovered((value) => (value === "new" ? undefined : value))}
        onMouseUp={() => tabs.add()}
      >
        <text fg={theme.text.base} attributes={TextAttributes.BOLD} selectable={false}>
          + New chat
        </text>
      </box>
      <box flexDirection="row" flexShrink={0} height={1} paddingLeft={1} gap={1}>
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
      <box height={1} flexShrink={0} paddingLeft={1}>
        <Show when={waiting().length > 0}>
          <text
            id="chat-sidebar-needs-user"
            fg={theme.text.muted}
            selectable={false}
            onMouseUp={() => tabs.select(waiting()[0].sessionID)}
          >
            {waiting().length} need you
          </text>
        </Show>
      </box>
      <scrollbox
        id="chat-sidebar-chats"
        flexGrow={1}
        flexShrink={1}
        flexBasis={0}
        minHeight={layout().chats}
        horizontalScrollbarOptions={{ visible: false }}
      >
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
          <scrollbox
            id="chat-sidebar-panels"
            // As tall as its panels, up to the share of the sidebar it may take; beyond that it scrolls.
            height={Math.min(layout().panels, panelRows() + 1)}
            flexShrink={0}
            horizontalScrollbarOptions={{ visible: false }}
            contentOptions={{ flexShrink: 0 }}
          >
            <text fg={tint(background(), theme.text.muted, 0.5)} wrapMode="none" selectable={false}>
              {"─".repeat(Math.max(1, props.width - 2))}
            </text>
            {/* Lower panels scroll independently, leaving space for the chat list. */}
            <box
              flexShrink={0}
              gap={1}
              paddingLeft={1}
              paddingRight={1}
              paddingBottom={1}
              onSizeChange={function () {
                setPanelRows(this.height)
              }}
            >
              <Slot path="sidebar.content" input={{ sessionID }} />
            </box>
          </scrollbox>
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
