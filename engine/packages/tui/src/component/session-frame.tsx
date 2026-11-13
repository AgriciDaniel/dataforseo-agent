import {
  CliRenderEvents,
  MouseEvent,
  type BoxRenderable,
  type Renderable,
  type ScrollBoxRenderable,
} from "@opentui/core"
import { useRenderer, useTerminalDimensions } from "@opentui/solid"
import { createEffect, createMemo, createResource, createSignal, on, onCleanup, Show } from "solid-js"
import { Keymap } from "../context/keymap"
import { InteractivityProvider } from "../context/interactivity"
import { useSessionTerminals } from "../context/session-terminals"
import { usePromptRef } from "../context/prompt"
import { usePanel } from "../context/panel"
import { useStorage } from "../context/storage"
import { useData } from "../context/data"
import { createResultsState, ResultsProvider, type ResultChart } from "../context/results"
import { useDialog } from "../ui/dialog"
import { Session } from "../routes/session"
import { clampResultsPaneWidth, clampSessionPaneWidth, showResultsPane } from "../ui/layout"
import { createPaneResize } from "../ui/pane-resize"
import { PaneResizeHandle } from "../ui/pane-resize-handle"
import { useToast } from "../ui/toast"
import { TerminalPane } from "./terminal-pane"
import { PanelHost } from "./panel-host"
import { ResultsPane } from "./results-pane"

export function SessionFrame(props: { sessionID: string; verticalTabsWidth: number }) {
  const sessions = useSessionTerminals()
  const data = useData()
  const prompt = usePromptRef()
  const toast = useToast()
  const terminalError = () => toast.show({ variant: "error", message: "Unable to load terminal" })
  const renderer = useRenderer()
  const dimensions = useTerminalDimensions()
  const panels = usePanel()
  const dialog = useDialog()
  const availableWidth = () => Math.max(0, dimensions().width - props.verticalTabsWidth)
  const defaultPaneWidth = () => Math.max(1, Math.floor(panels.width() / 2))
  const [layout, updateLayout] = useStorage().store<{
    paneWidth?: number
    terminalWidth?: number
    resultsWidth?: number
    resultsFolded?: boolean
  }>("layout", { initial: {} })
  const [sessionWidth, setSessionWidth] = createSignal<number>()
  const [activePane, setActivePane] = createSignal<"session" | "right">("session")
  const [restoreTerminalFocus, setRestoreTerminalFocus] = createSignal(false)
  let focusTerminal: (() => void) | undefined
  let showTerminals: (() => void) | undefined
  let sessionScroll: ScrollBoxRenderable | undefined
  let sessionNode: BoxRenderable | undefined
  let rightNode: BoxRenderable | undefined
  let panelNode: BoxRenderable | undefined
  createResource(
    () => (sessions.available() ? props.sessionID : undefined),
    (sessionID) => sessions.refresh(sessionID).catch(() => undefined),
  )
  const session = () => sessions.get(props.sessionID)
  const selectedTerminal = () => {
    if (!sessions.available()) return
    const value = session()
    return value.terminals.find((terminal) => terminal.id === value.selectedTerminalID)
  }
  const activePanel = createMemo(() => {
    const current = panels.current()
    if (current?.sessionID === props.sessionID) return current
  })
  const fullscreen = () => activePanel() !== undefined && panels.presentation() === "fullscreen"
  createEffect(
    on([activePanel, () => selectedTerminal()?.id], ([panel, terminal], previous) => {
      if (panel && panel !== previous?.[0]) {
        if (terminal) void sessions.selectTerminal(props.sessionID, null).catch(toast.error)
        return
      }
      if (terminal && terminal !== previous?.[1]) {
        if (panel) panels.close()
      }
    }),
  )
  const charts = createMemo<ResultChart[]>(() =>
    data.session.message
      .list(props.sessionID)
      .flatMap((message) => ("content" in message && Array.isArray(message.content) ? message.content : []))
      .flatMap((part) =>
        part.type === "tool" && part.name === "chart" && part.state.status === "completed"
          ? [{ id: part.id, spec: (part.state.metadata?.spec ?? part.state.input) as unknown as ResultChart["spec"] }]
          : [],
      ),
  )
  const rightPane = createMemo(() => {
    if (activePanel()) return "panel"
    if (selectedTerminal()) return "terminal"
    if (
      showResultsPane({
        width: availableWidth(),
        charts: charts().length,
        folded: layout.resultsFolded ?? false,
        terminal: false,
        panel: false,
      })
    )
      return "results"
  })
  const results = createResultsState({
    sessionID: () => props.sessionID,
    charts,
    visible: () => rightPane() === "results",
  })
  const defaultResultsWidth = () => Math.floor(availableWidth() * 0.45)
  const foldResults = (folded: boolean) => {
    void updateLayout((draft) => {
      draft.resultsFolded = folded
    }).catch((error) => console.error("Failed to persist TUI layout", error))
  }
  const paneResize = createPaneResize({
    value: () =>
      rightPane() === "results"
        ? (layout.resultsWidth ?? defaultResultsWidth())
        : (layout.paneWidth ?? layout.terminalWidth ?? defaultPaneWidth()),
    defaultValue: () => (rightPane() === "results" ? defaultResultsWidth() : defaultPaneWidth()),
    clamp: (width) =>
      rightPane() === "results"
        ? clampResultsPaneWidth(width, availableWidth())
        : clampSessionPaneWidth(width, panels.width()),
    fromMouse: (event) => dimensions().width - event.x - 1,
    contains: (event, width) => event.x >= dimensions().width - width - 1 && event.x <= dimensions().width - width,
    onCommit: (width) => {
      const key = rightPane() === "results" ? "resultsWidth" : "paneWidth"
      void updateLayout((draft) => {
        draft[key] = width
      }).catch((error) => console.error("Failed to persist TUI layout", error))
    },
  })
  let resizeRelease = false
  const finishPaneResize = (event: MouseEvent) => {
    if (paneResize.resizing()) {
      // A captured drag-end can be followed by mouse-up on the focus overlay.
      resizeRelease = true
      queueMicrotask(() => {
        resizeRelease = false
      })
    }
    paneResize.onMouseUp(event)
  }
  const focusSession = () => {
    if (fullscreen()) return
    // Permission prompts replace the input, so returning focus must not depend on it.
    if (activePane() === "right") renderer.currentFocusedRenderable?.blur()
    setActivePane("session")
    prompt.current?.focus()
  }
  const focusRightPane = () => {
    setActivePane("right")
    if (activePanel()) {
      panelNode?.focus()
      return
    }
    focusTerminal?.()
  }
  const onFocused = () => {
    const current = renderer.currentFocusedRenderable
    if (within(current, rightNode)) setActivePane("right")
    if (!fullscreen() && within(current, sessionNode)) setActivePane("session")
  }
  renderer.on(CliRenderEvents.FOCUSED_RENDERABLE, onFocused)
  onCleanup(() => renderer.off(CliRenderEvents.FOCUSED_RENDERABLE, onFocused))
  createEffect(() => {
    if (fullscreen()) focusRightPane()
  })
  createEffect(() => {
    if (rightPane() !== "terminal" && rightPane() !== "panel") setActivePane("session")
  })
  createEffect(() => {
    if (!restoreTerminalFocus() || selectedTerminal()) return
    setRestoreTerminalFocus(false)
    focusSession()
  })
  Keymap.createLayer(() => ({
    mode: "global",
    enabled: () => (rightPane() === "terminal" || activePanel() !== undefined) && dialog.stack.length === 0,
    commands: [
      {
        id: "pane.focus.left",
        title: "Focus session pane",
        enabled: () => !fullscreen(),
        run: focusSession,
      },
      {
        id: "pane.focus.right",
        title: "Focus right pane",
        run: focusRightPane,
      },
    ],
  }))

  // Pane management stays reachable from either input scope.
  Keymap.createLayer(() => ({
    mode: "global",
    commands: [
      {
        id: "results.toggle",
        title: results.visible() ? "Hide results pane" : "Show results pane",
        group: "Session",
        palette: true,
        slash: { name: "results" },
        run: () => {
          dialog.clear()
          foldResults(results.visible())
        },
      },
      ...(sessions.available()
        ? [
            {
              id: "terminal.toggle",
              title: rightPane() === "terminal" ? "Hide terminal pane" : "Show terminal pane",
              group: "Session",
              palette: true as const,
              run: () => {
                dialog.clear()
                if (rightPane() === "terminal") {
                  focusSession()
                  void sessions.selectTerminal(props.sessionID, null).catch(toast.error)
                  return
                }
                void sessions
                  .refresh(props.sessionID)
                  .then(async () => {
                    const terminal = sessions.get(props.sessionID).terminals.at(-1)
                    if (terminal) return sessions.selectTerminal(props.sessionID, terminal.id)
                    await sessions.newTerminal(props.sessionID)
                  })
                  .catch(terminalError)
              },
            },
            {
              id: "terminal.select",
              title: "Select terminal",
              group: "Session",
              palette: true as const,
              run: () => {
                dialog.clear()
                if (fullscreen()) panels.close()
                focusSession()
                showTerminals?.()
                void sessions.refresh(props.sessionID).catch(terminalError)
              },
            },
            {
              id: "terminal.close",
              title: "Close terminal pane",
              group: "Session",
              palette: true as const,
              enabled: rightPane() === "terminal",
              run: () => {
                dialog.clear()
                focusSession()
                void sessions.selectTerminal(props.sessionID, null).catch(toast.error)
              },
            },
            {
              id: "session.terminal",
              title: "New terminal",
              group: "Session",
              palette: true as const,
              slash: { name: "terminal" },
              run: async () => {
                dialog.clear()
                await sessions.newTerminal(props.sessionID).catch(terminalError)
              },
            },
          ]
        : []),
    ],
  }))

  return (
    <ResultsProvider value={results}>
      <box
        flexGrow={1}
        minWidth={0}
        minHeight={0}
        flexDirection="row"
        position="relative"
        onMouseDrag={paneResize.onMouseDrag}
        onMouseDragEnd={finishPaneResize}
        onMouseUp={finishPaneResize}
      >
        <box
          id="session-pane"
          ref={(value: BoxRenderable) => (sessionNode = value)}
          flexGrow={1}
          flexBasis={0}
          minWidth={0}
          minHeight={0}
          position={fullscreen() ? "absolute" : "relative"}
          visible={!fullscreen()}
          width={fullscreen() ? Math.max(0, panels.width() - paneResize.size()) : undefined}
          height="100%"
          onSizeChange={function () {
            setSessionWidth(this.width)
          }}
        >
          <InteractivityProvider enabled={activePane() === "session" && !fullscreen()}>
            <Session
              scrollRef={(value) => (sessionScroll = value)}
              verticalTabsWidth={props.verticalTabsWidth}
              promptMuted={activePane() !== "session"}
              terminals={sessions.available()}
              visibleTerminalID={rightPane() === "terminal" ? selectedTerminal()?.id : undefined}
              onTerminalPicker={(show) => (showTerminals = show)}
              width={sessionWidth()}
            />
          </InteractivityProvider>
          <Show when={activePane() === "right"}>
            <box
              position="absolute"
              left={0}
              top={0}
              width="100%"
              height="100%"
              zIndex={1}
              onMouseScroll={(event) => {
                if (!sessionScroll || sessionScroll.isDestroyed) return
                const viewport = sessionScroll.viewport
                if (event.x < viewport.x || event.x >= viewport.x + viewport.width) return
                if (event.y < viewport.y || event.y >= viewport.y + viewport.height) return
                // Keep the focus-only click guard, but let the transcript handle its own wheel events.
                event.stopPropagation()
                sessionScroll.processMouseEvent(new MouseEvent(sessionScroll, event))
              }}
              // Consume the release before revealing permission buttons underneath.
              onMouseUp={() => {
                if (paneResize.resizing() || resizeRelease) return
                focusSession()
              }}
            />
          </Show>
        </box>
        <Show when={rightPane()}>
          <box
            ref={(value: BoxRenderable) => (rightNode = value)}
            flexShrink={0}
            width={fullscreen() ? availableWidth() : paneResize.size()}
            minWidth={0}
            minHeight={0}
          >
            <Show
              when={rightPane() === "results"}
              fallback={
                <Show
                  keyed
                  when={activePanel()}
                  fallback={
                    <Show keyed when={selectedTerminal()?.id}>
                      {(ptyID) => (
                        <TerminalPane
                          ptyID={ptyID}
                          resizing={paneResize.resizing()}
                          autoFocus={restoreTerminalFocus() || sessions.shouldFocus(ptyID)}
                          onAutoFocus={() => {
                            sessions.clearFocus(ptyID)
                            setRestoreTerminalFocus(false)
                          }}
                          onFocusRequest={(value) => (focusTerminal = value)}
                          onDisconnect={() => setRestoreTerminalFocus(true)}
                        />
                      )}
                    </Show>
                  }
                >
                  {(item) => (
                    <PanelHost
                      panel={item}
                      width={fullscreen() ? availableWidth() : paneResize.size()}
                      focused={activePane() === "right"}
                      onFocus={focusRightPane}
                      onTarget={(node) => {
                        panelNode = node
                        if (node) {
                          focusRightPane()
                          return
                        }
                        setActivePane("session")
                      }}
                    />
                  )}
                </Show>
              }
            >
              <ResultsPane width={paneResize.size()} onFold={() => foldResults(true)} />
            </Show>
          </box>
        </Show>
        <Show when={!fullscreen() && rightPane() !== undefined && availableWidth() >= 3}>
          <PaneResizeHandle resize={paneResize} left={availableWidth() - paneResize.size() - 1} highlight="right" />
        </Show>
      </box>
    </ResultsProvider>
  )
}

function within(node: Renderable | null | undefined, root: Renderable | undefined) {
  if (!root) return false
  for (let current = node; current; current = current.parent) {
    if (current === root) return true
  }
  return false
}
