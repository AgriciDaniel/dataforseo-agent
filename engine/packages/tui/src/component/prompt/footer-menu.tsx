// DataForSEO Agent: the small dropdown that opens over the prompt footer when you click the agent or the model.
// Mouse: hover and click a row, or click the title to close. Keys: up and down, then enter; escape closes.
import { RGBA, TextAttributes } from "@opentui/core"
import { createSignal, For, Show } from "solid-js"
import { useTheme } from "../../context/theme"
import { Keymap } from "../../context/keymap"

export type FooterMenuItem = {
  id: string
  label: string
  detail?: string
  color?: RGBA
}

export function FooterMenu(props: {
  id: string
  title: string
  items: FooterMenuItem[]
  current?: string
  width: number
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const theme = useTheme()
  const start = Math.max(
    0,
    props.items.findIndex((item) => item.id === props.current),
  )
  const [selected, setSelected] = createSignal(start)
  // Enter picks only after the arrow keys moved the highlight. A row under the mouse is highlighted but not
  // chosen by Enter, so Enter meant for the prompt never switches the agent or model by accident.
  const [moved, setMoved] = createSignal(false)
  const move = (step: number) => {
    setMoved(true)
    setSelected((index) => (props.items.length ? (index + step + props.items.length) % props.items.length : 0))
  }
  const pick = () => {
    const item = props.items[selected()]
    if (item) props.onSelect(item.id)
  }

  Keymap.createLayer(() => ({
    mode: "base",
    commands: [
      { bind: "up", title: "Previous", group: props.title, run: () => move(-1) },
      { bind: "down", title: "Next", group: props.title, run: () => move(1) },
      ...(moved() ? [{ bind: "return", title: "Choose", group: props.title, run: pick }] : []),
      { bind: "escape", title: "Close", group: props.title, run: () => props.onClose() },
    ],
  }))

  const inner = () => Math.max(10, props.width - 4)
  const cut = (text: string, n: number) => ([...text].length > n ? [...text].slice(0, Math.max(0, n - 1)).join("") + "…" : text)

  return (
    <box
      id={props.id}
      width={props.width}
      flexDirection="column"
      backgroundColor={theme.background.raised.high}
      border={["top", "bottom", "left", "right"]}
      borderColor={theme.border.base}
    >
      <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1} onMouseUp={() => props.onClose()}>
        <text fg={theme.text.muted} attributes={TextAttributes.BOLD}>
          {props.title}
        </text>
        <text fg={theme.text.muted}>esc</text>
      </box>
      <For each={props.items}>
        {(item, index) => (
          <box
            id={`${props.id}.item.${item.id}`}
            flexDirection="row"
            height={1}
            paddingLeft={1}
            paddingRight={1}
            gap={1}
            backgroundColor={index() === selected() ? theme.background.action.primary.focused : theme.background.raised.high}
            onMouseMove={() => {
              setSelected(index())
              setMoved(false)
            }}
            onMouseUp={() => props.onSelect(item.id)}
          >
            <text fg={item.color ?? theme.text.muted} flexShrink={0}>
              {item.id === props.current ? "●" : "○"}
            </text>
            <text
              fg={index() === selected() ? theme.text.action.primary.focused : theme.text.base}
              flexShrink={0}
              wrapMode="none"
            >
              {cut(item.label, Math.max(6, Math.floor(inner() / 2)))}
            </text>
            <Show when={item.detail}>
              {(detail) => (
                <text fg={theme.text.muted} wrapMode="none" flexShrink={1} minWidth={0} truncate>
                  {cut(detail(), Math.max(0, inner() - [...item.label].length - 3))}
                </text>
              )}
            </Show>
          </box>
        )}
      </For>
    </box>
  )
}
