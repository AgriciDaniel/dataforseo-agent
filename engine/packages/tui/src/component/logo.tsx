import { RGBA, TextAttributes } from "@opentui/core"
import { For, type JSX } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { tint } from "../theme/color"
import { MARK_TOP, accent, logo, markCells } from "../logo"

export function Logo() {
  const theme = useTheme()
  const dimensions = useTerminalDimensions()

  const renderLine = (line: string, fg: RGBA, bold: boolean): JSX.Element[] => {
    const shadow = tint(theme.background.base, fg, 0.25)
    const attrs = bold ? TextAttributes.BOLD : undefined
    return Array.from(line).map((char) => {
      if (char === "_") {
        return (
          <text fg={fg} bg={shadow} attributes={attrs} selectable={false}>
            {" "}
          </text>
        )
      }
      if (char === "^") {
        return (
          <text fg={fg} bg={shadow} attributes={attrs} selectable={false}>
            ▀
          </text>
        )
      }
      if (char === "~") {
        return (
          <text fg={shadow} attributes={attrs} selectable={false}>
            ▀
          </text>
        )
      }
      if (char === ",") {
        return (
          <text fg={shadow} attributes={attrs} selectable={false}>
            ▄
          </text>
        )
      }
      return (
        <text fg={fg} attributes={attrs} selectable={false}>
          {char}
        </text>
      )
    })
  }

  const cells = markCells()
  const color = (hex: string | undefined) => (hex ? RGBA.fromHex(hex) : undefined)
  const mark = (row: number) => (
    <box flexDirection="row">
      {/* Rows above and below the mark keep its width, so the wordmark stays put. */}
      <For each={cells[row - MARK_TOP] ?? cells[0].map(() => ({ char: " " }))}>
        {(cell) => (
          <text fg={color(cell.fg)} bg={color(cell.bg)} selectable={false}>
            {cell.char}
          </text>
        )}
      </For>
    </box>
  )

  return (
    <box>
      {dimensions().height < 12 ? null : (
        <For each={logo.left}>
          {(line, index) => (
            <box flexDirection="row" gap={2}>
              {mark(index())}
              {dimensions().width < 60 ? null : (
                <box flexDirection="row" gap={2}>
                  <box flexDirection="row">{renderLine(line, theme.text.base, true)}</box>
                  {dimensions().width < 86 ? null : (
                    <box flexDirection="row">{renderLine(logo.right[index()], RGBA.fromHex(accent), true)}</box>
                  )}
                </box>
              )}
            </box>
          )}
        </For>
      )}
    </box>
  )
}
