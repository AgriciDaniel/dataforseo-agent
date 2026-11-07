// DataForSEO Agent charts: one spec, validated once, drawn as colored text segments.
// The engine joins the segments into plain text (run mode, logs, the model's own view);
// the TUI maps each segment's role to a theme color. Pure TypeScript, no dependencies.

export const ChartTypes = [
  "table",
  "kpi",
  "hbar",
  "grouped-bar",
  "share-bar",
  "diverging-bar",
  "line",
  "sparkline",
  "scatter",
  "heatmap",
  "geogrid",
  "tilemap",
  "distribution",
  "overlap",
  "gauge",
  "donut",
] as const
export type ChartType = (typeof ChartTypes)[number]

export type Cell = string | number | null | readonly (number | null)[]

export interface Series {
  readonly name: string
  readonly values: readonly Cell[]
  /** This metric improves when it goes down (lost links, cost, position). Flips kpi and trend colors. */
  readonly lower_is_better?: boolean
  /** Scatter: one name per point (keyword, domain), shown when the pointer is over it. */
  readonly labels?: readonly string[]
}

export interface Spec {
  readonly type: ChartType
  readonly title?: string
  readonly subtitle?: string
  /** Category labels (bars, line x axis, table row labels, share parts). */
  readonly x?: readonly string[]
  readonly series?: readonly Series[]
  readonly unit?: string
  readonly sort?: "asc" | "desc" | "none"
  readonly limit?: number
  /** Scatter axis names. */
  readonly x_label?: string
  readonly y_label?: string
  /** Logarithmic axes; "auto" switches on for wide ranges (scatter 100x, bars and lines 1000x). */
  readonly log?: boolean | "auto"
  /** Heatmap. */
  readonly rows?: readonly string[]
  readonly cols?: readonly string[]
  readonly values?: readonly (readonly (number | null)[])[]
  /** Heatmap: lower values are better (ranks), so they get the "good" color. */
  readonly lower_is_better?: boolean
  /** Geogrid: [row, col] of the business location, drawn as a pin. Defaults to the middle tile. */
  readonly center?: readonly number[]
  /** Source line printed under the chart, e.g. endpoint and cost. */
  readonly source?: string
}

/** Color roles. A number is a series index into the categorical palette. */
export type Role =
  | number
  | "title"
  | "muted"
  | "axis"
  | "text"
  | "good"
  | "bad"
  | "heat0"
  | "heat1"
  | "heat2"
  | "heat3"
  | "heat4"
  | "seq0"
  | "seq1"
  | "seq2"
  | "seq3"
  | "seq4"
  | "tile"
  | "grade0"
  | "grade1"
  | "grade2"
  | "grade3"
  | "grade4"
  | "grade5"
  | "grade6"
  | "none"

export interface Segment {
  readonly text: string
  readonly role: Role
  readonly bold?: boolean
  /** Table header cells: the column this cell heads (0 is the label column). Lets a UI sort on click. */
  readonly column?: number
  /** Background color role (map tiles). */
  readonly bg?: Role
  /** Detail shown when the pointer is over this segment. */
  readonly tip?: string
}
export type Line = Segment[]

// ---------------------------------------------------------------------------------------------
// Validation

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

export function validate(spec: Spec): string[] {
  const errors: string[] = []
  if (!ChartTypes.includes(spec.type)) {
    errors.push(`Unknown chart type "${String(spec.type)}". Use one of: ${ChartTypes.join(", ")}.`)
    return errors
  }
  const series = spec.series ?? []
  const x = spec.x ?? []
  if (spec.type === "geogrid") {
    const values = spec.values ?? []
    if (values.length < 2 || values.some((r) => r.length !== values[0].length) || values[0].length < 2)
      errors.push(
        "geogrid needs values[][]: a rectangular grid of ranks, at least 2 x 2 (null where the business is not found).",
      )
    return errors
  }
  if (spec.type === "tilemap") {
    const x = spec.x ?? []
    const known = x.filter((r) => stateCode(r) !== undefined)
    if (!spec.series?.[0] || known.length === 0)
      errors.push("tilemap needs x = US state names or codes and one series of values.")
    return errors
  }
  if (spec.type === "heatmap") {
    const rows = spec.rows ?? []
    const cols = spec.cols ?? []
    const values = spec.values ?? []
    if (rows.length === 0 || cols.length === 0) errors.push("heatmap needs rows[] and cols[].")
    if (values.length !== rows.length)
      errors.push(`heatmap values has ${values.length} rows, rows[] has ${rows.length}.`)
    values.forEach((row, i) => {
      if (row.length !== cols.length)
        errors.push(`heatmap values row ${i + 1} has ${row.length} cells, cols[] has ${cols.length}.`)
    })
    return errors
  }
  if (series.length === 0) {
    const gridShape = spec.rows !== undefined || spec.cols !== undefined || spec.values !== undefined
    errors.push(
      gridShape
        ? `${spec.type} does not take rows, cols or values (those are for heatmap). Use x for row labels and series [{ name, values }] for columns.`
        : `${spec.type} needs at least one series.`,
    )
    return errors
  }
  if (spec.type === "gauge") {
    series.forEach((s) => {
      const v = s.values[0]
      if (!num(v) || v < 0 || v > 100)
        errors.push(`gauge "${s.name}" needs values: [score] with a score from 0 to 100 (or 0 to 1).`)
    })
    return errors
  }
  if (spec.type === "overlap") {
    const sets = overlapSets(spec)
    if (sets.length < 2 || sets.length > 3)
      errors.push(
        `overlap needs 2 or 3 sets: x = each name, then each shared region as "a + b" (found ${sets.length}).`,
      )
    sets.forEach((name) => {
      if (!x.includes(name))
        errors.push(`overlap is missing the total for "${name}": add "${name}" to x with its keyword count.`)
    })
    if (sets.length >= 2)
      for (const pair of combos(sets).filter((c) => c.length >= 2))
        if (!x.some((r) => sameRegion(r, pair)))
          errors.push(`overlap is missing the shared count for "${pair.join(" + ")}".`)
    if (!series[0] || series[0].values.length !== x.length || series[0].values.some((v) => !num(v)))
      errors.push("overlap needs one series with a count for every x region.")
    return errors
  }
  if (spec.type === "kpi") {
    series.forEach((s) => {
      if (s.values.length < 1 || !num(s.values[0])) errors.push(`kpi "${s.name}" needs values: [current, previous?].`)
    })
    return errors
  }
  if (spec.type === "scatter") {
    series.forEach((s) => {
      const bad = s.values.filter((v) => !Array.isArray(v) || v.length !== 2 || !num(v[0]) || !num(v[1]))
      if (bad.length) errors.push(`scatter "${s.name}" values must be [x, y] number pairs (${bad.length} are not).`)
    })
    const points = series.reduce((n, s) => n + s.values.length, 0)
    if (points < 3) errors.push(`scatter needs at least 3 points, got ${points}.`)
    return errors
  }
  if (spec.type === "sparkline") {
    series.forEach((s) => {
      if (s.values.filter(num).length < 3) errors.push(`sparkline "${s.name}" needs at least 3 numbers.`)
    })
    return errors
  }
  if (x.length === 0) errors.push(`${spec.type} needs x labels.`)
  series.forEach((s) => {
    if (s.values.length !== x.length)
      errors.push(`series "${s.name}" has ${s.values.length} values but x has ${x.length} labels.`)
  })
  const minPoints =
    spec.type === "table" || spec.type === "share-bar" || spec.type === "donut" || spec.type === "distribution" ? 1 : 3
  if (spec.type !== "table" && x.length < minPoints)
    errors.push(`${spec.type} needs at least ${minPoints} points, got ${x.length}.`)
  if (spec.type === "grouped-bar" && series.length < 2) errors.push("grouped-bar needs 2 or more series.")
  if (spec.type === "diverging-bar" && series.length !== 2)
    errors.push("diverging-bar needs exactly 2 series: [positive (e.g. new), negative (e.g. lost)].")
  return errors
}

// ---------------------------------------------------------------------------------------------
// Helpers

const seg = (text: string, role: Role = "text", bold?: boolean): Segment => ({ text, role, bold })
const width = (line: Line) => line.reduce((n, s) => n + [...s.text].length, 0)
const pad = (text: string, n: number, right = false) => {
  const len = [...text].length
  if (len >= n) return text
  return right ? " ".repeat(n - len) + text : text + " ".repeat(n - len)
}
const cut = (text: string, n: number) => {
  const chars = [...text]
  if (chars.length <= n) return text
  if (n <= 1) return chars.slice(0, n).join("")
  return chars.slice(0, n - 1).join("") + "…"
}

export function formatNumber(v: number | null | undefined, unit?: string): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "n/a"
  const abs = Math.abs(v)
  let text: string
  if (unit === "$" || unit === "USD") {
    text = abs >= 1 ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${trim(v.toPrecision(3))}`
    return text
  }
  if (abs >= 1e9) text = trim((v / 1e9).toFixed(1)) + "B"
  else if (abs >= 1e6) text = trim((v / 1e6).toFixed(1)) + "M"
  else if (abs >= 1e4) text = trim((v / 1e3).toFixed(1)) + "k"
  else if (Number.isInteger(v)) text = v.toLocaleString("en-US")
  else text = trim(v.toFixed(abs < 1 ? 3 : 2))
  if (unit === "%") return text + "%"
  return unit && unit !== "" ? `${text} ${unit}` : text
}
const trim = (s: string) => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s)

/** Rank series (positions): lower is better. Bars give the best rank the longest bar, and values read "#3". */
export function isRank(spec: Spec, series: readonly Series[]) {
  return (
    /^(positions?|ranks?|pos)$/i.test(spec.unit ?? "") ||
    (series.length > 0 && series.every((s) => s.lower_is_better === true))
  )
}
export const rankText = (v: number) => `#${formatNumber(v)}`

/** A part's share of the whole: whole percents, one decimal only where that matters (0.4%, 9.5%). */
export function percentText(part: number, total: number) {
  const pct = total > 0 ? (part / total) * 100 : 0
  return `${pct > 0 && pct < 10 && !Number.isInteger(Math.round(pct * 10) / 10) ? trim(pct.toFixed(1)) : Math.round(pct)}%`
}

/**
 * Round axis bounds on a 1, 2, 2.5 or 5 step, plus a round middle tick, so the axis labels read as plain
 * numbers (30k, 45k, 60k), never 30.7k or 15.72.
 */
export function niceAxis(lo: number, hi: number): { lo: number; hi: number; mid: number; step: number } {
  if (!(hi > lo)) {
    lo -= 1
    hi += 1
  }
  const raw = (hi - lo) / 3
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw * 0.999) ?? 10 * mag
  const a = Math.floor(lo / step + 1e-9) * step
  const b = Math.ceil(hi / step - 1e-9) * step
  return { lo: a, hi: b, mid: a + step * Math.round((b - a) / step / 2), step }
}

const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"]
function bar(value: number, max: number, cells: number): string {
  if (max <= 0 || value <= 0 || cells <= 0) return ""
  const exact = (value / max) * cells
  const full = Math.floor(exact)
  const rest = Math.round((exact - full) * 8)
  const text = "█".repeat(full) + (rest > 0 && rest < 8 ? EIGHTHS[rest] : rest === 8 ? "█" : "")
  return text || "▏"
}

/**
 * A one-row trend drawn with bar blocks (▁ to █), one block per value, so a monthly trend reads as a solid
 * little chart rather than scattered dots. lowerIsBetter flips it so improvement points up; a missing value
 * is a gap.
 */
export function sparkline(values: readonly (number | null)[], lowerIsBetter = false): string {
  const nums = values.filter(num)
  if (nums.length === 0) return ""
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return values
    .map((v) => {
      if (!num(v)) return " "
      const t = max === min ? 0.5 : (v - min) / (max - min)
      return LEVELS[Math.round((lowerIsBetter ? 1 - t : t) * (LEVELS.length - 1))]
    })
    .join("")
}
// No full block: the tallest bar stops short of the cell, so trends in neighbouring rows never touch.
const LEVELS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇"]

/** Whether a trend went up, down or stayed flat (within 5%), as a color role: up is good unless lower is better. */
export function trendRole(values: readonly (number | null)[], lowerIsBetter = false): Role {
  const nums = values.filter(num)
  if (nums.length < 2) return "muted"
  const first = nums[0]
  const last = nums[nums.length - 1]
  const change = first === 0 ? (last === 0 ? 0 : 1) : (last - first) / Math.abs(first)
  if (Math.abs(change) < 0.05) return "muted"
  return change > 0 !== lowerIsBetter ? "good" : "bad"
}

/** The change over a trend: the last 3 values against the first 3 (or last against first when short). */
export function trendChange(values: readonly (number | null)[]): number | undefined {
  const nums = values.filter(num)
  if (nums.length < 2) return undefined
  const k = nums.length >= 6 ? 3 : 1
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const first = avg(nums.slice(0, k))
  const last = avg(nums.slice(-k))
  if (first === 0) return last === 0 ? 0 : undefined
  return ((last - first) / Math.abs(first)) * 100
}

/** A trend cell: the last 12 values as bars, then the change ("↑38%"); "-" when there is nothing to show. */
export function trendText(values: readonly (number | null)[], lowerIsBetter = false): string {
  const last = values.slice(-12)
  const nums = last.filter(num)
  if (nums.length === 0 || nums.every((v) => v === 0)) return "-"
  const change = trendChange(last)
  const arrow =
    change === undefined
      ? ""
      : Math.abs(change) < 5
        ? " →"
        : ` ${change > 0 ? "↑" : "↓"}${Math.round(Math.abs(change))}%`
  return sparkline(last, lowerIsBetter) + arrow
}

/**
 * Keyword difficulty tiers (as open-seo draws them): 0 to 20 easy through 81 to 100, each with its own grade
 * color from green to dark red.
 */
export const KD_TIERS: readonly { max: number; role: Role; label: string }[] = [
  { max: 20, role: "grade6", label: "0-20" },
  { max: 35, role: "grade5", label: "21-35" },
  { max: 50, role: "grade4", label: "36-50" },
  { max: 65, role: "grade2", label: "51-65" },
  { max: 80, role: "grade1", label: "66-80" },
  { max: Infinity, role: "grade0", label: "81+" },
]
export const kdRole = (v: number): Role => KD_TIERS.find((tier) => v <= tier.max)!.role
/** A column or axis that holds keyword difficulty. */
export const isDifficulty = (name: string | undefined) =>
  name !== undefined &&
  /^\s*(kd|keyword difficulty|difficulty|kw difficulty|seo difficulty)\s*(\(.*\))?\s*$/i.test(name)

/** Search intent as a short colored pill: Info, Comm, Trans, Nav. */
export function intentPill(value: string): { text: string; role: Role } | undefined {
  const v = value.trim().toLowerCase()
  if (v.startsWith("info")) return { text: "Info", role: 0 }
  if (v.startsWith("comm")) return { text: "Comm", role: "heat2" }
  if (v.startsWith("trans")) return { text: "Trans", role: "good" }
  if (v.startsWith("nav")) return { text: "Nav", role: 4 }
  return undefined
}

function header(spec: Spec, cols: number): Line[] {
  const out: Line[] = []
  if (spec.title) out.push([seg(cut(spec.title, cols), "title", true)])
  if (spec.subtitle) out.push([seg(cut(spec.subtitle, cols), "muted")])
  if (out.length) out.push([])
  return out
}
function footer(spec: Spec, cols: number, extra: Line[] = []): Line[] {
  const out: Line[] = [...extra]
  if (spec.source) out.push([seg(cut(spec.source, cols), "muted")])
  return out
}

export function ordered(spec: Spec): { x: string[]; series: Series[] } {
  let idx = (spec.x ?? []).map((_, i) => i)
  const first = spec.series?.[0]
  if (first && spec.sort && spec.sort !== "none") {
    const key = (i: number) => (num(first.values[i]) ? (first.values[i] as number) : -Infinity)
    idx.sort((a, b) => (spec.sort === "asc" ? key(a) - key(b) : key(b) - key(a)))
  }
  if (spec.limit && spec.limit > 0) idx = idx.slice(0, spec.limit)
  return {
    x: idx.map((i) => spec.x![i]),
    series: (spec.series ?? []).map((s) => ({
      ...s,
      values: idx.map((i) => s.values[i]),
      ...(s.labels ? { labels: idx.map((i) => s.labels![i]) } : {}),
    })),
  }
}

/** Lay out items left to right, wrapping before an item that would pass the width. */
function wrap(items: readonly Line[], cols: number): Line[] {
  const lines: Line[] = []
  let line: Line = []
  items.forEach((item) => {
    if (width(line) + width(item) > cols && line.length) {
      lines.push(line)
      line = []
    }
    line.push(...item)
  })
  if (line.length) lines.push(line)
  return lines
}

function legend(series: readonly Series[], cols: number): Line[] {
  if (series.length < 2) return []
  const lines: Line[] = []
  let line: Line = []
  series.forEach((s, i) => {
    const item = [seg("■ ", i), seg(s.name + "   ", "muted")]
    if (width(line) + width(item) > cols && line.length) {
      lines.push(line)
      line = []
    }
    line.push(...item)
  })
  if (line.length) lines.push(line)
  return lines
}

/** Cut a line to the width, keeping its colors. */
function trimLine(line: Line, cols: number): Line {
  const out: Line = []
  let left = cols
  for (const s of line) {
    if (left <= 0) break
    const chars = [...s.text]
    out.push(chars.length <= left ? s : { ...s, text: chars.slice(0, left).join("") })
    left -= Math.min(left, chars.length)
  }
  // Drop trailing padding.
  while (out.length && out[out.length - 1].role === "none") out.pop()
  return out
}

// ---------------------------------------------------------------------------------------------
// Renderers

function renderTable(spec: Spec, cols: number): Line[] {
  const { x, series } = ordered(spec)
  const headers = ["", ...series.map((s) => s.name)]
  const intent = series.map((s) => /intent/i.test(s.name))
  const body = x.map((label, r) => [
    label,
    ...series.map((s, c) => {
      const v = s.values[r]
      if (Array.isArray(v)) return trendText(v as (number | null)[], s.lower_is_better === true)
      if (num(v)) return formatNumber(v, isDifficulty(s.name) ? undefined : spec.unit)
      if (intent[c] && typeof v === "string") return intentPill(v)?.text ?? v
      return v === null || v === undefined ? "" : String(v)
    }),
  ])
  // Colors: trends by direction, difficulty by tier, intent by kind; everything else plain text.
  const cellRole = (c: number, r: number): Role => {
    if (c === 0) return "text"
    const s = series[c - 1]
    const v = s.values[r]
    if (Array.isArray(v)) return trendRole((v as (number | null)[]).slice(-12), s.lower_is_better === true)
    if (num(v) && isDifficulty(s.name)) return kdRole(v)
    if (intent[c - 1] && typeof v === "string") return intentPill(v)?.role ?? "text"
    return "text"
  }
  const numeric = headers.map((_, c) => (c === 0 ? false : series[c - 1].values.every((v) => v === null || num(v))))
  const dataWidth = headers.map((_, c) => Math.max(1, ...body.map((row) => [...row[c]].length)))
  const widths = headers.map((h, c) => Math.max([...h].length, dataWidth[c]))
  const gap = 2
  const total = () => widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1)
  // Make room in this order: long headers down to their data, text columns from the right
  // (URLs give way before keywords), the label column last, then hide trailing columns.
  for (let c = 1; c < widths.length && total() > cols; c++) {
    const floor = Math.max(dataWidth[c], 4)
    if (widths[c] > floor) widths[c] = Math.max(floor, widths[c] - (total() - cols))
  }
  for (let c = widths.length - 1; c >= 1 && total() > cols; c--) {
    if (numeric[c]) continue
    const floor = 10
    if (widths[c] > floor) widths[c] = Math.max(floor, widths[c] - (total() - cols))
  }
  if (total() > cols && widths[0] > 14) widths[0] = Math.max(14, widths[0] - (total() - cols))
  let hidden = 0
  while (total() > cols && widths.length > 2) {
    widths.pop()
    headers.pop()
    body.forEach((row) => row.pop())
    hidden++
  }
  const line = (cells: string[], roles: Role[], bold = false, columns = false): Line =>
    cells.flatMap((cell, c) => {
      const text = numeric[c] ? pad(cut(cell, widths[c]), widths[c], true) : pad(cut(cell, widths[c]), widths[c])
      const strong = bold || (!columns && c > 0 && isDifficulty(series[c - 1]?.name))
      const cellSeg: Segment = columns ? { text, role: roles[c], bold, column: c } : seg(text, roles[c], strong)
      return c === 0 ? [cellSeg] : [seg(" ".repeat(gap), "none"), cellSeg]
    })
  const out: Line[] = [...header(spec, cols)]
  out.push(
    line(
      headers,
      headers.map(() => "muted" as Role),
      true,
      true,
    ),
  )
  out.push([seg("─".repeat(Math.min(cols, total())), "axis")])
  body.forEach((row, r) =>
    out.push(
      line(
        row,
        row.map((_, c) => cellRole(c, r)),
      ),
    ),
  )
  const more: Line[] = hidden
    ? [[seg(`${hidden} more column${hidden > 1 ? "s" : ""} hidden at this width`, "muted")]]
    : []
  return [...out, ...footer(spec, cols, more)]
}

function renderKpi(spec: Spec, cols: number): Line[] {
  const tiles = (spec.series ?? []).map((s) => {
    const cur = s.values[0] as number
    const prev = num(s.values[1]) ? (s.values[1] as number) : undefined
    const delta = prev !== undefined && prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : undefined
    return { name: s.name, value: formatNumber(cur, spec.unit), delta, prev, inverse: s.lower_is_better === true }
  })
  const tileWidth = Math.max(14, ...tiles.map((t) => Math.max([...t.name].length, [...t.value].length) + 2))
  const perRow = Math.max(1, Math.floor((cols + 2) / (tileWidth + 2)))
  const out: Line[] = [...header(spec, cols)]
  for (let i = 0; i < tiles.length; i += perRow) {
    const row = tiles.slice(i, i + perRow)
    out.push(row.flatMap((t) => [seg(pad(cut(t.name, tileWidth), tileWidth + 2), "muted")]))
    out.push(row.flatMap((t) => [seg(pad(t.value, tileWidth + 2), "title", true)]))
    out.push(
      row.flatMap((t) => {
        if (t.delta === undefined) return [seg(pad("", tileWidth + 2), "none")]
        const up = t.delta >= 0
        const text = `${up ? "▲" : "▼"} ${Math.abs(t.delta).toFixed(1)}%`
        return [seg(pad(text, tileWidth + 2), up !== t.inverse ? "good" : "bad")]
      }),
    )
    out.push([])
  }
  return [...out.slice(0, -1), ...footer(spec, cols)]
}

function renderHbar(spec: Spec, cols: number, grouped: boolean): Line[] {
  const { x, series } = ordered(spec)
  const shown = grouped ? series : series.slice(0, 1)
  const values = shown.flatMap((s) => s.values.filter(num) as number[])
  // Ranks: position 1 gets the longest bar, so the longest bar is always the winner.
  const rank = isRank(spec, shown)
  const worst = Math.max(1, ...values)
  const strength = (v: number) => (rank ? (v > 0 ? worst + 1 - v : 0) : v)
  const valueText = (v: Cell | undefined) =>
    num(v) ? (rank ? rankText(v) : formatNumber(v, spec.unit)) : rank ? "not ranking" : "n/a"
  const positive = values.filter((v) => v > 0)
  const logScale =
    !rank &&
    (spec.log === true ||
      ((spec.log === undefined || spec.log === "auto") &&
        positive.length > 1 &&
        Math.max(...positive) / Math.min(...positive) >= 1000))
  const scaled = (v: number) =>
    logScale ? (v > 0 ? Math.log10(v) - Math.log10(Math.min(...positive)) + 0.3 : 0) : strength(v)
  const max = Math.max(0, ...values.map(scaled))
  const labelWidth = Math.min(Math.max(...x.map((l) => [...l].length), 4), Math.floor(cols * 0.35))
  const valueWidth = Math.max(...shown.flatMap((s) => s.values.map((v) => valueText(v).length)), 3)
  const cells = Math.max(4, cols - labelWidth - valueWidth - 3)
  const out: Line[] = [...header(spec, cols)]
  x.forEach((label, r) => {
    shown.forEach((s, k) => {
      const v = s.values[r]
      const value = num(v) ? v : 0
      const tip = `${label}${grouped ? `, ${s.name}` : ""}: ${rank ? valueText(v) : num(v) ? v.toLocaleString("en-US") + (spec.unit ? ` ${spec.unit}` : "") : "n/a"}`
      out.push([
        { ...seg(pad(k === 0 ? cut(label, labelWidth) : "", labelWidth), "text"), tip },
        seg(" │", "axis"),
        { ...seg(bar(scaled(value), max, cells), grouped ? k : 0), tip },
        seg(" " + valueText(v), "muted"),
      ])
    })
    if (grouped && r < x.length - 1) out.push([seg(pad("", labelWidth) + " │", "axis")])
  })
  const note: Line[] = logScale
    ? [
        [],
        [
          seg(
            cut(
              cols >= 60 ? "bar length on a log scale (values span 3+ orders of magnitude)" : "bars on a log scale",
              cols,
            ),
            "muted",
          ),
        ],
      ]
    : rank
      ? [[], [seg(cut("longer bar = better rank (#1 is best)", cols), "muted")]]
      : []
  return [...out, ...footer(spec, cols, [...note, ...(grouped ? [[], ...legend(series, cols)] : [])])]
}

function renderShare(spec: Spec, cols: number): Line[] {
  const raw0 = (spec.series?.[0]?.values ?? []).map((v) => (num(v) && v > 0 ? v : 0))
  const order0 = raw0.map((_, i) => i)
  if (spec.sort !== "none") order0.sort((a, b) => (spec.sort === "asc" ? raw0[a] - raw0[b] : raw0[b] - raw0[a]))
  const x = order0.map((i) => (spec.x ?? [])[i])
  const values = order0.map((i) => raw0[i])
  const total = values.reduce((a, b) => a + b, 0)
  const out: Line[] = [...header(spec, cols)]
  if (total <= 0) return [...out, [seg("No data", "muted")]]
  const cells = Math.max(10, cols)
  // Largest remainder so the parts add up to the full width; every non-zero part gets at least one cell.
  const raw = values.map((v) => (v / total) * cells)
  const alloc = raw.map((r, i) => (values[i] > 0 ? Math.max(1, Math.floor(r)) : 0))
  let left = cells - alloc.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0])
  for (let k = 0; left > 0 && k < order.length * 2; k++) {
    const i = order[k % order.length][1]
    if (values[i] > 0) {
      alloc[i]++
      left--
    }
  }
  while (left < 0) {
    const i = alloc.indexOf(Math.max(...alloc))
    alloc[i]--
    left++
  }
  const strip: Line = alloc.map((n, i) => seg("█".repeat(n), i))
  out.push(
    strip,
    strip.map((s) => ({ ...s })),
  )
  out.push([])
  // One row per part, largest first: name, its own bar on the same scale (so small parts stay visible),
  // share and value. The strip above shows the whole; these rows make each part readable.
  // Values given as percents are shown as given (they may cover only part of the whole).
  const pctText = (v: number) => (spec.unit === "%" ? formatNumber(v, "%") : percentText(v, total))
  // Values already given as percents would only repeat the share.
  const tail = values.map((v) => (spec.unit === "%" ? "" : `  ${formatNumber(v, spec.unit)}`))
  const tailW = 7 + Math.max(0, ...tail.map((t) => t.length))
  const labelW = Math.max(
    4,
    Math.min(Math.max(...x.map((l) => [...l].length), 4), Math.floor(cols * 0.35), cols - 3 - tailW - 4),
  )
  const barW = Math.max(1, cols - labelW - 3 - tailW)
  const max = Math.max(...values)
  x.forEach((label, i) => {
    const n = values[i] > 0 ? Math.max(1, Math.round((values[i] / max) * barW)) : 0
    out.push([
      seg("■ ", i),
      seg(pad(cut(label, labelW), labelW) + " ", "text"),
      seg("█".repeat(n), i),
      seg(" ".repeat(barW - n), "none"),
      seg(pad(pctText(values[i]), 7, true), "text", true),
      seg(cut(tail[i], Math.max(0, cols - labelW - 3 - barW - 7)), "muted"),
    ])
  })
  return [...out, ...footer(spec, cols)]
}

function renderDiverging(spec: Spec, cols: number): Line[] {
  const x = spec.x ?? []
  const [pos, neg] = spec.series ?? []
  const p = pos.values.map((v) => (num(v) ? Math.abs(v) : 0))
  const n = neg.values.map((v) => (num(v) ? Math.abs(v) : 0))
  const max = niceAxis(0, Math.max(1, ...p, ...n)).hi
  const half = 5
  const axisWidth = Math.max(formatNumber(max).length + 1, 3)
  const avail = cols - axisWidth - 2
  const step = Math.max(1, Math.ceil(x.length / avail))
  const buckets: { p: number; n: number }[] = []
  for (let i = 0; i < x.length; i += step) {
    buckets.push({ p: Math.max(...p.slice(i, i + step)), n: Math.max(...n.slice(i, i + step)) })
  }
  // Up to 6 columns a bar with a one column gap, so each month reads as its own bar.
  const colWidth = Math.max(1, Math.min(6, Math.floor(avail / buckets.length)))
  const barWidth = colWidth >= 3 ? colWidth - 1 : colWidth
  const gap = " ".repeat(colWidth - barWidth)
  const out: Line[] = [...header(spec, cols)]
  const UP = " ▁▂▃▄▅▆▇█"
  const DOWN = " ▔▔▀▀▀▀██"
  for (let row = half; row >= 1; row--) {
    const line: Line = [seg(pad(row === half ? formatNumber(max) : "", axisWidth, true) + " │", "axis")]
    buckets.forEach((b) => {
      const h = (b.p / max) * half
      const fill = h >= row ? 8 : h > row - 1 ? Math.round((h - (row - 1)) * 8) : 0
      line.push(seg(UP[fill].repeat(barWidth), "good"), seg(gap, "none"))
    })
    out.push(line)
  }
  out.push([seg(pad("0", axisWidth, true) + " ┼", "axis"), seg("─".repeat(buckets.length * colWidth), "axis")])
  for (let row = 1; row <= half; row++) {
    const line: Line = [seg(pad(row === half ? "-" + formatNumber(max) : "", axisWidth, true) + " │", "axis")]
    buckets.forEach((b) => {
      const h = (b.n / max) * half
      const fill = h >= row ? 8 : h > row - 1 ? Math.round((h - (row - 1)) * 8) : 0
      line.push(seg(DOWN[fill].repeat(barWidth), "bad"), seg(gap, "none"))
    })
    out.push(line)
  }
  out.push(
    spreadLabels(
      buckets.map((_, b) => x[b * step]),
      buckets.map((_, b) => b * colWidth + (barWidth - 1) / 2),
      axisWidth + 2,
      Math.min(buckets.length * colWidth, cols - axisWidth - 2),
    ),
  )
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
  const totals = wrap(
    [
      [seg("■ ", "good"), seg(`${pos.name} ${formatNumber(sum(p), spec.unit)}   `, "muted")],
      [seg("■ ", "bad"), seg(`${neg.name} ${formatNumber(sum(n), spec.unit)}   `, "muted")],
      [
        seg(
          `net ${sum(p) - sum(n) >= 0 ? "+" : ""}${formatNumber(sum(p) - sum(n), spec.unit)}`,
          sum(p) - sum(n) >= 0 ? "good" : "bad",
        ),
      ],
    ],
    cols,
  )
  return [...out, [], ...totals, ...footer(spec, cols)]
}

/**
 * Category labels under a chart, each centred on its column (`at`), spaced evenly: every label when they fit,
 * otherwise every 2nd, 3rd and so on, always keeping the first and, when there is room, the last.
 */
export function spreadLabels(labels: readonly string[], at: readonly number[], indent: number, span: number): Line {
  const n = labels.length
  if (n === 0 || span <= 0) return []
  const place = (idx: number[]) => {
    const row = Array<string>(span).fill(" ")
    let end = -2
    for (const i of idx) {
      const text = [...cut(labels[i], span)]
      const start = Math.max(0, Math.min(span - text.length, Math.round(at[i] - (text.length - 1) / 2)))
      if (start <= end + 1) return undefined
      text.forEach((c, k) => (row[start + k] = c))
      end = start + text.length - 1
    }
    return row.join("").trimEnd()
  }
  for (let stride = 1; stride <= n; stride++) {
    const idx: number[] = []
    for (let i = 0; i < n; i += stride) idx.push(i)
    const text = (idx[idx.length - 1] !== n - 1 ? place([...idx, n - 1]) : undefined) ?? place(idx)
    if (text !== undefined) return [seg(" ".repeat(indent), "none"), seg(text, "muted")]
  }
  return [seg(" ".repeat(indent), "none"), seg(cut(labels[0], span), "muted")]
}

// Braille canvas: each cell is 2 x 4 dots.
const DOT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]
class Canvas {
  readonly cells: number[][]
  readonly owner: number[][]
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.cells = Array.from({ length: h }, () => Array(w).fill(0))
    this.owner = Array.from({ length: h }, () => Array(w).fill(-1))
  }
  readonly marks = new Map<string, { count: number; color: Role; tips: string[]; glyph?: string }>()
  /** A whole-cell marker (scatter points); several points in one cell show their count. */
  mark(px: number, py: number, color: Role, tip?: string, glyph?: string): void {
    const cx = Math.floor(px / 2)
    const cy = Math.floor(py / 4)
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return
    // A lettered point whose spot is taken moves to the nearest free cell beside it, so it keeps its letter.
    if (glyph && this.marks.has(`${cy}:${cx}`)) {
      const near = [
        [0, 1],
        [0, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [-1, -1],
        [1, 1],
        [1, -1],
        [0, 2],
        [0, -2],
      ].find(([dy, dx]) => {
        const y = cy + dy
        const x = cx + dx
        return y >= 0 && x >= 0 && y < this.h && x < this.w && !this.marks.has(`${y}:${x}`)
      })
      if (near) return this.mark((cx + near[1]) * 2, (cy + near[0]) * 4, color, tip, glyph)
    }
    const key = `${cy}:${cx}`
    const m = this.marks.get(key)
    this.marks.set(key, {
      count: (m?.count ?? 0) + 1,
      color: m ? m.color : color,
      tips: [...(m?.tips ?? []), ...(tip ? [tip] : [])],
      glyph: m ? undefined : glyph,
    })
  }
  set(px: number, py: number, color: number) {
    const cx = Math.floor(px / 2)
    const cy = Math.floor(py / 4)
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return
    this.cells[cy][cx] |= DOT[py % 4][px % 2]
    this.owner[cy][cx] = color
  }
  line(x0: number, y0: number, x1: number, y1: number, color: number) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= steps; i++) {
      this.set(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), color)
    }
  }
  row(y: number): Line {
    const out: Line = []
    for (let x = 0; x < this.w; x++) {
      const bits = this.cells[y][x]
      const m = this.marks.get(`${y}:${x}`)
      const text = m
        ? m.count === 1
          ? (m.glyph ?? "●")
          : m.count < 10
            ? String(m.count)
            : "+"
        : bits
          ? String.fromCharCode(0x2800 + bits)
          : " "
      const role: Role = m ? m.color : bits ? this.owner[y][x] : "none"
      const last = out[out.length - 1]
      if (m && m.tips.length) {
        const shown = m.tips.slice(0, 4).join("; ") + (m.tips.length > 4 ? `; and ${m.tips.length - 4} more` : "")
        out.push({ text, role, tip: shown })
      } else if (last && last.role === role && !last.tip) out[out.length - 1] = { ...last, text: last.text + text }
      else out.push(seg(text, role))
    }
    return out
  }
}

function plotFrame(
  spec: Spec,
  cols: number,
  yMin: number,
  yMax: number,
  height: number,
  draw: (canvas: Canvas, toX: (v: number) => number, toY: (v: number) => number, plotW: number) => void,
  xDomain: [number, number],
  yFormat: (v: number) => string,
  xLabels: Line,
  invert = false,
  ticks: readonly number[] = [yMin, (yMin + yMax) / 2, yMax],
): Line[] {
  const axisWidth = Math.max(...ticks.map((t) => yFormat(t).length))
  const plotW = Math.max(10, cols - axisWidth - 2)
  const canvas = new Canvas(plotW, height)
  const toX = (v: number) =>
    xDomain[1] === xDomain[0] ? 0 : Math.round(((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (plotW * 2 - 1))
  const toY = (v: number) => {
    if (yMax === yMin) return height * 2
    const t = (v - yMin) / (yMax - yMin)
    return Math.round((invert ? t : 1 - t) * (height * 4 - 1))
  }
  draw(canvas, toX, toY, plotW)
  const out: Line[] = [...header(spec, cols)]
  // Each tick label sits on the row its value falls in.
  const tickRows = new Map(ticks.map((t) => [Math.max(0, Math.min(height - 1, Math.floor(toY(t) / 4))), yFormat(t)]))
  for (let r = 0; r < height; r++) {
    const label = tickRows.get(r) ?? ""
    out.push([seg(pad(label, axisWidth, true) + " ┤", "axis"), ...canvas.row(r)])
  }
  out.push([seg(" ".repeat(axisWidth) + " └", "axis"), seg("─".repeat(plotW), "axis")])
  out.push(xLabels)
  return out
}

function renderLine(spec: Spec, cols: number): Line[] {
  const x = spec.x ?? []
  const series = spec.series ?? []
  const raw = series.flatMap((s) => s.values.filter(num) as number[])
  const rank = series.length > 0 && isRank(spec, series)
  // Log scale: on request, or automatically when every value is positive and they span 1000x or more.
  const logScale =
    !rank &&
    raw.length > 1 &&
    Math.min(...raw) > 0 &&
    (spec.log === true ||
      ((spec.log === undefined || spec.log === "auto") && Math.max(...raw) / Math.min(...raw) >= 1000))
  const f = (v: number) => (logScale ? Math.log10(v) : v)
  const values = raw.map(f)
  let yMin = Math.min(...values)
  let yMax = Math.max(...values)
  let ticks: number[]
  if (logScale) {
    if (yMin === yMax) {
      yMin -= 1
      yMax += 1
    }
    ticks = [yMin, (yMin + yMax) / 2, yMax]
  } else if (rank) {
    // Ranks run from #1 at the top down to a round worst position.
    const axis = niceAxis(0, Math.max(2, yMax))
    yMin = 1
    yMax = axis.hi
    ticks = [1, axis.mid, axis.hi]
  } else {
    const axis = niceAxis(yMin, yMax)
    yMin = Math.min(...values) >= 0 ? Math.max(0, axis.lo) : axis.lo
    yMax = axis.hi
    ticks = [yMin, axis.mid, yMax]
  }
  const height = 10
  const axisLabel = (v: number) => (rank ? rankText(v) : formatNumber(logScale ? 10 ** v : v))
  const axisWidth = Math.max(...ticks.map((t) => axisLabel(t).length))
  const plotW = Math.max(10, cols - axisWidth - 2)
  const lines = plotFrame(
    spec,
    cols,
    yMin,
    yMax,
    height,
    (canvas, toX, toY) => {
      series.forEach((s, k) => {
        let prev: [number, number] | undefined
        s.values.forEach((v, i) => {
          if (!num(v)) {
            prev = undefined
            return
          }
          const point: [number, number] = [toX(i), toY(f(v))]
          if (prev) canvas.line(prev[0], prev[1], point[0], point[1], k)
          else canvas.set(point[0], point[1], k)
          prev = point
        })
      })
    },
    [0, Math.max(1, x.length - 1)],
    axisLabel,
    spreadLabels(
      x,
      x.map((_, i) => (x.length > 1 ? (i / (x.length - 1)) * (plotW - 1) : 0)),
      axisWidth + 2,
      plotW,
    ),
    rank,
    ticks,
  )
  if (logScale) lines.push([seg(cut("log scale: values span 1000x or more", cols), "muted")])
  const stats: Line[] =
    series.length === 1
      ? (() => {
          const nums = series[0].values.filter(num) as number[]
          const first = nums[0]
          const last = nums[nums.length - 1]
          if (rank) {
            const places = first - last
            return wrap(
              [
                [seg(`best ${rankText(Math.min(...nums))}   `, "muted")],
                [seg(`worst ${rankText(Math.max(...nums))}   `, "muted")],
                [seg(`now ${rankText(last)}   `, "muted")],
                ...(places === 0
                  ? [[seg("no change over the period", "muted")]]
                  : [
                      [
                        seg(
                          `${places > 0 ? "▲ up" : "▼ down"} ${Math.abs(places)} place${Math.abs(places) === 1 ? "" : "s"} over the period`,
                          places > 0 ? "good" : "bad",
                        ),
                      ],
                    ]),
              ],
              cols,
            )
          }
          const change = first ? ((last - first) / Math.abs(first)) * 100 : undefined
          return wrap(
            [
              [seg(`min ${formatNumber(Math.min(...nums), spec.unit)}   `, "muted")],
              [seg(`max ${formatNumber(Math.max(...nums), spec.unit)}   `, "muted")],
              [seg(`last ${formatNumber(last, spec.unit)}   `, "muted")],
              ...(change === undefined
                ? []
                : [
                    [
                      seg(
                        `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}% over the period`,
                        change >= 0 !== (series[0].lower_is_better === true) ? "good" : "bad",
                      ),
                    ],
                  ]),
            ],
            cols,
          )
        })()
      : legend(series, cols)
  return [...lines, [], ...stats, ...footer(spec, cols)]
}

function renderScatter(spec: Spec, cols: number): Line[] {
  const series = spec.series ?? []
  const points = series.flatMap((s) => s.values as readonly [number, number][])
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  // Keyword volumes often span 100x or more; a linear axis would squash most points onto the floor.
  // Demand next to difficulty is usually skewed (one head term, many small ones): log at 20x there, else 100x.
  const wide = (a: number[], label: string | undefined, other: string | undefined) =>
    !isDifficulty(label) && Math.min(...a) > 0 && Math.max(...a) / Math.min(...a) >= (isDifficulty(other) ? 20 : 100)
  const auto = spec.log === "auto" || spec.log === undefined
  const logX = spec.log === true || (auto && wide(xs, spec.x_label, spec.y_label))
  const logY = spec.log === true || (auto && wide(ys, spec.y_label, spec.x_label))
  const fx = (v: number) => (logX ? Math.log10(Math.max(v, 1e-9)) : v)
  const fy = (v: number) => (logY ? Math.log10(Math.max(v, 1e-9)) : v)
  // Round axes: powers of ten on a log axis, plain round numbers otherwise.
  const bounds = (vals: number[], log: boolean) => {
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    if (log) {
      const a = Math.floor(lo + 1e-9)
      const b = Math.max(a + 1, Math.ceil(hi - 1e-9))
      return { lo: a, hi: b, ticks: b - a >= 2 && (b - a) % 2 === 0 ? [a, (a + b) / 2, b] : [a, b] }
    }
    const axis = niceAxis(lo, hi)
    const a = lo >= 0 ? Math.max(0, axis.lo) : axis.lo
    return { lo: a, hi: axis.hi, ticks: [a, axis.mid, axis.hi] }
  }
  const bx = bounds(xs.map(fx), logX)
  const by = bounds(ys.map(fy), logY)
  const xMin = bx.lo
  const xMax = bx.hi
  const yMin = by.lo
  const yMax = by.hi
  const un = (v: number, log: boolean) => (log ? Math.pow(10, v) : v)
  const axisWidth = Math.max(...by.ticks.map((t) => formatNumber(un(t, logY)).length))
  const room = Math.max(10, cols - axisWidth - 2)
  const tag = (label: string, log: boolean) => (log && !/\blog\b/i.test(label) ? `${label} (log)` : label)
  // Difficulty on an axis: every point takes its KD tier color (as open-seo colors KD).
  const kdAxis = isDifficulty(spec.x_label) ? "x" : isDifficulty(spec.y_label) ? "y" : undefined
  // Named points get letters, A for the largest y, with a key under the chart, so each dot says what it is.
  const named = series
    .flatMap((s, k) => (s.values as readonly [number, number][]).map((p, i) => ({ k, i, p, name: s.labels?.[i] })))
    .filter((d) => d.name)
    .sort((a, b) => b.p[1] - a.p[1])
    .slice(0, 26)
  const letters = new Map(named.map((d, n) => [`${d.k}:${d.i}`, String.fromCharCode(65 + n)]))
  const xLabels = spreadLabels(
    bx.ticks.map((t) => formatNumber(un(t, logX))),
    bx.ticks.map((t) => ((t - xMin) / (xMax - xMin || 1)) * (room - 1)),
    axisWidth + 2,
    room,
  )
  const lines = plotFrame(
    spec,
    cols,
    yMin,
    yMax,
    14,
    (canvas, toX, toY) => {
      series.forEach((s, k) =>
        (s.values as readonly [number, number][]).forEach(([vx, vy], i) => {
          const key = letters.get(`${k}:${i}`)
          canvas.mark(
            toX(fx(vx)),
            toY(fy(vy)),
            kdAxis ? kdRole(kdAxis === "x" ? vx : vy) : k,
            `${key ? `${key} ` : ""}${s.labels?.[i] ?? s.name}: ${spec.x_label ?? "x"} ${formatNumber(vx)}, ${spec.y_label ?? "y"} ${formatNumber(vy)}`,
            key,
          )
        }),
      )
    },
    [xMin, xMax],
    (v) => formatNumber(un(v, logY)),
    xLabels,
    false,
    by.ticks,
  )
  // Difficulty on the x axis: the axis line itself shows the KD tiers in their colors, easy to hard.
  if (kdAxis === "x" && !logX) {
    const axis = lines.findIndex((l) => l[0]?.text.endsWith("└"))
    if (axis >= 0) {
      const plotW = width(lines[axis]) - width([lines[axis][0]])
      const band: Line = []
      for (let c = 0; c < plotW; c++) {
        const role = kdRole(xMin + ((c + 0.5) / plotW) * (xMax - xMin))
        const last = band[band.length - 1]
        if (last && last.role === role) band[band.length - 1] = { ...last, text: last.text + "━" }
        else band.push(seg("━", role))
      }
      lines[axis] = [lines[axis][0], ...band]
    }
  }
  const names: Line[] = [
    ...(spec.x_label ? [[seg(cut(`x: ${tag(spec.x_label, logX)}`, cols), "muted")] as Line] : []),
    ...(spec.y_label ? [[seg(cut(`y: ${tag(spec.y_label, logY)}`, cols), "muted")] as Line] : []),
  ]
  const stacked = lines.slice(0, -1).some((l) => l.some((sg) => sg.tip !== undefined && /^[2-9+]$/.test(sg.text)))
  const yName: Line[] = stacked ? [...names, [seg("2 to 9: points sharing a spot, + more", "muted")]] : names
  const tiers: Line[] = kdAxis
    ? wrap(
        [[seg("KD ", "muted")], ...KD_TIERS.map((tier) => [seg("■ ", tier.role), seg(`${tier.label}  `, "muted")])],
        cols,
      )
    : []
  // The key: letter, name, then both values, laid out in columns.
  const keyItems: Line[] = named.map((d, n) => {
    const role: Role = kdAxis ? kdRole(kdAxis === "x" ? d.p[0] : d.p[1]) : d.k
    const kd = kdAxis === "x" ? d.p[0] : kdAxis === "y" ? d.p[1] : undefined
    const other = kdAxis === "y" ? d.p[0] : d.p[1]
    const detail =
      kd !== undefined
        ? `${formatNumber(other)} · KD ${formatNumber(kd)}`
        : `${formatNumber(d.p[0])}, ${formatNumber(d.p[1])}`
    const tip = `${String.fromCharCode(65 + n)} ${d.name}: ${spec.x_label ?? "x"} ${formatNumber(d.p[0])}, ${spec.y_label ?? "y"} ${formatNumber(d.p[1])}`
    return [
      { ...seg(String.fromCharCode(65 + n) + " ", role, true), tip },
      { ...seg(`${cut(d.name!, 24)} `, "text"), tip },
      seg(`${detail}   `, "muted"),
    ]
  })
  const keyWidth = Math.max(0, ...keyItems.map(width))
  const perRow = Math.max(1, Math.floor(cols / Math.max(1, keyWidth)))
  const key: Line[] = []
  for (let i = 0; i < keyItems.length; i += perRow)
    key.push(
      keyItems.slice(i, i + perRow).flatMap((item) => [...item, seg(" ".repeat(keyWidth - width(item)), "none")]),
    )
  return [
    ...lines,
    ...yName,
    ...tiers,
    ...(key.length ? [[], ...key.map((l) => trimLine(l, cols))] : []),
    ...(kdAxis ? [] : legend(series, cols)),
    ...footer(spec, cols),
  ]
}

function renderHeatmap(spec: Spec, cols: number): Line[] {
  const rows = spec.rows ?? []
  const colsLabels = spec.cols ?? []
  const values = spec.values ?? []
  const nums = values.flat().filter(num) as number[]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const labelWidth = Math.min(Math.max(...rows.map((r) => [...r].length), 2), 12)
  const cell = Math.max(3, Math.min(6, Math.floor((cols - labelWidth - 1) / Math.max(1, colsLabels.length))))
  const level = (v: number) => {
    const t = max === min ? 0.5 : (v - min) / (max - min)
    const good = spec.lower_is_better ? 1 - t : t
    return `heat${Math.min(4, Math.floor(good * 5))}` as Role
  }
  const out: Line[] = [...header(spec, cols)]
  out.push([
    seg(pad("", labelWidth + 1), "none"),
    ...colsLabels.map((c) => seg(pad(cut(c, cell - 1), cell, true), "muted")),
  ])
  rows.forEach((r, i) => {
    out.push([
      seg(pad(cut(r, labelWidth), labelWidth) + " ", "muted"),
      ...colsLabels.map((_, j) => {
        const v = values[i]?.[j]
        return num(v) ? seg(pad(formatNumber(v), cell, true), level(v), true) : seg(pad("·", cell, true), "muted")
      }),
    ])
  })
  out.push([])
  const scale: Line = [seg(spec.lower_is_better ? "best " : "low ", "muted")]
  ;(["heat4", "heat3", "heat2", "heat1", "heat0"] as const)
    .slice()
    .reverse()
    .forEach((h) => scale.push(seg("██", spec.lower_is_better ? (`heat${4 - Number(h.slice(4))}` as Role) : h)))
  scale.push(seg(spec.lower_is_better ? " worst" : " high", "muted"), seg("   · no value", "muted"))
  out.push(scale)
  return [...out, ...footer(spec, cols)]
}

function renderSparkline(spec: Spec, cols: number): Line[] {
  const series = spec.series ?? []
  const nameWidth = Math.min(Math.max(...series.map((s) => [...s.name].length)), Math.floor(cols * 0.4))
  const out: Line[] = [...header(spec, cols)]
  series.forEach((s, k) => {
    const nums = s.values.filter(num) as number[]
    const last = nums[nums.length - 1]
    out.push([
      seg(pad(cut(s.name, nameWidth), nameWidth) + "  ", "text"),
      seg(
        sparkline(s.values as (number | null)[], s.lower_is_better === true),
        trendRole(s.values as (number | null)[], s.lower_is_better === true),
      ),
      seg(`  ${formatNumber(last, spec.unit)}`, "muted"),
    ])
  })
  return [...out, ...footer(spec, cols)]
}

// ---------------------------------------------------------------------------------------------
// Distribution, overlap and gauge

/**
 * Rank bucket colors from best to worst: the first bucket is the best ranks. Seven grades (grade6 best, grade0
 * worst) so up to seven buckets each get their own color.
 */
export function bucketRole(i: number, n: number): Role {
  if (n <= 1) return "grade6"
  return `grade${6 - Math.round((i / (n - 1)) * 6)}` as Role
}

function renderDistribution(spec: Spec, cols: number): Line[] {
  const x = spec.x ?? []
  const series = spec.series ?? []
  const labelWidth = Math.min(Math.max(...series.map((s) => [...s.name].length), 4), Math.floor(cols * 0.3))
  const totals = series.map((s) => s.values.reduce<number>((a, v) => a + (num(v) ? v : 0), 0))
  const tail = totals.map((t) => ` ${formatNumber(t)}`)
  const tailWidth = Math.max(...tail.map((t) => t.length))
  const cells = Math.max(10, cols - labelWidth - 2 - tailWidth)
  const out: Line[] = [...header(spec, cols)]
  series.forEach((s, k) => {
    // Largest remainder, so each row fills the width exactly and every non-zero bucket shows.
    const values = s.values.map((v) => (num(v) && v > 0 ? v : 0))
    const total = totals[k] || 1
    const alloc = values.map((v) => (v > 0 ? Math.max(1, Math.floor((v / total) * cells)) : 0))
    let left = cells - alloc.reduce((a, b) => a + b, 0)
    const order = values
      .map((v, i) => [(v / total) * cells - Math.floor((v / total) * cells), i] as const)
      .sort((a, b) => b[0] - a[0])
    for (let j = 0; left > 0 && j < order.length * 2; j++) {
      const i = order[j % order.length][1]
      if (values[i] > 0) {
        alloc[i]++
        left--
      }
    }
    while (left < 0) {
      const i = alloc.indexOf(Math.max(...alloc))
      alloc[i]--
      left++
    }
    out.push([
      seg(pad(cut(s.name, labelWidth), labelWidth) + " │", "text"),
      ...alloc.map((n, i) => ({
        ...seg("█".repeat(n), bucketRole(i, x.length)),
        tip: `${s.name}, ${x[i]}: ${formatNumber(values[i])} (${percentText(values[i], total)})`,
      })),
      seg(tail[k], "muted"),
    ])
  })
  out.push([])
  // The key doubles as the counts: one entry per bucket with each row's count.
  const items: Line[] = x.map((label, i) => [
    seg("■ ", bucketRole(i, x.length)),
    seg(
      `${label} ${series.map((s) => formatNumber(num(s.values[i]) ? (s.values[i] as number) : 0)).join(" / ")}   `,
      "muted",
    ),
  ])
  out.push(...wrap(items, cols))
  if (series.length > 1) out.push([seg(cut(`counts: ${series.map((s) => s.name).join(" / ")}`, cols), "muted")])
  return [...out, ...footer(spec, cols)]
}

const splitRegion = (region: string) =>
  region
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
const sameRegion = (region: string, names: readonly string[]) => {
  const parts = splitRegion(region)
  return parts.length === names.length && names.every((n) => parts.includes(n))
}
function combos(sets: readonly string[]): string[][] {
  const out: string[][] = []
  for (let mask = 1; mask < 1 << sets.length; mask++) out.push(sets.filter((_, i) => mask & (1 << i)))
  return out
}
/** The set names of an overlap spec, in the order they first appear. */
export function overlapSets(spec: Spec): string[] {
  const names: string[] = []
  ;(spec.x ?? []).forEach((r) => splitRegion(r).forEach((n) => names.includes(n) || names.push(n)))
  return names
}

/**
 * Exclusive region counts from the inclusive ones the API gives (each set's total, each pair's shared count, and
 * for three sets the count shared by all three). Keys are the sets in the region, joined with " + ".
 */
export function overlapRegions(spec: Spec): { sets: string[]; regions: { sets: string[]; count: number }[] } {
  const sets = overlapSets(spec)
  const x = spec.x ?? []
  const values = spec.series?.[0]?.values ?? []
  const given = (names: string[]) => {
    const i = x.findIndex((r) => sameRegion(r, names))
    return i >= 0 && num(values[i]) ? (values[i] as number) : 0
  }
  // Inclusion and exclusion: a region's exclusive count is its inclusive count minus every larger region's.
  const all = combos(sets).sort((a, b) => b.length - a.length)
  const exclusive = new Map<string, number>()
  all.forEach((names) => {
    const larger = all.filter((other) => other.length > names.length && names.every((n) => other.includes(n)))
    exclusive.set(
      names.join(" + "),
      Math.max(0, given(names) - larger.reduce((a, o) => a + exclusive.get(o.join(" + "))!, 0)),
    )
  })
  // Listed as each set alone, then the pairs, then all three, in the order the sets were given.
  const listed = combos(sets).sort((a, b) => a.length - b.length)
  return { sets, regions: listed.map((names) => ({ sets: names, count: exclusive.get(names.join(" + "))! })) }
}

function renderOverlap(spec: Spec, cols: number): Line[] {
  const { sets, regions } = overlapRegions(spec)
  const label = (names: string[]) =>
    names.length === 1
      ? `only ${names[0]}`
      : names.length === sets.length && sets.length > 2
        ? "all three"
        : names.join(" and ")
  const rows = regions.map((r) => ({ ...r, label: label(r.sets) }))
  const labelWidth = Math.min(Math.max(...rows.map((r) => [...r.label].length)), Math.floor(cols * 0.45))
  const valueWidth = Math.max(...rows.map((r) => formatNumber(r.count).length))
  const cells = Math.max(6, cols - labelWidth - valueWidth - 4)
  const max = Math.max(1, ...rows.map((r) => r.count))
  const out: Line[] = [...header(spec, cols)]
  rows.forEach((r) => {
    // One set colors its own region; shared regions use the muted ink.
    const role: Role = r.sets.length === 1 ? sets.indexOf(r.sets[0]) : "good"
    out.push([
      seg(pad(cut(r.label, labelWidth), labelWidth) + " │", "text"),
      { ...seg(bar(r.count, max, cells), role), tip: `${r.label}: ${formatNumber(r.count)} keywords` },
      seg(" " + formatNumber(r.count), "muted"),
    ])
  })
  out.push([])
  const given = (names: string[]) => {
    const i = (spec.x ?? []).findIndex((x) => sameRegion(x, names))
    const v = spec.series?.[0]?.values[i]
    return num(v) ? v : 0
  }
  sets.forEach((name, i) => {
    const total = given([name])
    const own = regions.find((r) => r.sets.length === 1 && r.sets[0] === name)?.count ?? 0
    out.push([
      seg("■ ", i),
      seg(
        cut(
          `${name}: ${formatNumber(total)} keywords, ${formatNumber(total - own)} shared (${percentText(total - own, total)})`,
          cols - 2,
        ),
        "muted",
      ),
    ])
  })
  return [...out, ...footer(spec, cols)]
}

/** A gauge score from 0 to 100; scores given from 0 to 1 (as Lighthouse reports them) are scaled up. */
export function gaugeScores(spec: Spec): number[] {
  const raw = (spec.series ?? []).map((s) => (num(s.values[0]) ? (s.values[0] as number) : 0))
  const fraction = raw.every((v) => v <= 1) && raw.some((v) => v > 0 && v < 1)
  return raw.map((v) => (fraction ? Math.round(v * 100) : v))
}
export const gaugeRole = (score: number): Role => (score >= 90 ? "good" : score >= 50 ? "heat2" : "bad")

function renderGauge(spec: Spec, cols: number): Line[] {
  const series = spec.series ?? []
  const scores = gaugeScores(spec)
  const labelWidth = Math.min(Math.max(...series.map((s) => [...s.name].length), 4), Math.floor(cols * 0.35))
  const cells = Math.max(10, Math.min(40, cols - labelWidth - 12))
  const out: Line[] = [...header(spec, cols)]
  series.forEach((s, i) => {
    const filled = Math.round((scores[i] / 100) * cells)
    out.push([
      seg(pad(cut(s.name, labelWidth), labelWidth) + " ", "text"),
      { ...seg("█".repeat(filled), gaugeRole(scores[i])), tip: `${s.name}: ${scores[i]} of 100` },
      seg("░".repeat(cells - filled), "axis"),
      seg(pad(String(Math.round(scores[i])), 5, true), gaugeRole(scores[i]), true),
      seg(" /100", "muted"),
    ])
  })
  out.push([])
  out.push([
    seg("■ ", "good"),
    seg("90 to 100   ", "muted"),
    seg("■ ", "heat2"),
    seg("50 to 89   ", "muted"),
    seg("■ ", "bad"),
    seg("0 to 49", "muted"),
  ])
  return [...out, ...footer(spec, cols)]
}

/** Draw a validated spec at the given width. Throws if the spec is invalid. */
export function render(spec: Spec, cols = 100): Line[] {
  const errors = validate(spec)
  if (errors.length) throw new Error(errors.join(" "))
  const w = Math.max(30, cols)
  switch (spec.type) {
    case "table":
      return renderTable(spec, w)
    case "kpi":
      return renderKpi(spec, w)
    case "hbar":
      return renderHbar(spec, w, false)
    case "grouped-bar":
      return renderHbar(spec, w, true)
    case "share-bar":
      return renderShare(spec, w)
    case "diverging-bar":
      return renderDiverging(spec, w)
    case "line":
      return renderLine(spec, w)
    case "sparkline":
      return renderSparkline(spec, w)
    case "scatter":
      return renderScatter(spec, w)
    case "heatmap":
      return renderHeatmap(spec, w)
    case "geogrid":
      return renderGeogrid(spec, w)
    case "tilemap":
      return renderTilemap(spec, w)
    case "distribution":
      return renderDistribution(spec, w)
    case "overlap":
      return renderOverlap(spec, w)
    case "gauge":
      return renderGauge(spec, w)
    case "donut":
      // A terminal has no round shapes: the share bar shows the same parts of a whole.
      return renderShare({ ...spec, type: "share-bar" }, w)
  }
}

export function toText(lines: readonly Line[]): string {
  return lines
    .map((line) =>
      line
        .map((s) => s.text)
        .join("")
        .replace(/\s+$/, ""),
    )
    .join("\n")
}

/** The same data as a table, for the TUI's chart/table toggle. */
export function asTable(spec: Spec): Spec | undefined {
  if (spec.type === "table") return undefined
  if (spec.type === "geogrid") {
    const grid = spec.values ?? []
    return {
      type: "table",
      title: spec.title,
      x: grid.map((_, i) => `row ${i + 1}`),
      series: (grid[0] ?? []).map((_, j) => ({ name: `col ${j + 1}`, values: grid.map((row) => row[j] ?? null) })),
      source: spec.source,
    }
  }
  if (spec.type === "heatmap") {
    return {
      type: "table",
      title: spec.title,
      x: spec.rows,
      series: (spec.cols ?? []).map((c, j) => ({ name: c, values: (spec.values ?? []).map((row) => row[j] ?? null) })),
      source: spec.source,
    }
  }
  if (spec.type === "scatter") {
    const rows = (spec.series ?? []).flatMap((s) =>
      (s.values as readonly [number, number][]).map((p) => ({ s: s.name, p })),
    )
    return {
      type: "table",
      title: spec.title,
      x: rows.map((r) => r.s),
      series: [
        { name: spec.x_label ?? "x", values: rows.map((r) => r.p[0]) },
        { name: spec.y_label ?? "y", values: rows.map((r) => r.p[1]) },
      ],
      source: spec.source,
    }
  }
  if (spec.type === "distribution") {
    return {
      type: "table",
      title: spec.title,
      x: (spec.series ?? []).map((s) => s.name),
      series: (spec.x ?? []).map((bucket, i) => ({
        name: bucket,
        values: (spec.series ?? []).map((s) => s.values[i] ?? null),
      })),
      source: spec.source,
    }
  }
  if (spec.type === "overlap") {
    const { regions } = overlapRegions(spec)
    return {
      type: "table",
      title: spec.title,
      x: regions.map((r) => (r.sets.length === 1 ? `only ${r.sets[0]}` : r.sets.join(" and "))),
      series: [{ name: "Keywords", values: regions.map((r) => r.count) }],
      source: spec.source,
    }
  }
  if (spec.type === "gauge") {
    return {
      type: "table",
      title: spec.title,
      x: (spec.series ?? []).map((s) => s.name),
      series: [{ name: "Score", values: gaugeScores(spec) }],
      source: spec.source,
    }
  }
  if (spec.type === "kpi" || spec.type === "sparkline") {
    return {
      type: "table",
      title: spec.title,
      x: (spec.series ?? []).map((s) => s.name),
      series:
        spec.type === "kpi"
          ? [
              { name: "current", values: (spec.series ?? []).map((s) => s.values[0] ?? null) },
              { name: "previous", values: (spec.series ?? []).map((s) => s.values[1] ?? null) },
            ]
          : [
              {
                name: "last",
                values: (spec.series ?? []).map((s) => (s.values.filter(num) as number[]).at(-1) ?? null),
              },
            ],
      unit: spec.unit,
      source: spec.source,
    }
  }
  return {
    type: "table",
    title: spec.title,
    x: spec.x,
    series: spec.series,
    unit: spec.unit,
    sort: spec.sort,
    limit: spec.limit,
    source: spec.source,
  }
}

// ---------------------------------------------------------------------------------------------
// Interaction helpers

/** The value a table cell sorts by: numbers as is, sparklines by their last number, text by itself. */
function sortKey(v: unknown): number | string | undefined {
  if (num(v)) return v
  if (Array.isArray(v)) return (v.filter(num) as number[]).at(-1)
  if (v === null || v === undefined || v === "") return undefined
  return String(v)
}

/**
 * Reorder the rows a table shows by one column (0 is the label column, 1 and up are series).
 * The agent's own sort and limit are applied first, so the same rows stay on screen.
 * Empty cells always go last.
 */
export function sortTable(spec: Spec, column: number, dir: "asc" | "desc"): Spec {
  const { x, series } = ordered(spec)
  const keys = column === 0 ? x : (series[column - 1]?.values ?? [])
  const idx = x.map((_, i) => i)
  idx.sort((a, b) => {
    const ka = sortKey(keys[a])
    const kb = sortKey(keys[b])
    if (ka === undefined || kb === undefined) return ka === kb ? a - b : ka === undefined ? 1 : -1
    const cmp = typeof ka === "number" && typeof kb === "number" ? ka - kb : String(ka).localeCompare(String(kb))
    return (dir === "asc" ? cmp : -cmp) || a - b
  })
  return {
    ...spec,
    x: idx.map((i) => x[i]),
    series: series.map((s, j) => ({ ...spec.series![j], values: idx.map((i) => s.values[i]) })),
    sort: "none",
    limit: undefined,
  }
}

/** The data behind any chart as CSV (RFC 4180 quoting). Sparkline cells list their numbers separated by spaces. */
export function toCsv(spec: Spec): string {
  const table = spec.type === "table" ? spec : asTable(spec)
  if (!table) return ""
  const quote = (v: unknown) => {
    const text = Array.isArray(v) ? v.filter(num).join(" ") : v === null || v === undefined ? "" : String(v)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const series = table.series ?? []
  const rows = [[table.x_label ?? "label", ...series.map((s) => s.name)].map(quote).join(",")]
  ;(table.x ?? []).forEach((label, r) => rows.push([label, ...series.map((s) => s.values[r])].map(quote).join(",")))
  return rows.join("\n") + "\n"
}

// ---------------------------------------------------------------------------------------------
// Maps

/** Rank bands for local grids: 1 to 3, 4 to 10, 11 to 20, worse or not found. */
function rankRole(v: number | null | undefined): Role {
  if (!num(v)) return "heat0"
  if (v <= 3) return "heat4"
  if (v <= 10) return "heat3"
  if (v <= 20) return "heat1"
  return "heat0"
}

function renderGeogrid(spec: Spec, cols: number): Line[] {
  const grid = spec.values ?? []
  const nRows = grid.length
  const nCols = grid[0]?.length ?? 0
  const center = spec.center && spec.center.length === 2 ? spec.center : [Math.floor(nRows / 2), Math.floor(nCols / 2)]
  const tileW = Math.max(4, Math.min(7, Math.floor((cols - 2) / Math.max(1, nCols)) - 1))
  const tall = tileW >= 6
  const out: Line[] = [...header(spec, cols)]
  const pin = (r: number, c: number) => r === center[0] && c === center[1]
  const label = (v: number | null) => (num(v) ? String(v) : "x")
  const tip = (r: number, c: number, v: number | null) =>
    `${pin(r, c) ? "Business location. " : ""}Row ${r + 1}, column ${c + 1}: ${num(v) ? `rank ${v}` : "not found in the top 20"}`
  out.push([seg("  N", "muted")])
  grid.forEach((row, r) => {
    const tiles = (mid: boolean): Line => [
      seg(" ", "none"),
      ...row.flatMap((v, c) => {
        const text = mid ? (pin(r, c) ? `◉${label(v)}` : label(v)) : ""
        const role = rankRole(v)
        const tile: Segment = { text: center_(text, tileW), role: "tile", bold: true, bg: role, tip: tip(r, c, v) }
        return [tile, seg(" ", "none")]
      }),
    ]
    if (tall) out.push(tiles(false).map((sg) => ({ ...sg, text: sg.bg ? " ".repeat(tileW) : sg.text })))
    out.push(tiles(true))
    if (tall) out.push([])
  })
  // Summary: average rank where found, share of tiles in the top 3 (share of local voice), coverage.
  const all = grid.flat()
  const found = all.filter(num) as number[]
  const top3 = found.filter((v) => v <= 3).length
  const avg = found.length ? found.reduce((a, b) => a + b, 0) / found.length : undefined
  out.push([])
  out.push(
    ...wrap(
      [
        [seg("■ 1 to 3  ", "heat4")],
        [seg("■ 4 to 10  ", "heat3")],
        [seg("■ 11 to 20  ", "heat1")],
        [seg("■ 20+ or not found", "heat0")],
      ],
      cols,
    ),
  )
  out.push(
    ...wrap(
      [
        [
          seg(
            `top 3 in ${top3} of ${all.length} tiles (${Math.round((top3 / Math.max(1, all.length)) * 100)}%)   `,
            top3 / Math.max(1, all.length) >= 0.5 ? "good" : "bad",
            true,
          ),
        ],
        [seg(`found in ${found.length} of ${all.length}   `, "muted")],
        [seg(avg === undefined ? "not found anywhere" : `average rank ${avg.toFixed(1)}   `, "muted")],
        [seg("◉ business", "muted")],
      ],
      cols,
    ),
  )
  return [...out, ...footer(spec, cols)]
}

function center_(text: string, w: number) {
  const len = [...text].length
  if (len >= w) return [...text].slice(0, w).join("")
  const left = Math.floor((w - len) / 2)
  return " ".repeat(left) + text + " ".repeat(w - len - left)
}

// US tile grid map: every state is one tile at a fixed position, so states are equal size and all readable.
const US_TILES: Record<string, [number, number]> = {
  AK: [0, 0],
  ME: [0, 10],
  VT: [1, 9],
  NH: [1, 10],
  WA: [2, 0],
  ID: [2, 1],
  MT: [2, 2],
  ND: [2, 3],
  MN: [2, 4],
  IL: [2, 5],
  WI: [2, 6],
  MI: [2, 7],
  NY: [2, 8],
  RI: [2, 9],
  MA: [2, 10],
  OR: [3, 0],
  NV: [3, 1],
  WY: [3, 2],
  SD: [3, 3],
  IA: [3, 4],
  IN: [3, 5],
  OH: [3, 6],
  PA: [3, 7],
  NJ: [3, 8],
  CT: [3, 9],
  CA: [4, 0],
  UT: [4, 1],
  CO: [4, 2],
  NE: [4, 3],
  MO: [4, 4],
  KY: [4, 5],
  WV: [4, 6],
  VA: [4, 7],
  MD: [4, 8],
  DE: [4, 9],
  AZ: [5, 1],
  NM: [5, 2],
  KS: [5, 3],
  AR: [5, 4],
  TN: [5, 5],
  NC: [5, 6],
  SC: [5, 7],
  DC: [5, 8],
  OK: [6, 3],
  LA: [6, 4],
  MS: [6, 5],
  AL: [6, 6],
  GA: [6, 7],
  HI: [7, 0],
  TX: [7, 3],
  FL: [7, 8],
}
const US_NAMES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
}

export function stateCode(name: string): string | undefined {
  const t = name.trim()
  const clean = t.replace(/,?\s*(united states|usa|us)$/i, "").trim()
  if (US_TILES[clean.toUpperCase()]) return clean.toUpperCase()
  return US_NAMES[clean.toLowerCase()]
}

function renderTilemap(spec: Spec, cols: number): Line[] {
  const x = spec.x ?? []
  const series = spec.series?.[0]
  const byCode = new Map<string, { value: number | null; name: string }>()
  x.forEach((name, i) => {
    const code = stateCode(name)
    const v = series?.values[i]
    if (code) byCode.set(code, { value: num(v) ? v : null, name })
  })
  const nums = [...byCode.values()].map((e) => e.value).filter(num) as number[]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const level = (v: number | null): Role => {
    if (!num(v)) return "none"
    let t = max === min ? 0.5 : (v - min) / (max - min)
    if (series?.lower_is_better) t = 1 - t
    return `seq${Math.min(4, Math.floor(t * 5))}` as Role
  }
  const tileW = Math.max(2, Math.min(8, Math.floor((cols - 1) / 11) - 1))
  // Narrow terminals: codes only; values stay in the hover tip and the data table.
  const showValues = tileW >= 4
  const out: Line[] = [...header(spec, cols)]
  for (let r = 0; r < 8; r++) {
    const top: Line = []
    const bottom: Line = []
    for (let c = 0; c < 11; c++) {
      const code = Object.keys(US_TILES).find((k) => US_TILES[k][0] === r && US_TILES[k][1] === c)
      if (!code) {
        top.push(seg(" ".repeat(tileW + 1), "none"))
        bottom.push(seg(" ".repeat(tileW + 1), "none"))
        continue
      }
      const entry = byCode.get(code)
      const bg: Role = entry ? level(entry.value) : "none"
      const tip = entry ? `${entry.name}: ${formatNumber(entry.value, spec.unit)}` : `${code}: no data`
      top.push(
        { text: center_(code, tileW), role: entry ? "tile" : "muted", bold: true, bg: entry ? bg : "axis", tip },
        seg(" ", "none"),
      )
      bottom.push(
        {
          text: center_(entry && num(entry.value) ? formatNumber(entry.value) : "", tileW),
          role: "tile",
          bg: entry ? bg : "axis",
          tip,
        },
        seg(" ", "none"),
      )
    }
    out.push(top)
    if (showValues) out.push(bottom)
  }
  out.push([])
  out.push([
    seg(`${formatNumber(series?.lower_is_better ? max : min, spec.unit)} `, "muted"),
    seg("  ", "none", false),
    ...(["seq0", "seq1", "seq2", "seq3", "seq4"] as Role[]).map((r) => ({ text: "   ", role: "none" as Role, bg: r })),
    seg(` ${formatNumber(series?.lower_is_better ? min : max, spec.unit)}`, "muted"),
    seg(series?.name ? `   ${series.name}` : "", "muted"),
  ])
  const missing = x.filter((n) => !stateCode(n))
  if (missing.length) out.push([seg(cut(`Not on the map: ${missing.join(", ")}`, cols), "muted")])
  return [...out, ...footer(spec, cols)]
}
