import { describe, expect, test } from "bun:test"
import { ChartTypes, asTable, render, sortTable, toCsv, toText, validate, type Spec } from "./chart.js"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const specs: Record<string, Spec> = {
  table: { type: "table", x: ["best crm", "a very long keyword that will need truncating at narrow widths"], series: [{ name: "volume", values: [40500, 10] }, { name: "trend", values: [[1, 2, 3], [3, 2, 1]] }, { name: "url", values: ["https://example.com/a/very/long/path/that/goes/on", null] }] },
  kpi: { type: "kpi", series: [{ name: "keywords", values: [100, 80] }, { name: "lost", values: [10, 5], lower_is_better: true }] },
  hbar: { type: "hbar", x: ["a", "b", "c"], series: [{ name: "v", values: [226_000_000, 9900, 120] }], sort: "desc" },
  "grouped-bar": { type: "grouped-bar", x: ["a", "b", "c"], series: [{ name: "x", values: [1, 2, 3] }, { name: "y", values: [3, 0, 1] }] },
  "share-bar": { type: "share-bar", x: ["organic", "paa", "video"], series: [{ name: "n", values: [8, 1, 1] }] },
  "diverging-bar": { type: "diverging-bar", x: Array.from({ length: 30 }, (_, i) => `d${i}`), series: [{ name: "new", values: Array.from({ length: 30 }, (_, i) => i) }, { name: "lost", values: Array.from({ length: 30 }, (_, i) => 30 - i) }] },
  line: { type: "line", x: months, series: [{ name: "v", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, null] }] },
  sparkline: { type: "sparkline", series: [{ name: "rank", values: [8, 7, 5, 3] }] },
  scatter: { type: "scatter", x_label: "volume", y_label: "kd", series: [{ name: "k", values: [[10, 5], [1000, 50], [226_000_000, 99]] }] },
  heatmap: { type: "heatmap", rows: ["r1", "r2"], cols: ["c1", "c2", "c3"], values: [[1, null, 3], [4, 5, 6]], lower_is_better: true },
  geogrid: { type: "geogrid", values: [[1, 4, null], [2, 1, 12], [25, 7, 3]], source: "maps" },
  tilemap: { type: "tilemap", x: ["California", "TX", "New York", "Puerto Rico"], series: [{ name: "interest", values: [100, 70, 85, 10] }] },
}

describe("chart", () => {
  test("covers every type", () => {
    expect(Object.keys(specs).sort()).toEqual([...ChartTypes].sort())
  })
  for (const [type, spec] of Object.entries(specs)) {
    test(`${type} is valid and fits 40, 80 and 120 columns`, () => {
      expect(validate(spec)).toEqual([])
      for (const width of [40, 80, 120]) {
        const lines = toText(render(spec, width)).split("\n")
        for (const line of lines) expect([...line].length).toBeLessThanOrEqual(width)
      }
    })
  }
  test("rejects bad specs with a reason", () => {
    expect(validate({ type: "pie" } as unknown as Spec)[0]).toContain("Unknown chart type")
    expect(validate({ type: "line", x: ["a", "b"], series: [{ name: "v", values: [1, 2] }] })[0]).toContain("at least 3 points")
    expect(validate({ type: "hbar", x: ["a", "b", "c"], series: [{ name: "v", values: [1, 2] }] })[0]).toContain("has 2 values")
    expect(() => render({ type: "pie" } as unknown as Spec)).toThrow()
  })
  test("lost links going up is bad", () => {
    const text = render(specs.kpi, 80)
    const lost = text.flat().find((s) => s.text.includes("100.0%"))
    expect(lost?.role).toBe("bad")
  })
  test("every non-table chart has a table view", () => {
    for (const spec of Object.values(specs)) if (spec.type !== "table") expect(asTable(spec)?.type).toBe("table")
  })
})

describe("lower_is_better", () => {
  test("a rank improving from 8 to 1 draws as rising", () => {
    const spark = render({ type: "sparkline", series: [{ name: "rank", values: [8, 5, 3, 1], lower_is_better: true }] }, 60)
    const glyphs = spark.flat().find((s) => s.role === 0)!.text
    const bits = (c: string) => c.charCodeAt(0) - 0x2800
    // Braille: dots 7 and 8 (0x40, 0x80) are the bottom row, dots 1 and 4 (0x01, 0x08) the top row.
    expect(bits(glyphs[0]) & 0xc0).toBeGreaterThan(0)
    expect(bits(glyphs[glyphs.trimEnd().length - 1]) & 0x09).toBeGreaterThan(0)
  })
  test("an inverted line puts the best value on top", () => {
    const text = toText(render({ type: "line", x: ["a", "b", "c", "d"], series: [{ name: "pos", values: [10, 7, 4, 1], lower_is_better: true }] }, 60))
    const firstAxis = text.split("\n").find((l) => l.includes("┤"))!
    expect(firstAxis.trim().startsWith("0") || firstAxis.trim().startsWith("1")).toBe(true)
  })
  test("a table sent in heatmap shape gets a pointed error", () => {
    const errors = validate({ type: "table", rows: ["a"], cols: ["b"], values: [[1]] } as any)
    expect(errors.join(" ")).toContain("Use x for row labels")
  })
  test("sortTable keeps the shown rows and orders by any column", () => {
    const spec: Spec = {
      type: "table",
      x: ["b.com", "a.com", "c.com", "d.com"],
      series: [{ name: "ETV", values: [50, 90, 10, 5] }, { name: "Pos", values: [3, null, 1, 2] }],
      sort: "desc",
      limit: 3,
    }
    expect(sortTable(spec, 0, "asc").x).toEqual(["a.com", "b.com", "c.com"])
    const byPos = sortTable(spec, 2, "asc")
    expect(byPos.x).toEqual(["c.com", "b.com", "a.com"])
    expect(byPos.series![0].values).toEqual([10, 50, 90])
    expect(sortTable(spec, 2, "desc").x).toEqual(["b.com", "c.com", "a.com"])
  })
  test("header cells carry their column for click to sort", () => {
    const lines = render({ type: "table", x: ["a", "b"], series: [{ name: "v", values: [1, 2] }] }, 60)
    const head = lines.find((l) => l.some((s) => s.column === 1))!
    expect(head.filter((s) => s.column !== undefined).map((s) => s.column)).toEqual([0, 1])
  })
  test("toCsv quotes and flattens", () => {
    const csv = toCsv({ type: "line", x: ["Jan", "Feb"], series: [{ name: 'say "hi", ok', values: [1, 2] }] })
    expect(csv).toBe('label,"say ""hi"", ok"\nJan,1\nFeb,2\n')
    expect(toCsv({ type: "table", x: ["k"], series: [{ name: "trend", values: [[1, 2, 3]] as any }] })).toBe("label,trend\nk,1 2 3\n")
  })
  test("line honours log and says so", () => {
    const text = toText(render({ type: "line", x: ["a", "b", "c"], series: [{ name: "big", values: [100000, 200000, 300000] }, { name: "small", values: [10, 20, 30] }] }, 80))
    expect(text).toContain("log scale")
    const flat = toText(render({ type: "line", x: ["a", "b", "c"], series: [{ name: "v", values: [1, 2, 3] }], log: false }, 80))
    expect(flat).not.toContain("log scale")
  })
  test("geogrid pins the business and reports top 3 share", () => {
    const text = toText(render(specs.geogrid, 80))
    expect(text).toContain("◉1")
    expect(text).toContain("top 3 in 4 of 9")
  })
  test("tilemap places states and lists the rest", () => {
    const text = toText(render(specs.tilemap, 100))
    expect(text).toContain("CA")
    expect(text).toContain("Not on the map: Puerto Rico")
  })
})

test("table sparklines keep lower_is_better after sorting", async () => {
  const { ordered } = await import("./chart.js")
  const series = ordered({
    type: "table",
    x: ["a", "b"],
    sort: "desc",
    series: [{ name: "rank trend", values: [[8, 5, 3, 1], [1, 2, 3, 4]] as never, lower_is_better: true, labels: ["A", "B"] }],
  } as never).series
  expect(series[0].lower_is_better).toBe(true)
  expect(series[0].labels).toEqual(["A", "B"])
})
