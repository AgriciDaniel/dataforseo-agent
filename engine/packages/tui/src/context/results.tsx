import { createContext, createEffect, createMemo, createSignal, on, useContext, type Accessor } from "solid-js"
import type { Spec } from "@dataforseo-agent/util/chart"

export type ResultChart = { id: string; spec: Spec }

export function createResultsState(input: {
  sessionID: Accessor<string>
  charts: Accessor<ResultChart[]>
  visible: Accessor<boolean>
}) {
  const [selected, setSelected] = createSignal<string>()
  let navigated = 0
  const selectedID = createMemo(() =>
    input.charts().some((chart) => chart.id === selected()) ? selected() : input.charts().at(-1)?.id,
  )
  createEffect(
    on([input.sessionID, () => input.charts().at(-1)?.id], ([sessionID, newest], previous) => {
      if (sessionID !== previous?.[0]) {
        navigated = 0
        setSelected(newest)
        return
      }
      if (Date.now() - navigated < 5_000) return
      setSelected(newest)
    }),
  )
  return {
    ...input,
    selectedID,
    select(id: string) {
      if (!input.charts().some((chart) => chart.id === id)) return
      navigated = id === input.charts().at(-1)?.id ? 0 : Date.now()
      setSelected(id)
    },
  }
}

const Context = createContext<ReturnType<typeof createResultsState>>()
export const ResultsProvider = Context.Provider

export function useResults() {
  return useContext(Context)
}
