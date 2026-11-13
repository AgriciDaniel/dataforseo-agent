import type { BoxRenderable } from "@opentui/core"
import { Prompt, type PromptRef } from "../component/prompt"
import { createEffect, createMemo, createSignal, onMount, Show, untrack } from "solid-js"
import { HomeStarters, showHomeStarters } from "../feature-plugins/home/starters"
import { HomeCrewStrip } from "../component/crew"
import { HOME_ROWS } from "../ui/home-crew"
import { STAGE_MIN_WIDTH, STAGE_ROWS } from "../ui/home-stage"
import { Logo } from "../component/logo"
import { useArgs } from "../context/args"
import { useRouteData } from "../context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { useEditorContext } from "../context/editor"
import { useData } from "../context/data"
import { useLocation } from "../context/location"
import { FormPrompt } from "./session/form"
import { Slot } from "../plugin/render"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"

let once = false
const placeholder = {
  normal: [
    'Top 10 Google results for "best crm" in the US',
    "Keyword ideas and search volume for my niche",
    "Which endpoint fits a backlink gap check, and what will it cost?",
  ],
  shell: ["ls -la", "git status", "pwd"],
}

export function Home() {
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const [promptHeight, setPromptHeight] = createSignal(0)
  // The crew takes the width of the home pane (the chat sidebar may sit beside it), not of the terminal.
  const [crewWidth, setCrewWidth] = createSignal(0)
  const crewRows = () => {
    const height = dimensions().height
    if (height >= 24 + STAGE_ROWS && crewWidth() >= STAGE_MIN_WIDTH) return STAGE_ROWS
    return height >= 16 + HOME_ROWS ? HOME_ROWS : 0
  }
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  const editor = useEditorContext()
  const data = useData()
  const location = useLocation()
  const dimensions = useTerminalDimensions()
  const theme = useTheme()
  // Global MCP elicitations can arrive without a session route, so keep them reachable from Home.
  const currentLocation = () => route.location ?? data.location.default()
  const forms = createMemo(() => data.session.form.list("global", currentLocation()) ?? [])
  let sent = false

  // Track only the route location and (when absent) the default location; location.set
  // reads other signals internally and tracking them would re-assert the route location
  // after the user overrides it with /cd.
  createEffect(() => {
    const target = currentLocation()
    untrack(() => location.set(target))
  })

  onMount(() => {
    editor.clearSelection()
  })

  const bind = (r: PromptRef | undefined) => {
    setRef(r)
    promptRef.set(r)
    if (once || !r || route.prompt || !args.prompt) return
    r.set({ text: args.prompt, files: [], agents: [], pasted: [] })
    once = true
  }

  createEffect(() => {
    const composer = ref()
    const prompt = route.prompt
    if (!composer || prompt?.text === undefined) return
    untrack(() => composer.set(prompt))
  })

  // Wait for everything submit needs before auto-submitting --prompt; it runs once.
  createEffect(() => {
    const r = ref()
    if (sent) return
    if (!r) return
    if (!local.model.ready || !local.model.catalogReady) return
    if (!local.agent.current() || !local.model.current()) return
    if (!args.prompt) return
    if (r.current.text !== args.prompt) return
    sent = true
    r.submit()
  })

  return (
    <>
      <box
        flexGrow={1}
        alignItems="center"
        paddingLeft={dimensions().width < 44 ? 1 : 2}
        paddingRight={dimensions().width < 44 ? 1 : 2}
      >
        <box flexGrow={1} minHeight={0} />
        <box height={3} minHeight={0} flexShrink={1} />
        <box flexShrink={0}>
          <Logo />
        </box>
        <box height={1} flexShrink={0} />
        <Show when={dimensions().height >= 16}>
          <text fg={theme.text.muted} flexShrink={0}>
            Your DataForSEO expert
          </text>
          <box height={1} flexShrink={0} />
        </Show>
        <box
          width="100%"
          maxWidth={75}
          zIndex={1000}
          paddingTop={1}
          flexShrink={0}
          position="relative"
          onSizeChange={function (this: BoxRenderable) {
            setPromptHeight(this.height)
          }}
        >
          <Prompt ref={bind} placeholders={placeholder} disabled={forms().length > 0} />
        </box>
        <Show when={showHomeStarters(dimensions().width, dimensions().height, promptHeight())}>
          <HomeStarters
            disabled={forms().length > 0}
            onSelect={(text) => {
              const composer = ref()
              if (!composer) return
              composer.setMode("normal")
              composer.set({ text, files: [], agents: [], pasted: [] })
              composer.focus()
            }}
          />
        </Show>
        <box flexGrow={1} minHeight={0} />
      </box>
      {/* DataForSEO Agent: the crew wanders the floor above the footer; point at them or click one. */}
      <box
        width="100%"
        height={crewRows()}
        flexShrink={0}
        paddingLeft={2}
        paddingRight={2}
        onSizeChange={function (this: BoxRenderable) {
          setCrewWidth(Math.max(0, this.width - 4))
        }}
      >
        <Show when={crewRows() > 0 && crewWidth() >= 40 ? crewRows() : undefined} keyed>
          {(rows) => <HomeCrewStrip width={crewWidth()} stage={rows === STAGE_ROWS} />}
        </Show>
      </box>
      <box width="100%" flexShrink={0}>
        <Slot path="home.footer" />
      </box>
      <Show when={forms()[0]?.id} keyed>
        {(_) => {
          const form = forms()[0]
          return form ? (
            <box position="absolute" zIndex={2000} left={0} right={0} bottom={1} paddingLeft={2} paddingRight={2}>
              <box width="100%">
                <FormPrompt form={form} />
              </box>
            </box>
          ) : null
        }}
      </Show>
    </>
  )
}
