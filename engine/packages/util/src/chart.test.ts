import { describe, expect, test } from "bun:test"
import { ChartTypes, PLOT_WIDTH, asTable, niceAxis, render, sortTable, toCsv, toText, validate, type Spec } from "./chart.js"

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
  distribution: { type: "distribution", x: ["#1", "#2-3", "#4-10", "#11-20", "#21-100"], series: [{ name: "a-very-long-domain-name.example.com", values: [1, 20, 300, 4000, 50000] }, { name: "b.com", values: [0, 1, 2, 3, null] }] },
  overlap: { type: "overlap", x: ["a-very-long-domain-name.example.com", "b.com", "c.com", "a-very-long-domain-name.example.com + b.com", "a-very-long-domain-name.example.com + c.com", "b.com + c.com", "a-very-long-domain-name.example.com + b.com + c.com"], series: [{ name: "k", values: [100, 80, 60, 30, 20, 15, 9] }] },
  gauge: { type: "gauge", series: [{ name: "Performance with a long category name", values: [42] }, { name: "SEO", values: [100] }, { name: "Zero", values: [0] }] },
  donut: { type: "donut", x: ["informational", "commercial"], series: [{ name: "k", values: [3, 1] }] },
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
  test("a rank improving from 8 to 1 draws as rising, in green", () => {
    const spark = render({ type: "sparkline", series: [{ name: "rank", values: [8, 5, 3, 1], lower_is_better: true }] }, 60)
    const trend = spark.flat().find((s) => /[▁-█]/.test(s.text))!
    expect(trend.text).toBe("▁▄▅▇")
    expect(trend.role).toBe("good")
  })
  test("an inverted line puts the best value on top", () => {
    const text = toText(render({ type: "line", x: ["a", "b", "c", "d"], series: [{ name: "pos", values: [10, 7, 4, 1], lower_is_better: true }] }, 60))
    const firstAxis = text.split("\n").find((l) => l.includes("┤"))!
    expect(firstAxis.trim().startsWith("#1")).toBe(true)
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

describe("readable axes and ranks", () => {
  test("rank bars give #1 the longest bar and label positions with #", () => {
    const text = toText(
      render({ type: "grouped-bar", x: ["a", "b", "c"], series: [{ name: "you", values: [3, 25, 4] }, { name: "rival", values: [1, null, 5] }], unit: "position" }, 60),
    )
    const bar = (label: string) => text.split("\n").find((l) => l.includes(label))!.split("█").length
    expect(bar("#1")).toBeGreaterThan(bar("#3"))
    expect(bar("#3")).toBeGreaterThan(bar("#25"))
    expect(text).toContain("not ranking")
    expect(text).not.toContain("position")
  })
  test("line axes use round numbers", () => {
    const text = toText(render({ type: "line", x: ["a", "b", "c", "d"], series: [{ name: "v", values: [32000, 41000, 47000, 58000] }] }, 60))
    const labels = text.split("\n").filter((l) => l.includes("┤")).map((l) => l.split("┤")[0].trim()).filter(Boolean)
    expect(labels).toEqual(["60k", "50k", "40k", "30k"])
  })
  test("niceAxis rounds to 1, 2, 2.5 or 5 steps", () => {
    expect(niceAxis(32000, 58000)).toEqual({ lo: 30000, hi: 60000, mid: 50000, step: 10000 })
    expect(niceAxis(0, 9).hi).toBe(10)
  })
  test("lost links are red and gained green in the terminal", () => {
    const lines = render({ type: "diverging-bar", x: ["Jan", "Feb", "Mar"], series: [{ name: "New", values: [5, 6, 7] }, { name: "Lost", values: [-1, -2, -3] }] }, 60)
    const roles = new Set(lines.flat().filter((s) => s.text.includes("█")).map((s) => s.role))
    expect(roles).toEqual(new Set(["good", "bad"]))
    expect(toText(lines)).toContain("Feb")
  })
  test("percent shares are shown as given, once", () => {
    const text = toText(render({ type: "share-bar", x: ["a", "b"], series: [{ name: "s", values: [52, 18] }], unit: "%" }, 60))
    expect(text).toContain("52%")
    expect(text).not.toContain("72%")
    expect(text.match(/52%/g)).toHaveLength(1)
  })
  test("scatter switches to log at 100x and labels powers of ten", () => {
    const text = toText(
      render({ type: "scatter", x_label: "KD", y_label: "Volume", series: [{ name: "k", values: [[10, 480], [50, 9000], [90, 60000]] }] }, 60),
    )
    expect(text).toContain("Volume (log)")
    expect(text).toMatch(/100k|10k/)
  })
})

describe("distribution, overlap, gauge and donut", () => {
  test("a rank distribution colors each bucket on its own grade, best first", () => {
    const lines = render({ type: "distribution", x: ["#1", "#2-3", "#4-10", "#11-20", "#21-50", "#51-100"], series: [{ name: "you", values: [1, 2, 3, 4, 5, 6] }] }, 60)
    const roles = lines.flat().filter((s) => s.text.includes("█") || s.bg?.toString().startsWith("grade")).map((s) => s.bg ?? s.role)
    expect(new Set(roles).size).toBe(6)
    expect(roles[0]).toBe("grade6")
    expect(roles.at(-1)).toBe("grade0")
    expect(toText(lines)).toContain("21")
  })
  test("overlap turns the API's inclusive counts into exclusive regions", () => {
    const spec: Spec = { type: "overlap", x: ["a", "b", "a + b"], series: [{ name: "k", values: [4200, 6100, 1800] }] }
    expect(validate(spec)).toEqual([])
    const text = toText(render(spec, 60))
    expect(text).toContain("only a")
    expect(text).toContain("2,400")
    expect(text).toContain("4,300")
    expect(text).toContain("1,800 shared (43%)")
    const three: Spec = {
      type: "overlap",
      x: ["a", "b", "c", "a + b", "a + c", "b + c", "a + b + c"],
      series: [{ name: "k", values: [1000, 800, 600, 300, 200, 150, 90] }],
    }
    const table = asTable(three)!
    expect(table.x).toEqual(["only a", "only b", "only c", "a and b", "a and c", "b and c", "a and b and c"])
    expect(table.series![0].values).toEqual([590, 440, 340, 210, 110, 60, 90])
    expect(validate({ type: "overlap", x: ["a", "b"], series: [{ name: "k", values: [1, 2] }] })[0]).toContain('"a + b"')
  })
  test("gauges read 0 to 1 scores as fractions and color by band", () => {
    const lines = render({ type: "gauge", series: [{ name: "Performance", values: [0.42] }, { name: "SEO", values: [1] }] }, 60)
    const text = toText(lines)
    expect(text).toContain("42 /100")
    expect(text).toContain("100 /100")
    expect(lines.flat().some((s) => s.role === "bad" && s.text.includes("█"))).toBe(true)
    expect(validate({ type: "gauge", series: [{ name: "x", values: [140] }] })).toHaveLength(1)
  })
  test("a donut falls back to the share bar in the terminal", () => {
    const text = toText(render({ type: "donut", x: ["a", "b"], series: [{ name: "k", values: [3, 1] }] }, 60))
    expect(text).toContain("75%")
  })
})

describe("composed chart layout", () => {
  for (const [type, spec] of Object.entries(specs)) {
    test(`${type} has clean lines and consistent metadata at 60 and 100 columns`, () => {
      for (const width of [60, 100]) {
        const lines = render({ ...spec, title: "Title", subtitle: "Subtitle", source: "Source" }, width)
        const text = lines.map((line) => line.map((s) => s.text).join(""))
        expect(text.slice(0, 3)).toEqual(["Title", "Subtitle", ""])
        expect(text.slice(-2)).toEqual(["", "Source"])
        expect(lines.at(-1)?.[0].role).toBe("muted")
        expect(text.some((line, i) => !line && text[i + 1] === "")).toBe(false)
        for (const line of text) {
          expect(line).toBe(line.trimEnd())
          expect([...line].length).toBeLessThanOrEqual(type === "table" ? width : Math.min(width, PLOT_WIDTH))
        }
      }
    })
  }

  test("inline plots cap at 78 columns and full screen can grow", () => {
    for (const type of ["hbar", "share-bar", "line"] as const)
      expect(render(specs[type], 200)).toEqual(render(specs[type], PLOT_WIDTH))
    expect(render(specs["share-bar"], 120, { full: true })[0].reduce((n, s) => n + s.text.length, 0)).toBe(120)
    const table: Spec = { type: "table", x: ["a".repeat(45)], series: [{ name: "Details", values: ["b".repeat(45)] }] }
    expect(Math.max(...render(table, 100).map((line) => line.reduce((n, s) => n + s.text.length, 0)))).toBeGreaterThan(
      PLOT_WIDTH,
    )
  })

  test("heatmap fits full headers and fills readable cells", () => {
    const spec: Spec = {
      type: "heatmap",
      rows: ["Search", "Maps"],
      cols: ["Desktop", "Mobile", "Tablet"],
      values: [
        [30, 20, 10],
        [5, 15, null],
      ],
    }
    for (const width of [60, 100]) {
      const lines = render(spec, width)
      for (const header of spec.cols!) expect(toText(lines)).toContain(header)
      const cells = lines.flat().filter((s) => s.bg)
      expect(cells).toHaveLength(5)
      expect(cells.every((s) => s.role === "tile" && s.tip && s.text.length >= 6)).toBe(true)
    }
  })

  test("line labels every nice tick on equally spaced rows", () => {
    const text = toText(
      render(
        { type: "line", x: months, series: [{ name: "v", values: [20, 25, 30, 40, 50, 60, 65, 70, 75, 76, 78, 80] }] },
        100,
      ),
    ).split("\n")
    const ticks = text.flatMap((line, row) =>
      /^\s*(\d+) ┤/.test(line) ? [{ value: Number(line.split("┤")[0].trim()), row }] : [],
    )
    expect(ticks.map((t) => t.value)).toEqual([80, 60, 40, 20])
    expect(ticks.slice(1).map((t, i) => t.row - ticks[i].row)).toEqual([3, 3, 3])
    expect(text.find((line) => line.includes("└"))!.length).toBeLessThan(70)
  })

  test("missing line values preserve the shared no-data layout", () => {
    expect(toText(render({ type: "line", x: ["a", "b", "c"], series: [{ name: "v", values: [null, null, null] }], source: "Source" }, 60))).toBe("No data\n\nSource")
  })

  test("scatter labels every log decade and puts axis titles before the plot", () => {
    const text = toText(
      render(
        {
          type: "scatter",
          x_label: "KD",
          y_label: "Volume",
          series: [
            {
              name: "Keywords",
              values: [
                [10, 100],
                [50, 1000],
                [90, 100000],
              ],
            },
          ],
        },
        100,
      ),
    )
    expect(
      text
        .split("\n")
        .filter((line) => /\S+ ┤/.test(line))
        .map((line) => line.split("┤")[0].trim()),
    ).toEqual(["100k", "10k", "1,000", "100"])
    expect(text.indexOf("↑ Volume (log)")).toBeLessThan(text.indexOf("┤"))
    expect(text).toContain("KD →")
    expect(text).not.toMatch(/^[xy]:/m)
  })

  test("share bar draws one strip with counts and shares in its legend", () => {
    const lines = render(specs["share-bar"], 100)
    expect(lines.filter((line) => line.some((s) => s.text.includes("█")))).toHaveLength(1)
    expect(toText(lines)).toMatch(/organic\s+80%\s+8/)
    expect(toText(lines)).toMatch(/paa\s+10%\s+1/)
    expect(
      toText(render({ ...specs["share-bar"], series: [{ name: "n", values: [0, 0, 0] }], source: "Source" })),
    ).toContain("No data\n\nSource")
  })

  test("distribution explicitly normalizes and aligns bucket counts", () => {
    const spec: Spec = {
      type: "distribution",
      x: ["Top 3", "Top 10", "Other"],
      series: [
        { name: "you.com", values: [12, 6, 2] },
        { name: "rival.com", values: [60, 30, 10] },
      ],
    }
    const lines = render(spec, 100)
    const text = toText(lines)
    expect(text.match(/100% ·/g)).toHaveLength(2)
    expect(text).toContain("60%")
    expect(text).toMatch(/Counts\s+you.com\s+rival.com/)
    expect(text).toMatch(/Top 3\s+12\s+60/)
    const rows = text.split("\n").filter((line) => /^■ /.test(line))
    expect(new Set(rows.map((line) => line.length)).size).toBe(1)
    expect(text).not.toContain(" / ")
    const zero = render({ ...spec, series: [{ name: "Empty", values: [0, 0, 0] }] }, 60)
    expect(toText(zero)).toContain("no data")
    expect(zero.flat().some((s) => s.bg)).toBe(false)
  })

  test("diverging sides share a scale and fill the available width", () => {
    const spec: Spec = {
      type: "diverging-bar",
      x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      series: [
        { name: "New", values: [10, 20, 30, 10, 20, 30, 10, 20, 30, 10, 20, 30] },
        { name: "Lost", values: [-10, -20, -30, -10, -20, -30, -10, -20, -30, -10, -20, -30] },
      ],
    }
    // A few dates stay as columns of at most 9 cells instead of stretching into slabs.
    const few = toText(render({ ...spec, x: spec.x!.slice(0, 3), series: spec.series!.map((s) => ({ ...s, values: s.values.slice(0, 3) })) }, 100))
    expect(few.split("\n").find((line) => line.includes("┼"))!.length).toBeLessThanOrEqual(3 * 9 + 6)
    for (const width of [60, 100]) {
      const lines = render(spec, width)
      expect(
        toText(lines)
          .split("\n")
          .find((line) => line.includes("┼"))!.length,
      ).toBeGreaterThan(Math.min(width, PLOT_WIDTH) - 3)
      const size = (role: string) =>
        lines
          .flat()
          .filter((s) => s.role === role && /^[█▁▂▃▄▅▆▇▔▀ ]+$/.test(s.text))
          .reduce((n, s) => n + s.text.replace(/ /g, "").length, 0)
      expect(size("good")).toBe(size("bad"))
      expect(toText(render(specs["diverging-bar"], width)).split("\n").find((line) => line.includes("┼"))!.length).toBe(Math.min(width, PLOT_WIDTH))
    }
  })

  test("KPI cards wrap, emphasize values and respect lower is better", () => {
    const spec: Spec = {
      type: "kpi",
      series: [
        { name: "Keywords", values: [48700, 41100] },
        { name: "Lost", values: [5, 10], lower_is_better: true },
        { name: "Cost", values: [20, 10], lower_is_better: true },
        { name: "Flat", values: [0, 0] },
      ],
    }
    const wide = render(spec, 100)
    const narrow = render(spec, 40)
    expect(toText(wide)).toContain("was 41.1k")
    expect(wide.flat().find((s) => s.text.includes("48.7k"))?.bold).toBe(true)
    expect(wide.flat().find((s) => s.text.includes("▼ 50.0%"))?.role).toBe("good")
    expect(wide.flat().find((s) => s.text.includes("▲ 100.0%"))?.role).toBe("bad")
    expect(toText(wide)).toContain("no change")
    expect(narrow.length).toBeGreaterThan(wide.length)
    expect(toText(narrow).match(/┌/g)).toHaveLength(4)
  })

  test("each grouped bar names its series with deliberate category spacing", () => {
    const lines = render(
      {
        ...specs["grouped-bar"],
        series: [
          { name: "You", values: [1, 2, 3] },
          { name: "Rival", values: [3, 2, 1] },
        ],
      },
      60,
    )
    const bars = lines.filter((line) => line.some((s) => s.text.includes("█")))
    expect(bars).toHaveLength(6)
    bars.forEach((line, i) => expect(line.map((s) => s.text).join("")).toContain(i % 2 ? "Rival" : "You"))
    expect(toText(lines)).not.toMatch(/^\s+│$/m)
    expect(lines.filter((line) => !line.length)).toHaveLength(2)
  })
})
