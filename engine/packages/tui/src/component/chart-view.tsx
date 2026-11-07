// DataForSEO Agent: draws a `chart` tool result with theme colors.
// Interactive: switch chart and table, click a table header to sort, copy or save the data as CSV, open full screen.
import { RGBA, TextAttributes } from "@opentui/core"
import { useRenderer, useTerminalDimensions } from "@opentui/solid"
import { For, Show, createMemo, createSignal, onCleanup } from "solid-js"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { asTable, render, sortTable, toCsv, validate, type Role, type Spec } from "@dataforseo-agent/util/chart"
import { report } from "@dataforseo-agent/util/chart-html"
import { useTheme } from "../context/theme"
import { useClipboard } from "../context/clipboard"
import { tint } from "../theme/color"
import { useToast } from "../ui/toast"
import { DialogHeader, DialogLayout, dialogWidth, useDialog } from "../ui/dialog"

type SortState = { column: number; dir: "asc" | "desc" }

/** Folder, under the directory the app was started in, where saved CSV files go. */
export const EXPORT_DIR = "dataforseo-exports"

function slug(text: string | undefined) {
  const base = (text ?? "chart")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  return base || "chart"
}

function stamp(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}

export function ChartView(props: {
  spec: Spec
  width: number
  title?: string
  full?: boolean
  /** Every chart in the session, for the HTML report. */
  collect?: () => Spec[]
}) {
  const theme = useTheme()
  const renderer = useRenderer()
  const dialog = useDialog()
  const clipboard = useClipboard()
  const toast = useToast()
  const [table, setTable] = createSignal(false)
  const [tip, setTip] = createSignal<string | undefined>()
  // Count-up on first appearance: bar lengths and headline numbers grow to their value over half a second.
  const animated = ["hbar", "grouped-bar", "diverging-bar", "kpi"].includes(props.spec.type)
  const [progress, setProgress] = createSignal(animated ? 0 : 1)
  if (animated) {
    const start = Date.now()
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 500)
      setProgress(1 - Math.pow(1 - t, 3))
      if (t >= 1) clearInterval(timer)
    }, 33)
    onCleanup(() => clearInterval(timer))
  }
  const [sort, setSort] = createSignal<SortState | undefined>()
  const tableSpec = createMemo(() => asTable(props.spec))
  const isTable = createMemo(() => props.spec.type === "table" || (table() && tableSpec() !== undefined))
  const grown = createMemo((): Spec => {
    const p = progress()
    if (p >= 1) return props.spec
    const scale = (v: unknown) => (typeof v === "number" ? v * p : v)
    return {
      ...props.spec,
      series: props.spec.series?.map((s) => ({
        ...s,
        values: props.spec.type === "kpi" ? s.values.map((v, i) => (i === 0 ? scale(v) : v)) : s.values.map(scale),
      })) as Spec["series"],
    }
  })
  const active = createMemo(() => {
    const base = table() && tableSpec() ? tableSpec()! : grown()
    const s = sort()
    return s && base.type === "table" ? sortTable(base, s.column, s.dir) : base
  })
  const lines = createMemo(() => {
    const errors = validate(active())
    if (errors.length) return undefined
    try {
      return render(active(), Math.max(30, props.width))
    } catch {
      return undefined
    }
  })
  const hasTips = createMemo(() => lines()?.some((l) => l.some((sg) => sg.tip)) ?? false)
  const columnName = (column: number) =>
    column === 0 ? "label" : (active().series?.[column - 1]?.name ?? (sort() ? String(column) : ""))

  // A release that ends a text selection is a copy, not a click.
  const clicked = (e: { stopPropagation(): void }) => {
    if (renderer.getSelection()?.getSelectedText()) return false
    e.stopPropagation()
    return true
  }

  // First click shows the best rows on top: A to Z for labels, smallest first for lower_is_better
  // columns (positions, ranks), largest first otherwise. Second click flips, third goes back to the agent's order.
  const firstDir = (column: number): "asc" | "desc" => {
    const base = table() && tableSpec() ? tableSpec()! : props.spec
    return column === 0 || base.series?.[column - 1]?.lower_is_better ? "asc" : "desc"
  }
  const sortBy = (column: number) => {
    const s = sort()
    const first = firstDir(column)
    if (s?.column === column) {
      setSort(s.dir === first ? { column, dir: first === "asc" ? "desc" : "asc" } : undefined)
      return
    }
    setSort({ column, dir: first })
  }

  const csv = () => toCsv(props.spec)
  const copyCsv = () =>
    void clipboard
      .write(csv())
      .then(() => toast.show({ message: "Chart data copied as CSV", variant: "info" }))
      .catch(toast.error)
  const saveCsv = () => {
    const dir = path.join(process.cwd(), EXPORT_DIR)
    const file = path.join(dir, `${slug(props.title ?? props.spec.title)}-${stamp()}.csv`)
    void mkdir(dir, { recursive: true })
      .then(() => writeFile(file, csv()))
      .then(() => toast.show({ message: `Saved ${path.relative(process.cwd(), file)}`, variant: "success" }))
      .catch(toast.error)
  }
  const saveReport = () => {
    const charts = props.collect?.() ?? [{ ...props.spec, title: props.title ?? props.spec.title }]
    const dir = path.join(process.cwd(), EXPORT_DIR)
    const file = path.join(dir, `report-${stamp()}.html`)
    void mkdir(dir, { recursive: true })
      .then(() => writeFile(file, report(charts, { title: charts[0]?.title ? `DataForSEO report: ${charts[0].title}` : undefined })))
      .then(() =>
        toast.show({
          message: `Saved ${path.relative(process.cwd(), file)} (${charts.length} chart${charts.length === 1 ? "" : "s"})`,
          variant: "success",
        }),
      )
      .catch(toast.error)
  }
  const openFull = () => {
    dialog.replace(() => <ChartFullScreen spec={props.spec} title={props.title ?? props.spec.title} />, undefined, {
      size: "xlarge",
    })
    dialog.setCentered(true)
  }

  const color = (role: Role): RGBA | undefined => {
    const palette = theme.categorical
    if (typeof role === "number") return palette[role % palette.length][200]
    const good = theme.text.feedback.success.base
    const bad = theme.text.feedback.error.base
    switch (role) {
      case "title":
      case "text":
        return theme.text.base
      case "muted":
        return theme.text.muted
      case "axis":
        return tint(theme.background.base, theme.text.muted, 0.7)
      case "good":
      case "heat4":
        return good
      case "bad":
      case "heat0":
        return bad
      case "heat3":
        return tint(bad, good, 0.75)
      case "heat2":
        return theme.text.feedback.warning.base
      case "heat1":
        return tint(bad, good, 0.25)
      case "tile":
        return theme.background.base
      case "grade0":
      case "grade1":
      case "grade2":
      case "grade3":
      case "grade4":
      case "grade5":
      case "grade6": {
        // Worst (red) through warning (amber) to best (green).
        const t = Number(role.slice(5)) / 6
        const warn = theme.text.feedback.warning.base
        return t <= 0.5 ? tint(bad, warn, t * 2) : tint(warn, good, (t - 0.5) * 2)
      }
      case "seq0":
      case "seq1":
      case "seq2":
      case "seq3":
      case "seq4":
        return tint(theme.background.base, palette[0][200], 0.25 + Number(role.slice(3)) * 0.18)
      default:
        return undefined
    }
  }

  const hint = tint(theme.background.base, theme.text.muted, 0.6)
  const Button = (p: { label: string; run: () => void }) => (
    <text
      fg={theme.text.feedback.info.base}
      wrapMode="none"
      flexShrink={0}
      onMouseUp={(e: { stopPropagation(): void }) => clicked(e) && p.run()}
    >
      {`[${p.label}]`}
    </text>
  )

  return (
    <box flexDirection="column">
      <Show when={lines()} fallback={<text fg={theme.text.muted}>Chart could not be drawn.</text>}>
        {(rows) => (
          <For each={rows()}>
            {(line) => (
              <box flexDirection="row" height={1}>
                <Show when={line.length > 0} fallback={<text> </text>}>
                  <For each={line}>
                    {(segment) => (
                      <text
                        fg={color(segment.role)}
                        attributes={(() => {
                          // Only the header of the sorted column is underlined; no sort means no underline.
                          const sorted = segment.column !== undefined && sort()?.column === segment.column
                          if (sorted) return TextAttributes.BOLD | TextAttributes.UNDERLINE
                          return segment.bold ? TextAttributes.BOLD : undefined
                        })()}
                        bg={segment.bg ? color(segment.bg) : undefined}
                        wrapMode="none"
                        flexShrink={0}
                        onMouseOver={segment.tip ? () => setTip(segment.tip) : undefined}
                        onMouseOut={segment.tip ? () => setTip(undefined) : undefined}
                        onMouseUp={
                          segment.column === undefined
                            ? undefined
                            : (e: { stopPropagation(): void }) => clicked(e) && sortBy(segment.column!)
                        }
                      >
                        {segment.text}
                      </text>
                    )}
                  </For>
                </Show>
              </box>
            )}
          </For>
        )}
      </Show>
      <Show when={hasTips()}>
        <text fg={tip() ? theme.text.base : hint} wrapMode="none">
          {tip() ?? "point at a letter, tile or marker to see its keyword and numbers"}
        </text>
      </Show>
      <box flexDirection="row" flexWrap="wrap" columnGap={1} height="auto">
        <Show when={tableSpec()}>
          <Button
            label={table() ? "chart" : "table"}
            run={() => {
              setSort(undefined)
              setTable(!table())
            }}
          />
        </Show>
        <Button label="copy CSV" run={copyCsv} />
        <Button label="save CSV" run={saveCsv} />
        <Button label="save report" run={saveReport} />
        <Show when={!props.full}>
          <Button label="full screen" run={openFull} />
        </Show>
        <Show when={isTable()}>
          <text fg={hint} wrapMode="none" flexShrink={0}>
            {sort()
              ? `sorted by ${columnName(sort()!.column)} ${sort()!.dir === "asc" ? "↑" : "↓"}`
              : "click a header to sort"}
          </text>
        </Show>
      </box>
    </box>
  )
}

/** Full-screen view of one chart, in a dialog as wide as the terminal allows. Esc closes it. */
export function ChartFullScreen(props: { spec: Spec; title?: string }) {
  const dimensions = useTerminalDimensions()
  const width = createMemo(() => Math.min(dialogWidth("xlarge"), dimensions().width - 2) - 6)
  return (
    <DialogLayout header={<DialogHeader title={`# ${props.title ?? "Chart"}`} />}>
      <scrollbox maxHeight={Math.max(8, dimensions().height - 10)} scrollbarOptions={{ visible: false }}>
        <ChartView spec={{ ...props.spec, title: undefined }} title={props.title} width={width()} full />
      </scrollbox>
    </DialogLayout>
  )
}
