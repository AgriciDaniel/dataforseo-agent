import { expect, spyOn, test } from "bun:test"
import { createRoot, createSignal } from "solid-js"
import { createResultsState, type ResultChart } from "../../src/context/results"
import { clampResultsPaneWidth, showResultsPane } from "../../src/ui/layout"

test("results width keeps at least 70 columns for chat", () => {
  expect(clampResultsPaneWidth(Math.floor(150 * 0.45), 150)).toBe(67)
  expect(clampResultsPaneWidth(200, 150)).toBe(80)
  expect(clampResultsPaneWidth(90, 240)).toBe(90)
  expect(clampResultsPaneWidth(-10, 150)).toBe(30)
  expect(clampResultsPaneWidth(200, 80)).toBe(10)
  expect(clampResultsPaneWidth(200, 50)).toBe(0)
  expect(clampResultsPaneWidth(70.8, 150)).toBe(70)
})

test("results appear only with completed charts and enough available session width", () => {
  const input = { width: 150, charts: 1, folded: false, terminal: false, panel: false }
  expect(showResultsPane(input)).toBe(true)
  expect(showResultsPane({ ...input, width: 149 })).toBe(false)
  expect(showResultsPane({ ...input, charts: 0 })).toBe(false)
  expect(showResultsPane({ ...input, folded: true })).toBe(false)
  expect(showResultsPane({ ...input, terminal: true })).toBe(false)
  expect(showResultsPane({ ...input, panel: true })).toBe(false)
  expect(showResultsPane({ ...input, terminal: true, panel: true })).toBe(false)
  expect(showResultsPane({ ...input, width: 200 - 51 })).toBe(false)
  expect(showResultsPane({ ...input, width: 200 - 50, charts: 5 })).toBe(true)
})

test("new results follow the newest chart while respecting recent manual navigation", () => {
  const clock = spyOn(Date, "now").mockReturnValue(10_000)
  const chart = (id: string): ResultChart => ({ id, spec: { type: "kpi", title: id, series: [] } })
  const setup = createRoot((dispose) => {
    const [sessionID, setSessionID] = createSignal("session-one")
    const [charts, setCharts] = createSignal([chart("one"), chart("two")])
    return {
      dispose,
      setSessionID,
      setCharts,
      ...createResultsState({ sessionID, charts, visible: () => true }),
    }
  })
  try {
    expect(setup.selectedID()).toBe("two")
    setup.select("one")
    clock.mockReturnValue(11_000)
    setup.setCharts((charts) => [...charts, chart("three")])
    expect(setup.selectedID()).toBe("one")
    clock.mockReturnValue(16_000)
    setup.setCharts((charts) => [...charts, chart("four")])
    expect(setup.selectedID()).toBe("four")
    setup.select("three")
    setup.setCharts((charts) => [chart("history"), ...charts])
    expect(setup.selectedID()).toBe("three")
    setup.select("missing")
    expect(setup.selectedID()).toBe("three")
    setup.setSessionID("session-two")
    expect(setup.selectedID()).toBe("four")
    setup.setCharts([])
    expect(setup.selectedID()).toBeUndefined()
    setup.setCharts([chart("five")])
    expect(setup.selectedID()).toBe("five")
  } finally {
    setup.dispose()
    clock.mockRestore()
  }
})
