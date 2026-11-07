// DataForSEO Agent: a self-contained HTML report of chart specs. Each chart is drawn as inline SVG
// with its data table under it, so the file can be shared, opened offline and printed.
import { asTable, formatNumber, ordered, stateCode, validate, type Series, type Spec } from "./chart.js"

const PALETTE = ["#2862A8", "#137A74", "#C9962B", "#6B8E23", "#7E57C2", "#C0504D"]
const GOOD = "#2E8B57"
const BAD = "#C0504D"
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

export function escapeHtml(text: unknown): string {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  )
}

const W = 760
const fmt = (v: number | null | undefined, unit?: string) => escapeHtml(formatNumber(v, unit))
const svg = (h: number, body: string) =>
  `<svg viewBox="0 0 ${W} ${h}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
const text = (x: number, y: number, t: string, attrs = "") =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${attrs}>${escapeHtml(t)}</text>`
const legend = (series: readonly Series[]) =>
  `<div class="legend">${series
    .map((s, i) => `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${escapeHtml(s.name)}</span>`)
    .join("")}</div>`

function cut(t: string, n: number) {
  return t.length > n ? t.slice(0, n - 1) + "…" : t
}

function bars(spec: Spec, grouped: boolean) {
  const { x, series } = ordered(spec)
  const shown = grouped ? series : series.slice(0, 1)
  const values = shown.flatMap((s) => s.values.filter(num) as number[])
  const positive = values.filter((v) => v > 0)
  const logScale =
    spec.log === true ||
    ((spec.log === undefined || spec.log === "auto") && positive.length > 1 && Math.max(...positive) / Math.min(...positive) >= 1000)
  const floor = positive.length ? Math.min(...positive) : 1
  const scaled = (v: number) => (logScale ? (v > 0 ? Math.log10(v) - Math.log10(floor) + 0.3 : 0) : Math.max(0, v))
  const max = Math.max(0, ...values.map(scaled)) || 1
  const label = 190
  const barH = grouped ? 12 : 18
  const rowH = barH * shown.length + 10
  const plot = W - label - 90
  let body = ""
  x.forEach((name, r) => {
    const y0 = r * rowH + 6
    body += text(label - 8, y0 + (barH * shown.length) / 2 + 4, cut(name, 30), `text-anchor="end" class="lbl"`)
    shown.forEach((s, j) => {
      const v = s.values[r]
      if (!num(v)) return
      const w = Math.max(1, (scaled(v) / max) * plot)
      const y = y0 + j * barH
      body += `<rect x="${label}" y="${y}" width="${w.toFixed(1)}" height="${barH - 2}" rx="2" fill="${PALETTE[j % PALETTE.length]}"/>`
      body += text(label + w + 6, y + barH - 5, formatNumber(v, spec.unit), `class="val"`)
    })
  })
  const note = logScale ? `<div class="axisnote">Log scale: values span more than 1000x.</div>` : ""
  return svg(x.length * rowH + 8, body) + note + (grouped ? legend(shown) : "")
}

function shareBar(spec: Spec) {
  const { x, series } = ordered({ ...spec, sort: spec.sort ?? "desc" })
  const values = (series[0]?.values ?? []).map((v) => (num(v) ? Math.max(0, v) : 0))
  const total = values.reduce((a, b) => a + b, 0) || 1
  let at = 0
  let body = ""
  values.forEach((v, i) => {
    const w = (v / total) * W
    body += `<rect x="${at.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="34" fill="${PALETTE[i % PALETTE.length]}"/>`
    at += w
  })
  const items = x
    .map(
      (name, i) =>
        `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${escapeHtml(name)} <b>${((values[i] / total) * 100).toFixed(1)}%</b> (${fmt(values[i], spec.unit)})</span>`,
    )
    .join("")
  return svg(34, body) + `<div class="legend">${items}</div>`
}

function diverging(spec: Spec) {
  const x = spec.x ?? []
  const [up, down] = spec.series ?? []
  const ups = (up?.values ?? []).map((v) => (num(v) ? Math.abs(v) : 0))
  const downs = (down?.values ?? []).map((v) => (num(v) ? Math.abs(v) : 0))
  const max = Math.max(1, ...ups, ...downs)
  const H = 260
  const mid = H / 2
  const step = (W - 110) / Math.max(1, x.length)
  const bw = Math.max(2, step * 0.7)
  let body = `<line x1="100" x2="${W}" y1="${mid}" y2="${mid}" class="axis"/>`
  body += text(94, 14, formatNumber(max, spec.unit), `text-anchor="end" class="val"`)
  body += text(94, H - 4, "-" + formatNumber(max, spec.unit), `text-anchor="end" class="val"`)
  x.forEach((label, i) => {
    const cx = 105 + i * step
    const hu = (ups[i] / max) * (mid - 8)
    const hd = (downs[i] / max) * (mid - 8)
    body += `<rect x="${cx.toFixed(1)}" y="${(mid - hu).toFixed(1)}" width="${bw.toFixed(1)}" height="${hu.toFixed(1)}" fill="${GOOD}"><title>${escapeHtml(label)}: +${ups[i]}</title></rect>`
    body += `<rect x="${cx.toFixed(1)}" y="${mid}" width="${bw.toFixed(1)}" height="${hd.toFixed(1)}" fill="${BAD}"><title>${escapeHtml(label)}: -${downs[i]}</title></rect>`
  })
  const sum = (a: number[]) => a.reduce((p, c) => p + c, 0)
  const ends = x.length ? `<div class="axisnote">${escapeHtml(x[0])} to ${escapeHtml(x[x.length - 1])}</div>` : ""
  return (
    svg(H, body) +
    ends +
    `<div class="legend"><span><i style="background:${GOOD}"></i>${escapeHtml(up?.name ?? "")} <b>${fmt(sum(ups))}</b></span><span><i style="background:${BAD}"></i>${escapeHtml(down?.name ?? "")} <b>${fmt(sum(downs))}</b></span></div>`
  )
}

function line(spec: Spec) {
  const x = spec.x ?? []
  const series = spec.series ?? []
  const raw = series.flatMap((s) => s.values.filter(num) as number[])
  if (raw.length === 0) return ""
  const logScale =
    raw.length > 1 &&
    Math.min(...raw) > 0 &&
    (spec.log === true || ((spec.log === undefined || spec.log === "auto") && Math.max(...raw) / Math.min(...raw) >= 1000))
  const f = (v: number) => (logScale ? Math.log10(v) : v)
  const all = raw.map(f)
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const invert = series.length > 0 && series.every((s) => s.lower_is_better)
  const H = 260
  const left = 100
  const top = 10
  const ph = H - 40
  const pw = W - left - 14
  const px = (i: number) => left + (x.length > 1 ? (i / (x.length - 1)) * pw : pw / 2)
  const py = (value: number) => {
    const v = f(value)
    const t = (v - lo) / (hi - lo)
    return top + (invert ? t : 1 - t) * ph
  }
  let body = `<line x1="${left}" x2="${left}" y1="${top}" y2="${top + ph}" class="axis"/><line x1="${left}" x2="${W - 10}" y1="${top + ph}" y2="${top + ph}" class="axis"/>`
  for (const t of [lo, (lo + hi) / 2, hi]) {
    const v = logScale ? 10 ** t : t
    body += text(left - 6, py(v) + 4, formatNumber(v, spec.unit), `text-anchor="end" class="val"`)
  }
  const ticks = Math.min(x.length, 8)
  for (let k = 0; k < ticks; k++) {
    const i = Math.round((k / Math.max(1, ticks - 1)) * (x.length - 1))
    const anchor = k === 0 ? "start" : k === ticks - 1 ? "end" : "middle"
    body += text(px(i), H - 8, cut(String(x[i]), 12), `text-anchor="${anchor}" class="val"`)
  }
  series.forEach((s, j) => {
    const pts = s.values.map((v, i) => (num(v) ? `${px(i).toFixed(1)},${py(v).toFixed(1)}` : "")).filter(Boolean)
    body += `<polyline fill="none" stroke="${PALETTE[j % PALETTE.length]}" stroke-width="2" points="${pts.join(" ")}"/>`
  })
  const note =
    (invert ? `<div class="axisnote">Axis inverted: lower is better, so up is an improvement.</div>` : "") +
    (logScale ? `<div class="axisnote">Log scale: values span more than 1000x.</div>` : "")
  return svg(H, body) + note + (series.length > 1 ? legend(series) : "")
}

function spark(values: readonly unknown[], color: string, invert = false) {
  const v = values.filter(num) as number[]
  if (v.length < 2) return ""
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pts = v
    .map((n, i) => {
      const t = hi === lo ? 0.5 : (n - lo) / (hi - lo)
      return `${((i / (v.length - 1)) * 96 + 2).toFixed(1)},${(2 + (invert ? t : 1 - t) * 18).toFixed(1)}`
    })
    .join(" ")
  return `<svg viewBox="0 0 100 22" width="100" height="22"><polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts}"/></svg>`
}

function scatter(spec: Spec) {
  const series = spec.series ?? []
  const pts = series.flatMap((s, j) =>
    (s.values as unknown[]).filter((p): p is [number, number] => Array.isArray(p) && num(p[0]) && num(p[1])).map((p) => ({ p, j })),
  )
  if (pts.length === 0) return ""
  const axis = (vals: number[]) => {
    const pos = vals.filter((v) => v > 0)
    const log =
      spec.log === true ||
      ((spec.log === undefined || spec.log === "auto") && pos.length === vals.length && pos.length > 1 && Math.max(...pos) / Math.min(...pos) >= 1000)
    const f = (v: number) => (log ? Math.log10(Math.max(v, 1e-9)) : v)
    const lo = Math.min(...vals.map(f))
    const hi = Math.max(...vals.map(f))
    return { log, scale: (v: number) => (hi === lo ? 0.5 : (f(v) - lo) / (hi - lo)), lo: Math.min(...vals), hi: Math.max(...vals) }
  }
  const ax = axis(pts.map((d) => d.p[0]))
  const ay = axis(pts.map((d) => d.p[1]))
  const H = 300
  const left = 100
  const ph = H - 50
  const pw = W - left - 20
  let body = `<line x1="${left}" x2="${left}" y1="10" y2="${10 + ph}" class="axis"/><line x1="${left}" x2="${W - 20}" y1="${10 + ph}" y2="${10 + ph}" class="axis"/>`
  pts.forEach(({ p, j }) => {
    body += `<circle cx="${(left + ax.scale(p[0]) * pw).toFixed(1)}" cy="${(10 + (1 - ay.scale(p[1])) * ph).toFixed(1)}" r="4" fill="${PALETTE[j % PALETTE.length]}" fill-opacity="0.8"><title>${p[0]}, ${p[1]}</title></circle>`
  })
  body += text(left - 6, 18, formatNumber(ay.hi), `text-anchor="end" class="val"`)
  body += text(left - 6, 10 + ph, formatNumber(ay.lo), `text-anchor="end" class="val"`)
  body += text(left, H - 22, formatNumber(ax.lo), `class="val"`)
  body += text(W - 20, H - 22, formatNumber(ax.hi), `text-anchor="end" class="val"`)
  body += text(left + pw / 2, H - 4, `${spec.x_label ?? "x"}${ax.log ? " (log)" : ""}`, `text-anchor="middle" class="lbl"`)
  body += text(14, 10 + ph / 2, `${spec.y_label ?? "y"}${ay.log ? " (log)" : ""}`, `text-anchor="middle" class="lbl" transform="rotate(-90 14 ${10 + ph / 2})"`)
  return svg(H, body) + (series.length > 1 ? legend(series) : "")
}

function heatmap(spec: Spec) {
  const rows = spec.rows ?? []
  const cols = spec.cols ?? []
  const values = spec.values ?? []
  const all = values.flat().filter(num) as number[]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const color = (v: number | null) => {
    if (!num(v)) return "transparent"
    let t = hi === lo ? 0.5 : (v - lo) / (hi - lo)
    if (spec.lower_is_better) t = 1 - t
    return `color-mix(in srgb, ${GOOD} ${Math.round(t * 100)}%, ${BAD})`
  }
  const head = `<tr><th></th>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`
  const body = rows
    .map(
      (r, i) =>
        `<tr><th>${escapeHtml(r)}</th>${cols.map((_, j) => `<td class="heat" style="background:${color(values[i]?.[j] ?? null)}">${num(values[i]?.[j]) ? fmt(values[i]![j], spec.unit) : ""}</td>`).join("")}</tr>`,
    )
    .join("")
  return `<div class="scroll"><table class="grid">${head}${body}</table></div>`
}

function geogrid(spec: Spec) {
  const grid = spec.values ?? []
  const n = grid[0]?.length ?? 0
  const center = spec.center && spec.center.length === 2 ? spec.center : [Math.floor(grid.length / 2), Math.floor(n / 2)]
  const color = (v: number | null) =>
    !num(v) || v > 20 ? BAD : v <= 3 ? GOOD : v <= 10 ? "#8DB255" : "#E0A030"
  const tiles = grid
    .map((row, r) =>
      row
        .map((v, c) => {
          const pin = r === center[0] && c === center[1]
          return `<div class="tile" style="background:${color(v)}" title="Row ${r + 1}, column ${c + 1}: ${num(v) ? `rank ${v}` : "not found"}">${pin ? "◉" : ""}${num(v) ? v : "x"}</div>`
        })
        .join(""),
    )
    .join("")
  const all = grid.flat()
  const found = all.filter(num) as number[]
  const top3 = found.filter((v) => v <= 3).length
  const avg = found.length ? (found.reduce((a, b) => a + b, 0) / found.length).toFixed(1) : "n/a"
  return `<div class="geo" style="grid-template-columns:repeat(${n},1fr)">${tiles}</div>
<div class="legend"><span><i style="background:${GOOD}"></i>1 to 3</span><span><i style="background:#8DB255"></i>4 to 10</span><span><i style="background:#E0A030"></i>11 to 20</span><span><i style="background:${BAD}"></i>20+ or not found</span></div>
<div class="kpis" style="margin-top:12px"><div class="kpi"><div class="name">Top 3 share</div><div class="big">${Math.round((top3 / Math.max(1, all.length)) * 100)}%</div></div><div class="kpi"><div class="name">Found in</div><div class="big">${found.length} of ${all.length}</div></div><div class="kpi"><div class="name">Average rank</div><div class="big">${avg}</div></div></div>`
}

const US_LAYOUT: Record<string, [number, number]> = {
  AK: [0, 0], ME: [0, 10], VT: [1, 9], NH: [1, 10], WA: [2, 0], ID: [2, 1], MT: [2, 2], ND: [2, 3], MN: [2, 4], IL: [2, 5], WI: [2, 6], MI: [2, 7], NY: [2, 8], RI: [2, 9], MA: [2, 10],
  OR: [3, 0], NV: [3, 1], WY: [3, 2], SD: [3, 3], IA: [3, 4], IN: [3, 5], OH: [3, 6], PA: [3, 7], NJ: [3, 8], CT: [3, 9],
  CA: [4, 0], UT: [4, 1], CO: [4, 2], NE: [4, 3], MO: [4, 4], KY: [4, 5], WV: [4, 6], VA: [4, 7], MD: [4, 8], DE: [4, 9],
  AZ: [5, 1], NM: [5, 2], KS: [5, 3], AR: [5, 4], TN: [5, 5], NC: [5, 6], SC: [5, 7], DC: [5, 8], OK: [6, 3], LA: [6, 4], MS: [6, 5], AL: [6, 6], GA: [6, 7],
  HI: [7, 0], TX: [7, 3], FL: [7, 8],
}

function tilemap(spec: Spec) {
  const s = spec.series?.[0]
  const data = new Map<string, number | null>()
  ;(spec.x ?? []).forEach((name, i) => {
    const code = stateCode(name)
    const v = s?.values[i]
    if (code) data.set(code, num(v) ? v : null)
  })
  const vals = [...data.values()].filter(num) as number[]
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const shade = (v: number | null | undefined) => {
    if (!num(v)) return "var(--line)"
    let t = hi === lo ? 0.5 : (v - lo) / (hi - lo)
    if (s?.lower_is_better) t = 1 - t
    return `color-mix(in srgb, ${PALETTE[0]} ${Math.round(20 + t * 80)}%, var(--card))`
  }
  const tiles = Object.entries(US_LAYOUT)
    .map(([code, [r, c]]) => {
      const v = data.get(code)
      return `<div class="tile" style="grid-row:${r + 1};grid-column:${c + 1};background:${shade(v)}" title="${code}: ${data.has(code) ? fmt(v ?? null, spec.unit) : "no data"}"><b>${code}</b><small>${num(v) ? fmt(v) : ""}</small></div>`
    })
    .join("")
  return `<div class="geo us">${tiles}</div><div class="axisnote">${fmt(s?.lower_is_better ? hi : lo, spec.unit)} light to ${fmt(s?.lower_is_better ? lo : hi, spec.unit)} dark${s?.name ? `, ${escapeHtml(s.name)}` : ""}</div>`
}

function kpi(spec: Spec) {
  return `<div class="kpis">${(spec.series ?? [])
    .map((s) => {
      const cur = s.values[0] as number
      const prev = num(s.values[1]) ? (s.values[1] as number) : undefined
      const delta = prev !== undefined && prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : undefined
      const good = delta === undefined ? undefined : delta >= 0 !== (s.lower_is_better === true)
      const d =
        delta === undefined
          ? ""
          : `<div class="delta" style="color:${good ? GOOD : BAD}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}%</div>`
      return `<div class="kpi"><div class="name">${escapeHtml(s.name)}</div><div class="big">${fmt(cur, spec.unit)}</div>${d}</div>`
    })
    .join("")}</div>`
}

/** The data behind a chart as an HTML table; sparkline cells are drawn inline. */
function dataTable(spec: Spec) {
  const table = spec.type === "table" ? spec : asTable(spec)
  if (!table) return ""
  const { x, series } = ordered(table)
  const head = `<tr><th></th>${series.map((s) => `<th>${escapeHtml(s.name)}</th>`).join("")}</tr>`
  const rows = x
    .map(
      (label, r) =>
        `<tr><th>${escapeHtml(label)}</th>${series
          .map((s, j) => {
            const v = s.values[r]
            if (Array.isArray(v)) return `<td>${spark(v, PALETTE[j % PALETTE.length], s.lower_is_better)}</td>`
            return `<td class="${num(v) ? "num" : ""}">${num(v) ? fmt(v, table.unit) : escapeHtml(v ?? "")}</td>`
          })
          .join("")}</tr>`,
    )
    .join("")
  return `<div class="scroll"><table class="data">${head}${rows}</table></div>`
}

/** One chart as an HTML figure: title, graphic, data table, source. */
export function figure(spec: Spec): string {
  const errors = validate(spec)
  if (errors.length) return `<figure><figcaption>${escapeHtml(spec.title ?? "Chart")}</figcaption><p class="err">${escapeHtml(errors.join(" "))}</p></figure>`
  const graphic =
    spec.type === "hbar"
      ? bars(spec, false)
      : spec.type === "grouped-bar"
        ? bars(spec, true)
        : spec.type === "share-bar"
          ? shareBar(spec)
          : spec.type === "diverging-bar"
            ? diverging(spec)
            : spec.type === "line"
              ? line(spec)
              : spec.type === "scatter"
                ? scatter(spec)
                : spec.type === "heatmap"
                  ? heatmap(spec)
                  : spec.type === "geogrid"
                    ? geogrid(spec)
                    : spec.type === "tilemap"
                      ? tilemap(spec)
                  : spec.type === "kpi"
                    ? kpi(spec)
                    : ""
  if (spec.type === "sparkline") {
    const series = spec.series ?? []
    spec = {
      ...spec,
      type: "table",
      x: series.map((s) => s.name),
      series: [
        { name: "trend", values: series.map((s) => s.values) as never, lower_is_better: series.every((s) => s.lower_is_better) },
        { name: "last", values: series.map((s) => (s.values.filter(num) as number[]).at(-1) ?? null) },
      ],
    }
  }
  const isTable = spec.type === "table"
  const data = isTable ? dataTable(spec) : `<details><summary>Data</summary>${dataTable(spec)}</details>`
  return `<figure>
<figcaption>${escapeHtml(spec.title ?? "Chart")}${spec.subtitle ? `<span>${escapeHtml(spec.subtitle)}</span>` : ""}</figcaption>
${graphic}
${data}
${spec.source ? `<p class="source">Source: ${escapeHtml(spec.source)}</p>` : ""}
</figure>`
}

// The three bar bots from Daniel's GitHub profile, as pixel art that hops in turn (CSS only).
const BOTS = [
  { rows: [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "f...f"], pal: { c: "#F44336", s: "#ffffff", e: "#1a1c2c", f: "#922820" } },
  { rows: [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "f...f"], pal: { c: "#FFC107", s: "#ffffff", e: "#1a1c2c", f: "#997404" } },
  { rows: [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "f...f"], pal: { c: "#7ED957", s: "#ffffff", e: "#1a1c2c", f: "#4C8234" } },
]

function crew() {
  const px = 4
  const height = 13 * px
  const bots = BOTS.map((bot, i) => {
    const top = height - bot.rows.length * px
    const rects = bot.rows
      .flatMap((row, r) =>
        [...row].map((key, c) =>
          key === "." ? "" : `<rect x="${c * px}" y="${top + r * px}" width="${px}" height="${px}" fill="${bot.pal[key as keyof typeof bot.pal]}"/>`,
        ),
      )
      .join("")
    return `<g transform="translate(${i * 8 * px} 0)"><g class="hop" style="animation-delay:${(i * 0.35).toFixed(2)}s">${rects}</g></g>`
  })
  return `<svg class="crew" viewBox="0 -12 ${3 * 8 * px} ${height + 12}" width="${3 * 8 * px}" height="${height + 12}" role="img" aria-label="The DataForSEO Agent crew: three pixel bots">${bots.join("")}</svg>`
}

/** A full, self-contained HTML document with every chart in order. */
export function report(specs: readonly Spec[], meta: { title?: string; created?: Date; note?: string } = {}): string {
  const title = meta.title ?? "DataForSEO report"
  // Local time with its zone, as the reader saw it.
  const created = (meta.created ?? new Date()).toLocaleString("en-GB", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  })
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root{--bg:#ffffff;--fg:#14213d;--muted:#5b6475;--line:#d9dee7;--card:#f6f8fb}
@media (prefers-color-scheme:dark){:root{--bg:#0d1526;--fg:#e8ecf3;--muted:#9aa4b5;--line:#2a3550;--card:#131d33}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 64px}
header h1{margin:0 0 4px;font-size:26px}header p{margin:0;color:var(--muted)}
.brand{display:inline-block;width:10px;height:22px;margin-right:4px;vertical-align:-3px;border-radius:2px}
figure{margin:28px 0;padding:18px;background:var(--card);border:1px solid var(--line);border-radius:10px}
figcaption{font-weight:600;font-size:17px;margin-bottom:10px}figcaption span{display:block;font-weight:400;font-size:14px;color:var(--muted)}
svg text{fill:var(--fg);font-size:12px}svg .val{fill:var(--muted);font-size:11px}svg .axis{stroke:var(--line)}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-size:13px}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.axisnote,.source{color:var(--muted);font-size:12px;margin:6px 0 0}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:13px}th,td{padding:5px 8px;border-bottom:1px solid var(--line);text-align:left}
td.num{text-align:right;font-variant-numeric:tabular-nums}table.grid td.heat{text-align:center;color:#fff}
.scroll{overflow-x:auto}table.data td{max-width:320px;overflow-wrap:anywhere}table.data td.num{white-space:nowrap;overflow-wrap:normal}figure{min-width:0}
.geo{display:grid;gap:4px;margin:8px 0;max-width:560px}.geo.us{max-width:none}.geo .tile{aspect-ratio:1;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px}
.geo.us{grid-template-columns:repeat(11,1fr)}.geo.us .tile{color:var(--fg);font-size:12px}.geo.us small{font-weight:400;font-size:11px}
.crew{display:block;margin-bottom:10px;shape-rendering:crispEdges}.crew .hop{animation:hop 3.2s ease-in-out infinite}
@keyframes hop{0%,20%,100%{transform:translateY(0)}10%{transform:translateY(-10px)}}
@media (prefers-reduced-motion:reduce){.crew .hop{animation:none}}
details summary{cursor:pointer;color:var(--muted);margin-top:10px}
.kpis{display:flex;flex-wrap:wrap;gap:12px}.kpi{flex:1 1 150px;padding:12px;border:1px solid var(--line);border-radius:8px}
.kpi .name{color:var(--muted);font-size:13px}.kpi .big{font-size:24px;font-weight:700}.err{color:${BAD}}
footer{color:var(--muted);font-size:12px;margin-top:40px}
@media print{figure{break-inside:avoid}details{display:block}details>*{display:block}}
</style></head><body><main>
<header>${crew()}<h1>${escapeHtml(title)}</h1>
<p>${specs.length} chart${specs.length === 1 ? "" : "s"} · created ${escapeHtml(created)}${meta.note ? ` · ${escapeHtml(meta.note)}` : ""}</p></header>
${specs.map(figure).join("\n")}
<footer>Made with DataForSEO Agent. Numbers come from DataForSEO API responses; each chart names its endpoint and cost.</footer>
</main></body></html>
`
}
