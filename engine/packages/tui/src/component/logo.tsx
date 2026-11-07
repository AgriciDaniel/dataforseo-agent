import { RGBA, TextAttributes } from "@opentui/core"
import { For, type JSX } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { tint } from "../theme/color"
import { barColors, bars, logo } from "../logo"

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

  const mark = (row: number) => (
    <box flexDirection="row" gap={1}>
      <For each={bars}>
        {(bar, column) => (
          <text fg={RGBA.fromHex(barColors[column()])} selectable={false}>
            {bar[row]}
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
                    <box flexDirection="row">{renderLine(logo.right[index()], RGBA.fromHex(barColors[2]), true)}</box>
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
