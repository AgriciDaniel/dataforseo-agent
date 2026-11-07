import { describe, expect, test } from "bun:test"
import { report } from "./chart-html.js"
import type { Spec } from "./chart.js"

const specs: Spec[] = [
  { type: "table", title: "<b>x</b>", x: ["a & b"], series: [{ name: "v", values: [1] }, { name: "t", values: [[1, 2, 3]] as any }] },
  { type: "kpi", series: [{ name: "lost", values: [10, 5], lower_is_better: true }] },
  { type: "hbar", x: ["a", "b", "c"], series: [{ name: "v", values: [1, 10, 100000] }] },
  { type: "grouped-bar", x: ["a", "b", "c"], series: [{ name: "p", values: [1, 2, 3] }, { name: "q", values: [3, 4, 5] }] },
  { type: "share-bar", x: ["a", "b", "c"], series: [{ name: "n", values: [8, 1, 1] }] },
  { type: "diverging-bar", x: ["d1", "d2", "d3"], series: [{ name: "new", values: [3, 4, 5] }, { name: "lost", values: [1, 0, 2] }] },
  { type: "line", x: ["m1", "m2", "m3"], series: [{ name: "pos", values: [9, 4, 1], lower_is_better: true }] },
  { type: "sparkline", series: [{ name: "k", values: [1, 3, 2] }] },
  { type: "scatter", x_label: "kd", y_label: "vol", series: [{ name: "s", values: [[1, 10], [5, 1000], [9, 100000]] as any }] },
  { type: "heatmap", rows: ["r1", "r2"], cols: ["c1", "c2"], values: [[1, null], [3, 20]], lower_is_better: true },
]

describe("chart-html", () => {
  const html = report(specs, { title: "T <script>" })
  test("is a complete, escaped document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true)
    // The only script is the report's own table sorter: the title "<script>" is escaped.
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html).toContain("T &lt;script&gt;")
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;")
    expect(html).toContain("a &amp; b")
  })
  test("draws every type without NaN or errors", () => {
    expect(html).not.toContain("NaN")
    expect(html).not.toContain('class="err"')
    expect((html.match(/<figure>/g) ?? []).length).toBe(specs.length)
  })
  test("notes log scale and inverted axes", () => {
    expect(html).toContain("Log scale")
    expect(html).toContain("Rank axis: #1 at the top")
  })
  test("sparkline specs keep their lines", () => {
    expect(report([specs[7]])).toContain("<polyline")
  })
})

describe("new chart types in the report", () => {
  test("overlap draws a Venn, gauge dials, donut rings and stacked distribution bars", () => {
    const html = report([
      { type: "overlap", title: "Overlap", x: ["a", "b", "a + b"], series: [{ name: "k", values: [4200, 6100, 1800] }] },
      { type: "gauge", title: "Scores", series: [{ name: "SEO", values: [0.91] }] },
      { type: "donut", title: "Intent", x: ["info", "buy"], series: [{ name: "k", values: [3, 1] }] },
      { type: "distribution", title: "Ranks", x: ["#1", "#2-10"], series: [{ name: "you", values: [5, 15] }] },
    ])
    expect(html.match(/<circle[^>]*fill-opacity="0.28"/g)).toHaveLength(2)
    expect(html).toContain(">2,400<")
    expect(html).toContain('class="gauge"')
    expect(html).toContain(">91<")
    expect(html).toContain("stroke-dasharray")
    expect(html).toContain("you, #2-10: 15 (75%)")
  })
})
