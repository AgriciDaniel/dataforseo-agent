// DataForSEO Agent: a self-contained HTML report of chart specs. Each chart is drawn as inline SVG
// with its data table under it, so the file can be shared, opened offline and printed.
import {
  asTable,
  formatNumber,
  gaugeScores,
  intentPill,
  isDifficulty,
  trendChange,
  isRank,
  niceAxis,
  ordered,
  overlapRegions,
  percentText,
  rankText,
  stateCode,
  validate,
  type Series,
  type Spec,
} from "./chart.js"

const PALETTE = ["#2862A8", "#137A74", "#C9962B", "#6B8E23", "#7E57C2", "#C0504D"]
const GOOD = "#2E8B57"
const BAD = "#C0504D"
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

// Keyword difficulty tiers and colors, as open-seo draws them (MIT, every-app/open-seo).
const KD = [
  { max: 20, color: "#10b981", label: "Easy 0-20" },
  { max: 35, color: "#84cc16", label: "21-35" },
  { max: 50, color: "#eab308", label: "36-50" },
  { max: 65, color: "#f97316", label: "51-65" },
  { max: 80, color: "#ef4444", label: "66-80" },
  { max: 101, color: "#b91c1c", label: "Very hard 81+" },
]
const kdColor = (v: number) => KD.find((tier) => v <= tier.max)!.color
const INTENT: Record<string, { color: string; tip: string }> = {
  Info: { color: "#2563eb", tip: "Informational: people want to learn. Fits guides and how-tos." },
  Comm: { color: "#d97706", tip: "Commercial: people compare options. Fits reviews and comparisons." },
  Trans: { color: "#16a34a", tip: "Transactional: people are ready to act. Fits product and pricing pages." },
  Nav: { color: "#7c3aed", tip: "Navigational: people want a specific site." },
}

export function escapeHtml(text: unknown): string {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  )
}

const W = 760
const fmt = (v: number | null | undefined, unit?: string) => escapeHtml(formatNumber(v, unit))
// On a phone a chart keeps a readable minimum width and scrolls sideways instead of shrinking its text.
const svg = (h: number, body: string) =>
  `<div class="plot"><svg viewBox="0 0 ${W} ${h}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">${body}</svg></div>`
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
  // Ranks: position 1 gets the longest bar, so the longest bar is always the winner.
  const rank = isRank(spec, shown)
  const worst = Math.max(1, ...values)
  const positive = values.filter((v) => v > 0)
  const logScale =
    !rank &&
    (spec.log === true ||
      ((spec.log === undefined || spec.log === "auto") && positive.length > 1 && Math.max(...positive) / Math.min(...positive) >= 1000))
  const floor = positive.length ? Math.min(...positive) : 1
  const scaled = (v: number) =>
    rank ? (v > 0 ? worst + 1 - v : 0) : logScale ? (v > 0 ? Math.log10(v) - Math.log10(floor) + 0.3 : 0) : Math.max(0, v)
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
      const y = y0 + j * barH
      if (!num(v)) {
        if (rank) body += text(label + 6, y + barH - 5, "not ranking", `class="val"`)
        return
      }
      const w = Math.max(1, (scaled(v) / max) * plot)
      const shown = rank ? rankText(v) : formatNumber(v, spec.unit)
      body += `<rect x="${label}" y="${y}" width="${w.toFixed(1)}" height="${barH - 2}" rx="2" fill="${PALETTE[j % PALETTE.length]}"><title>${escapeHtml(name)}${grouped ? `, ${escapeHtml(s.name)}` : ""}: ${escapeHtml(shown)}</title></rect>`
      body += text(label + w + 6, y + barH - 5, shown, `class="val"`)
    })
  })
  const note = logScale
    ? `<div class="axisnote">Log scale: values span more than 1000x.</div>`
    : rank
      ? `<div class="axisnote">Longer bar = better rank (#1 is best).</div>`
      : ""
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
        `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${escapeHtml(name)} ${
          // Values given as percents are shown as given; counts get their share and the count.
          spec.unit === "%" ? `<b>${fmt(values[i], "%")}</b>` : `<b>${percentText(values[i], total)}</b> (${fmt(values[i], spec.unit)})`
        }</span>`,
    )
    .join("")
  return svg(34, body) + `<div class="legend">${items}</div>`
}

function diverging(spec: Spec) {
  const x = spec.x ?? []
  const [up, down] = spec.series ?? []
  const ups = (up?.values ?? []).map((v) => (num(v) ? Math.abs(v) : 0))
  const downs = (down?.values ?? []).map((v) => (num(v) ? Math.abs(v) : 0))
  const max = niceAxis(0, Math.max(1, ...ups, ...downs)).hi
  const H = 280
  const mid = (H - 20) / 2
  const step = (W - 110) / Math.max(1, x.length)
  const bw = Math.max(2, step * 0.7)
  let body = `<line x1="100" x2="${W}" y1="${mid}" y2="${mid}" class="axis"/>`
  body += text(94, 14, formatNumber(max, spec.unit), `text-anchor="end" class="val"`)
  body += text(94, H - 24, "-" + formatNumber(max, spec.unit), `text-anchor="end" class="val"`)
  // A label under each bar, or every 2nd, 3rd... when they would collide.
  const every = Math.max(1, Math.ceil((x.length * 7 * Math.max(...x.map((l) => String(l).length), 3)) / (W - 110)))
  x.forEach((label, i) => {
    if (i % every === 0) body += text(105 + i * step + bw / 2, H - 4, cut(String(label), 12), `text-anchor="middle" class="val"`)
  })
  x.forEach((label, i) => {
    const cx = 105 + i * step
    const hu = (ups[i] / max) * (mid - 8)
    const hd = (downs[i] / max) * (mid - 8)
    body += `<rect x="${cx.toFixed(1)}" y="${(mid - hu).toFixed(1)}" width="${bw.toFixed(1)}" height="${hu.toFixed(1)}" fill="${GOOD}"><title>${escapeHtml(label)}: +${ups[i]}</title></rect>`
    body += `<rect x="${cx.toFixed(1)}" y="${mid}" width="${bw.toFixed(1)}" height="${hd.toFixed(1)}" fill="${BAD}"><title>${escapeHtml(label)}: -${downs[i]}</title></rect>`
  })
  const sum = (a: number[]) => a.reduce((p, c) => p + c, 0)
  return (
    svg(H, body) +
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
  const invert = series.length > 0 && isRank(spec, series)
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  let ticks: number[]
  if (logScale) {
    if (lo === hi) {
      lo -= 1
      hi += 1
    }
    ticks = [lo, (lo + hi) / 2, hi]
  } else if (invert) {
    const axis = niceAxis(0, Math.max(2, hi))
    lo = 1
    hi = axis.hi
    ticks = [1, axis.mid, axis.hi]
  } else {
    const axis = niceAxis(lo, hi)
    lo = lo >= 0 ? Math.max(0, axis.lo) : axis.lo
    hi = axis.hi
    // A gridline at every step.
    ticks = []
    for (let t = lo; t <= hi + 1e-9; t += axis.step) ticks.push(t)
  }
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
  let body = ""
  for (const t of ticks) {
    const v = logScale ? 10 ** t : t
    // Dashed horizontal grid at each tick, no axis lines (open-seo's chart chrome).
    body += `<line x1="${left}" x2="${W - 10}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}" class="grid"/>`
    body += text(left - 6, py(v) + 4, invert ? rankText(v) : formatNumber(v, spec.unit), `text-anchor="end" class="val"`)
  }
  // Evenly spaced x labels: every one when they fit, else every 2nd, 3rd...
  const every = Math.max(1, Math.ceil(x.length / 8))
  for (let i = 0; i < x.length; i += every) {
    const anchor = i === 0 ? "start" : i === x.length - 1 ? "end" : "middle"
    body += text(px(i), H - 8, cut(String(x[i]), 12), `text-anchor="${anchor}" class="val"`)
  }
  series.forEach((s, j) => {
    const pts = s.values.map((v, i) => (num(v) ? `${px(i).toFixed(1)},${py(v).toFixed(1)}` : "")).filter(Boolean)
    // One series gets a soft gradient area under its line.
    if (series.length === 1 && !invert && pts.length > 1) {
      const first = pts[0].split(",")[0]
      const last = pts[pts.length - 1].split(",")[0]
      body += `<defs><linearGradient id="area${sparkId}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${PALETTE[0]}" stop-opacity="0.28"/><stop offset="1" stop-color="${PALETTE[0]}" stop-opacity="0.03"/></linearGradient></defs>`
      body += `<polygon fill="url(#area${sparkId++})" points="${first},${top + ph} ${pts.join(" ")} ${last},${top + ph}"/>`
    }
    body += `<polyline fill="none" stroke="${PALETTE[j % PALETTE.length]}" stroke-width="2.25" stroke-linejoin="round" points="${pts.join(" ")}"/>`
    // A dot per point, with its value on hover.
    s.values.forEach((v, i) => {
      if (num(v))
        body += `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="3" fill="${PALETTE[j % PALETTE.length]}"><title>${escapeHtml(s.name)}, ${escapeHtml(String(x[i] ?? ""))}: ${escapeHtml(invert ? rankText(v) : formatNumber(v, spec.unit))}</title></circle>`
    })
  })
  const note =
    (invert ? `<div class="axisnote">Rank axis: #1 at the top, so up is an improvement.</div>` : "") +
    (logScale ? `<div class="axisnote">Log scale: values span more than 1000x.</div>` : "")
  return svg(H, body) + note + (series.length > 1 ? legend(series) : "")
}

let sparkId = 0
// A small area trend: last 12 values, gradient fill, a dot on the last point, the change after it.
function spark(values: readonly unknown[], color: string, invert = false) {
  const v = (values.filter(num) as number[]).slice(-12)
  if (v.length < 2 || v.every((n) => n === 0)) return "-"
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pts = v.map((n, i) => {
    const t = hi === lo ? 0.5 : (n - lo) / (hi - lo)
    return [(i / (v.length - 1)) * 76 + 2, 3 + (invert ? t : 1 - t) * 16] as const
  })
  const change = trendChange(v)
  const up = change !== undefined && change > 0 !== invert
  const tone = change === undefined || Math.abs(change) < 5 ? "#94a3b8" : up ? "#16a34a" : "#d55e00"
  const stroke = change === undefined || Math.abs(change) < 5 ? color : tone
  const id = `sg${sparkId++}`
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [lx, ly] = pts[pts.length - 1]
  const arrow = change === undefined ? "" : Math.abs(change) < 5 ? "→" : `${change > 0 ? "↑" : "↓"}${Math.round(Math.abs(change))}%`
  return `<span class="trend"><svg viewBox="0 0 80 22" width="80" height="22"><title>${v.map((n) => formatNumber(n)).join(", ")}</title><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${stroke}" stop-opacity="0.32"/><stop offset="1" stop-color="${stroke}" stop-opacity="0.05"/></linearGradient></defs><polygon fill="url(#${id})" points="2,21 ${line} 78,21"/><polyline fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" points="${line}"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2" fill="${stroke}"/></svg><b style="color:${tone}">${arrow}</b></span>`
}

function scatter(spec: Spec) {
  const series = spec.series ?? []
  const pts = series.flatMap((s, j) =>
    (s.values as unknown[])
      .map((p, i) => ({ p, j, name: s.labels?.[i] }))
      .filter((d): d is { p: [number, number]; j: number; name: string | undefined } => Array.isArray(d.p) && num(d.p[0]) && num(d.p[1])),
  )
  if (pts.length === 0) return ""
  // Round axes: powers of ten on a log axis (volume spans 100x or more), plain round numbers otherwise.
  const axis = (vals: number[], label?: string, other?: string) => {
    const pos = vals.filter((v) => v > 0)
    const log =
      spec.log === true ||
      ((spec.log === undefined || spec.log === "auto") &&
        !isDifficulty(label) &&
        pos.length === vals.length &&
        pos.length > 1 &&
        Math.max(...pos) / Math.min(...pos) >= (isDifficulty(other) ? 20 : 100))
    if (log) {
      const lo = Math.floor(Math.log10(Math.min(...pos)) + 1e-9)
      const hi = Math.max(lo + 1, Math.ceil(Math.log10(Math.max(...pos)) - 1e-9))
      const ticks = Array.from({ length: hi - lo + 1 }, (_, k) => 10 ** (lo + k))
      return { log, ticks, scale: (v: number) => (Math.log10(Math.max(v, 1e-9)) - lo) / (hi - lo) }
    }
    const nice = niceAxis(Math.min(...vals), Math.max(...vals))
    const lo = Math.min(...vals) >= 0 ? Math.max(0, nice.lo) : nice.lo
    const ticks: number[] = []
    for (let t = lo; t <= nice.hi + 1e-9; t += nice.step) ticks.push(t)
    return { log, ticks, scale: (v: number) => (nice.hi === lo ? 0.5 : (v - lo) / (nice.hi - lo)) }
  }
  const ax = axis(pts.map((d) => d.p[0]), spec.x_label, spec.y_label)
  const ay = axis(pts.map((d) => d.p[1]), spec.y_label, spec.x_label)
  const kdX = isDifficulty(spec.x_label)
  const kdY = !kdX && isDifficulty(spec.y_label)
  const H = 320
  const left = 70
  const top = 12
  const ph = H - 60
  const pw = W - left - 20
  const X = (v: number) => left + ax.scale(v) * pw
  const Y = (v: number) => top + (1 - ay.scale(v)) * ph
  let body = ""
  // Difficulty bands behind the points, easy (green) to very hard (dark red), each labelled.
  if (kdX && !ax.log) {
    let from = 0
    KD.forEach((tier) => {
      const to = Math.min(100, tier.max)
      const x0 = X(from)
      const x1 = X(Math.min(to, 100))
      if (x1 > x0) {
        body += `<rect x="${x0.toFixed(1)}" y="${top}" width="${(x1 - x0).toFixed(1)}" height="${ph}" fill="${tier.color}" fill-opacity="0.07"/>`
        body += `<rect x="${x0.toFixed(1)}" y="${top + ph}" width="${(x1 - x0).toFixed(1)}" height="4" fill="${tier.color}"/>`
      }
      from = to
    })
  }
  // Grid: dashed horizontal lines at each y tick, no axis lines.
  ay.ticks.forEach((t) => {
    body += `<line x1="${left}" x2="${left + pw}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="grid"/>`
    body += text(left - 6, Y(t) + 4, formatNumber(t), `text-anchor="end" class="val"`)
  })
  ax.ticks.forEach((t) => (body += text(X(t), top + ph + 18, formatNumber(t), `text-anchor="middle" class="val"`)))
  // The opportunity zone: easy difficulty (KD 35 or less) with above median demand.
  const kdOf = (d: { p: [number, number] }) => (kdX ? d.p[0] : kdY ? d.p[1] : undefined)
  const demandOf = (d: { p: [number, number] }) => (kdX ? d.p[1] : d.p[0])
  if (kdX && !ax.log) {
    const demand = pts.map(demandOf).sort((a, b) => a - b)
    const median = demand[Math.floor(demand.length / 2)]
    body += `<rect class="zone" x="${X(0).toFixed(1)}" y="${top}" width="${(X(35) - X(0)).toFixed(1)}" height="${(Y(median) - top).toFixed(1)}" rx="4"/>`
    body += text(X(0) + 6, top + 14, "Opportunity: easy and in demand", `class="val" style="fill:#10b981;font-weight:600"`)
  }
  // Points: difficulty tier color when an axis is difficulty; names on the 8 largest.
  const labelled = new Set([...pts].sort((a, b) => demandOf(b) - demandOf(a)).slice(0, 8))
  // Label boxes placed so far (and every point), so labels never sit on each other or on a dot.
  const boxes: [number, number, number, number][] = pts.map((d) => [X(d.p[0]) - 6, Y(d.p[1]) - 6, X(d.p[0]) + 6, Y(d.p[1]) + 6])
  const free = (b: [number, number, number, number], own: number) =>
    b[0] >= left && b[2] <= left + pw && boxes.every((o, k) => k === own || b[2] <= o[0] || b[0] >= o[2] || b[3] <= o[1] || b[1] >= o[3])
  pts.forEach((d, index) => {
    const kd = kdOf(d)
    const color = kd !== undefined ? kdColor(kd) : PALETTE[d.j % PALETTE.length]
    const cx = X(d.p[0])
    const cy = Y(d.p[1])
    const tip = `${d.name ?? series[d.j].name}: ${spec.x_label ?? "x"} ${formatNumber(d.p[0])}, ${spec.y_label ?? "y"} ${formatNumber(d.p[1])}`
    body += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5.5" fill="${color}" fill-opacity="0.85" stroke="var(--card)" stroke-width="1.5"><title>${escapeHtml(tip)}</title></circle>`
    if (d.name && labelled.has(d)) {
      const name = cut(d.name, 24)
      const w = name.length * 6.2
      // Try right of the dot, then left, then above, then below; skip the label if none is free.
      const spots: [number, number, "start" | "end" | "middle", [number, number, number, number]][] = [
        [cx + 9, cy + 4, "start", [cx + 8, cy - 7, cx + 10 + w, cy + 6]],
        [cx - 9, cy + 4, "end", [cx - 10 - w, cy - 7, cx - 8, cy + 6]],
        [cx, cy - 10, "middle", [cx - w / 2, cy - 21, cx + w / 2, cy - 8]],
        [cx, cy + 18, "middle", [cx - w / 2, cy + 7, cx + w / 2, cy + 20]],
      ]
      const spot = spots.find((sp) => free(sp[3], index))
      if (spot) {
        boxes.push(spot[3])
        body += text(spot[0], spot[1], name, `class="lbl pt" text-anchor="${spot[2]}"`)
      }
    }
  })
  body += text(left + pw / 2, H - 6, `${spec.x_label ?? "x"}${ax.log ? " (log)" : ""}`, `text-anchor="middle" class="lbl"`)
  body += text(14, top + ph / 2, `${spec.y_label ?? "y"}${ay.log ? " (log)" : ""}`, `text-anchor="middle" class="lbl" transform="rotate(-90 14 ${top + ph / 2})"`)
  const key =
    kdX || kdY
      ? `<div class="legend">${KD.map((tier) => `<span><i style="background:${tier.color}"></i>KD ${tier.label}</span>`).join("")}</div>`
      : series.length > 1
        ? legend(series)
        : ""
  return svg(H, body) + key
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

// Rank buckets from best to worst: green through amber to red, one distinct shade per bucket.
const AMBER = "#E0A030"
const bucketColor = (i: number, n: number) => {
  const t = n <= 1 ? 0 : i / (n - 1)
  return t <= 0.5
    ? `color-mix(in srgb, ${AMBER} ${Math.round(t * 200)}%, ${GOOD})`
    : `color-mix(in srgb, ${BAD} ${Math.round((t - 0.5) * 200)}%, ${AMBER})`
}

function distribution(spec: Spec) {
  const x = spec.x ?? []
  const series = spec.series ?? []
  const label = 150
  const rowH = 30
  const plot = W - label - 80
  let body = ""
  series.forEach((s, r) => {
    const values = s.values.map((v) => (num(v) && v > 0 ? v : 0))
    const total = values.reduce((a, b) => a + b, 0) || 1
    const y = r * rowH + 4
    body += text(label - 8, y + 16, cut(s.name, 22), `text-anchor="end" class="lbl"`)
    let at = label
    values.forEach((v, i) => {
      const w = (v / total) * plot
      if (w <= 0) return
      body += `<rect x="${at.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="22" fill="${bucketColor(i, x.length)}"><title>${escapeHtml(s.name)}, ${escapeHtml(x[i])}: ${fmt(v)} (${percentText(v, total)})</title></rect>`
      if (w > 34) body += text(at + w / 2, y + 15, percentText(v, total), `text-anchor="middle" class="inbar"`)
      at += w
    })
    body += text(label + plot + 6, y + 16, formatNumber(total), `class="val"`)
  })
  const key = `<div class="legend">${x.map((b, i) => `<span><i style="background:${bucketColor(i, x.length)}"></i>${escapeHtml(b)}</span>`).join("")}</div>`
  return svg(series.length * rowH + 6, body) + key
}

function overlap(spec: Spec) {
  const { sets, regions } = overlapRegions(spec)
  const count = (names: string[]) => regions.find((r) => r.sets.length === names.length && names.every((n) => r.sets.includes(n)))?.count ?? 0
  const H = 300
  const r = 105
  // Two circles side by side, or three in a triangle; each region's exclusive count sits in it.
  const centres =
    sets.length === 2
      ? [
          [W / 2 - 65, H / 2],
          [W / 2 + 65, H / 2],
        ]
      : [
          [W / 2 - 62, H / 2 - 6],
          [W / 2 + 62, H / 2 - 6],
          [W / 2, H / 2 + 102],
        ]
  let body = ""
  sets.forEach((name, i) => {
    const [cx, cy] = centres[i]
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PALETTE[i]}" fill-opacity="0.28" stroke="${PALETTE[i]}" stroke-width="2"><title>${escapeHtml(name)}</title></circle>`
  })
  const at = (names: string[]) => {
    const idx = names.map((n) => sets.indexOf(n))
    const mean = (k: 0 | 1) => idx.reduce((a, i) => a + centres[i][k], 0) / idx.length
    if (names.length === 1) {
      // Push a set's own count away from the others.
      const [cx, cy] = centres[idx[0]]
      const ox = centres.reduce((a, c) => a + c[0], 0) / centres.length
      const oy = centres.reduce((a, c) => a + c[1], 0) / centres.length
      const d = Math.hypot(cx - ox, cy - oy) || 1
      return [cx + ((cx - ox) / d) * r * 0.45, cy + ((cy - oy) / d) * r * 0.45]
    }
    if (names.length === sets.length) return [mean(0), mean(1)]
    // A pair in a three way diagram: away from the third circle.
    const third = sets.length === 3 ? centres[[0, 1, 2].find((i) => !idx.includes(i))!] : undefined
    const mx = mean(0)
    const my = mean(1)
    if (!third) return [mx, my]
    const d = Math.hypot(mx - third[0], my - third[1]) || 1
    return [mx + ((mx - third[0]) / d) * 22, my + ((my - third[1]) / d) * 22]
  }
  regions.forEach((reg) => {
    const [x, y] = at(reg.sets)
    body += text(x, y + 6, formatNumber(reg.count), `text-anchor="middle" class="big"`)
  })
  sets.forEach((name, i) => {
    const [cx, cy] = centres[i]
    const above = sets.length === 2 || i < 2
    body += text(cx, above ? cy - r - 10 : cy + r + 22, cut(name, 28), `text-anchor="middle" class="lbl"`)
  })
  const shared = sets
    .map((name, i) => {
      const own = count([name])
      const total = regions.filter((reg) => reg.sets.includes(name)).reduce((a, reg) => a + reg.count, 0)
      return `<span><i style="background:${PALETTE[i]}"></i>${escapeHtml(name)}: <b>${fmt(total)}</b> keywords, ${fmt(total - own)} shared (${percentText(total - own, total)})</span>`
    })
    .join("")
  return svg(sets.length === 3 ? H + 80 : H - 20, body) + `<div class="legend">${shared}</div>`
}

function gauge(spec: Spec) {
  const series = spec.series ?? []
  const scores = gaugeScores(spec)
  const color = (v: number) => (v >= 90 ? GOOD : v >= 50 ? "#E0A030" : BAD)
  const dials = series
    .map((s, i) => {
      const v = Math.max(0, Math.min(100, scores[i]))
      // A half ring from left to right; the colored arc covers the score.
      const R = 46
      const end = Math.PI * (1 - v / 100)
      const ex = 60 + R * Math.cos(end)
      const ey = 60 - R * Math.sin(end)
      const arc = v > 0 ? `<path d="M14 60 A${R} ${R} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${color(v)}" stroke-width="12" stroke-linecap="round"/>` : ""
      return `<div class="gauge"><svg viewBox="0 0 120 70" width="140" role="img"><title>${escapeHtml(s.name)}: ${Math.round(v)} of 100</title><path d="M14 60 A${R} ${R} 0 0 1 106 60" fill="none" stroke="var(--line)" stroke-width="12" stroke-linecap="round"/>${arc}<text x="60" y="58" text-anchor="middle" class="big" style="fill:${color(v)}">${Math.round(v)}</text></svg><div class="name">${escapeHtml(s.name)}</div></div>`
    })
    .join("")
  return `<div class="gauges">${dials}</div><div class="legend"><span><i style="background:${GOOD}"></i>90 to 100</span><span><i style="background:#E0A030"></i>50 to 89</span><span><i style="background:${BAD}"></i>0 to 49</span></div>`
}

function donut(spec: Spec) {
  const { x, series } = ordered({ ...spec, sort: spec.sort ?? "desc" })
  const values = (series[0]?.values ?? []).map((v) => (num(v) ? Math.max(0, v) : 0))
  const total = values.reduce((a, b) => a + b, 0) || 1
  const R = 80
  const C = 2 * Math.PI * R
  let at = 0
  let rings = ""
  values.forEach((v, i) => {
    const len = (v / total) * C
    rings += `<circle cx="110" cy="110" r="${R}" fill="none" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="34" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-at).toFixed(2)}" transform="rotate(-90 110 110)"><title>${escapeHtml(x[i])}: ${spec.unit === "%" ? fmt(v, "%") : `${percentText(v, total)} (${fmt(v, spec.unit)})`}</title></circle>`
    at += len
  })
  const top = spec.unit === "%" ? fmt(values[0], "%") : percentText(values[0] ?? 0, total)
  const centre = `<text x="110" y="108" text-anchor="middle" class="big">${top}</text><text x="110" y="128" text-anchor="middle" class="val">${escapeHtml(cut(x[0] ?? "", 18))}</text>`
  const items = x
    .map(
      (name, i) =>
        `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${escapeHtml(name)} ${
          spec.unit === "%" ? `<b>${fmt(values[i], "%")}</b>` : `<b>${percentText(values[i], total)}</b> (${fmt(values[i], spec.unit)})`
        }</span>`,
    )
    .join("")
  return `<div class="donut"><svg viewBox="0 0 220 220" width="220" role="img">${rings}${centre}</svg><div class="legend vertical">${items}</div></div>`
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
  const numeric = series.map((s) => s.values.every((v) => v === null || v === undefined || num(v)))
  // Headers sort the table when clicked (see SORT_SCRIPT); a numeric column's header aligns with its numbers.
  const head = `<tr><th scope="col" data-sort></th>${series.map((s, j) => `<th scope="col" data-sort class="${numeric[j] ? "num" : ""}">${escapeHtml(s.name)}</th>`).join("")}</tr>`
  const rows = x
    .map(
      (label, r) =>
        `<tr><th>${escapeHtml(label)}</th>${series
          .map((s, j) => {
            const v = s.values[r]
            if (Array.isArray(v)) return `<td>${spark(v, PALETTE[j % PALETTE.length], s.lower_is_better)}</td>`
            if (num(v) && isDifficulty(s.name))
              return `<td class="num" data-v="${v}"><span class="kd" style="--kd:${kdColor(v)}">${Math.round(v)}</span></td>`
            if (num(v)) return `<td class="num" data-v="${v}">${fmt(v, table.unit)}</td>`
            const pill = /intent/i.test(s.name) && typeof v === "string" ? intentPill(v) : undefined
            if (pill)
              return `<td><span class="pill" style="--pill:${INTENT[pill.text].color}" title="${escapeHtml(INTENT[pill.text].tip)}">${pill.text}</span></td>`
            return `<td>${escapeHtml(v ?? "")}</td>`
          })
          .join("")}</tr>`,
    )
    .join("")
  // Long tables get a filter box (see SORT_SCRIPT).
  const filter = x.length > 10 ? `<input class="filter" type="search" placeholder="Filter ${x.length} rows" aria-label="Filter rows">` : ""
  return `${filter}<div class="scroll"><table class="data">${head}${rows}</table></div>`
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
                    : spec.type === "distribution"
                      ? distribution(spec)
                      : spec.type === "overlap"
                        ? overlap(spec)
                        : spec.type === "gauge"
                          ? gauge(spec)
                          : spec.type === "donut"
                            ? donut(spec)
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

// Progressive enhancement for the data tables: click a header to sort (again to flip), type to filter rows.
// The report reads fine without it (printed, or with scripts off).
const SORT_SCRIPT = `document.querySelectorAll("table.data").forEach((table) => {
  const rows = () => [...table.rows].slice(1)
  table.querySelectorAll("th[data-sort]").forEach((th, col) => {
    th.tabIndex = 0
    th.title = "Sort"
    const sort = () => {
      const dir = th.dataset.dir === "desc" ? "asc" : "desc"
      table.querySelectorAll("th[data-sort]").forEach((other) => { delete other.dataset.dir; other.removeAttribute("aria-sort") })
      th.dataset.dir = dir
      th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending")
      const key = (row) => { const cell = row.cells[col]; return cell && cell.dataset.v !== undefined ? Number(cell.dataset.v) : (cell ? cell.textContent : "") }
      rows().sort((a, b) => {
        const x = key(a), y = key(b)
        const order = typeof x === "number" && typeof y === "number" ? x - y : typeof x === "number" ? -1 : typeof y === "number" ? 1 : String(x).localeCompare(String(y))
        return dir === "asc" ? order : -order
      }).forEach((row) => table.tBodies[0].appendChild(row))
    }
    th.addEventListener("click", sort)
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sort() } })
  })
  const input = table.parentElement.previousElementSibling
  if (input && input.classList.contains("filter"))
    input.addEventListener("input", () => {
      const q = input.value.toLowerCase()
      rows().forEach((row) => { row.hidden = q !== "" && !row.textContent.toLowerCase().includes(q) })
    })
})`

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
svg text{fill:var(--fg);font-size:12px}svg .val{fill:var(--muted);font-size:11px}.plot{overflow-x:auto}.plot svg{min-width:560px}svg .big{font-size:20px;font-weight:700}svg .inbar{fill:#fff;font-size:11px;font-weight:600}
.gauges{display:flex;flex-wrap:wrap;gap:12px 24px}.gauge{text-align:center}.gauge .name{color:var(--muted);font-size:13px}
.donut{display:flex;flex-wrap:wrap;align-items:center;gap:16px 32px}.legend.vertical{flex-direction:column;margin:0}
@media (max-width:600px){svg text{font-size:15px}svg .val{font-size:14px}}svg .axis{stroke:var(--line)}
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
.kd{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 4px;border-radius:13px;font-weight:700;font-size:12px;color:var(--kd);background:color-mix(in oklab,var(--kd) 16%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--kd) 35%,transparent)}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:600;color:var(--pill);background:color-mix(in oklab,var(--pill) 15%,transparent)}
.trend{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.trend b{font-size:12px;font-weight:600}
svg .grid{stroke:var(--line);stroke-dasharray:3 3}svg .pt{font-size:11px;paint-order:stroke;stroke:var(--card);stroke-width:3px}svg .zone{fill:#10b981;fill-opacity:0.08}
th.num{text-align:right}th[data-sort]{cursor:pointer;user-select:none}th[data-sort]:hover{color:var(--fg);text-decoration:underline}
th[data-dir=asc]::after{content:" ▲";font-size:10px}th[data-dir=desc]::after{content:" ▼";font-size:10px}
.filter{margin-top:12px;padding:6px 10px;width:min(100%,280px);border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit}
.kpis{display:flex;flex-wrap:wrap;gap:12px}.kpi{flex:1 1 150px;padding:12px;border:1px solid var(--line);border-radius:8px}
.kpi .name{color:var(--muted);font-size:13px}.kpi .big{font-size:24px;font-weight:700}.err{color:${BAD}}
footer{color:var(--muted);font-size:12px;margin-top:40px}
@media print{figure{break-inside:avoid}details{display:block}details>*{display:block}}
</style></head><body><main>
<header>${crew()}<h1>${escapeHtml(title)}</h1>
<p>${specs.length} chart${specs.length === 1 ? "" : "s"} · created ${escapeHtml(created)}${meta.note ? ` · ${escapeHtml(meta.note)}` : ""}</p></header>
${specs.map(figure).join("\n")}
<footer>Made with DataForSEO Agent. Numbers come from DataForSEO API responses; each chart names its endpoint and cost.</footer>
</main><script>${SORT_SCRIPT}</script></body></html>
`
}
