import { MouseButton, TextAttributes, type ScrollBoxRenderable } from "@opentui/core"
import { createEffect, createMemo, For, on, Show } from "solid-js"
import { useRenderer } from "@opentui/solid"
import { useResults } from "../context/results"
import { useTheme } from "../context/theme"
import { ChartView } from "./chart-view"

export function ResultsPane(props: { width: number; onFold: () => void }) {
  const results = useResults()
  if (!results) throw new Error("ResultsPane requires a ResultsProvider")
  const theme = useTheme()
  const renderer = useRenderer()
  const index = createMemo(() => results.charts().findIndex((chart) => chart.id === results.selectedID()))
  const others = createMemo(() => results.charts().filter((chart) => chart.id !== results.selectedID()))
  let scroll: ScrollBoxRenderable | undefined
  createEffect(on(results.selectedID, () => scroll?.scrollTo(0)))
  const move = (step: number) => {
    const chart = results.charts()[index() + step]
    if (chart) results.select(chart.id)
  }
  const Button = (button: { id: string; label: string; run: () => void; disabled?: boolean }) => (
    <text
      id={button.id}
      fg={button.disabled ? theme.text.muted : theme.text.action.secondary.base}
      selectable={false}
      wrapMode="none"
      minWidth={0}
      onMouseUp={(event) => {
        if (event.button !== MouseButton.LEFT || button.disabled || renderer.getSelection()?.getSelectedText()) return
        event.stopPropagation()
        button.run()
      }}
    >
      {button.label}
    </text>
  )
  return (
    <box
      id="results-pane"
      width={props.width}
      height="100%"
      minWidth={0}
      minHeight={0}
      flexDirection="column"
      backgroundColor={theme.background.raised.base}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
    >
      <box flexDirection="row" height={1} flexShrink={0} gap={1}>
        <text fg={theme.text.base} attributes={TextAttributes.BOLD} flexGrow={1} selectable={false}>
          Results
        </text>
        <text fg={theme.text.formfield.base} selectable={false}>
          {index() + 1} of {results.charts().length}
        </text>
        <Button id="results-previous" label="‹" disabled={index() <= 0} run={() => move(-1)} />
        <Button id="results-next" label="›" disabled={index() >= results.charts().length - 1} run={() => move(1)} />
        <Button id="results-fold" label="»" run={props.onFold} />
      </box>
      <scrollbox
        id="results-scroll"
        ref={(value: ScrollBoxRenderable) => (scroll = value)}
        flexGrow={1}
        minHeight={0}
        marginTop={1}
        scrollbarOptions={{ visible: false }}
      >
        <Show keyed when={results.selectedID()}>
          {(id) => (
            <Show when={results.charts().find((chart) => chart.id === id)}>
              {(chart) => (
                <box flexDirection="column" gap={1}>
                  <text fg={theme.text.base} attributes={TextAttributes.BOLD}>
                    {chart().spec.title ?? "Chart"}
                  </text>
                  <ChartView
                    spec={{ ...chart().spec, title: undefined }}
                    title={chart().spec.title}
                    width={Math.max(1, props.width - 4)}
                    collect={() => results.charts().map((item) => item.spec)}
                  />
                </box>
              )}
            </Show>
          )}
        </Show>
        <Show when={others().length}>
          <box flexDirection="column" marginTop={1}>
            <text fg={theme.text.muted}>Other results</text>
            <For each={others()}>
              {(chart) => (
                <box height={1} flexShrink={0}>
                  <Button
                    id={`results-chart-${chart.id}`}
                    label={`▤ ${chart.spec.title ?? "Chart"}`}
                    run={() => results.select(chart.id)}
                  />
                </box>
              )}
            </For>
          </box>
        </Show>
      </scrollbox>
    </box>
  )
}
