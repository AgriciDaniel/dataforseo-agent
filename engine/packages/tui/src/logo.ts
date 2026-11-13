// The DataForSEO mark (a magnifier "Q" on a disc, blue above and yellow below), then the wordmark.
// The mark is 6 by 6 pixels, drawn with half blocks into 3 text rows, the same height as the wordmark's letters.
export const MARK = [
  ".BBBB.",
  "BKKKKB",
  "BKBBKB",
  "YKYYKY",
  "YKKKKY",
  ".YYYKK",
]
/**
 * The sidebar mark: 8 by 6 pixels drawn with sextants (2 by 3 pixels per cell), so it fits 4 columns and 2 text
 * rows. The disc is blue above and yellow below, the magnifier's dark ring sits in it with the disc showing
 * through its lens, and the handle leaves at the bottom right. No cell holds more than two colors.
 */
export const MARK_SIDEBAR = [
  ".BBBBBB.",
  "BBKKKKBB",
  "BBKBBKBB",
  "YYKYYKYY",
  "YYKKKKKK",
  ".YYYYYYK",
]
/** The wordmark row the mark starts on (the wordmark's first row is blank). */
export const MARK_TOP = 1
// DataForSEO brand blue and yellow; the ring is near black so it reads on light and dark backgrounds.
export const markColors: Record<string, string> = { B: "#2D3B9C", Y: "#F6C21C", K: "#15171d" }

export type MarkCell = { char: string; fg?: string; bg?: string }

/** The mark as text rows of half block cells: the top pixel is the foreground, the bottom one the background. */
export function markCells(mark: readonly string[] = MARK): MarkCell[][] {
  const rows: MarkCell[][] = []
  for (let y = 0; y < mark.length; y += 2) {
    rows.push(
      [...mark[y]].map((key, x) => {
        const top = markColors[key]
        const bottom = markColors[mark[y + 1]?.[x] ?? "."]
        if (top && bottom) return top === bottom ? { char: "█", fg: top } : { char: "▀", fg: top, bg: bottom }
        if (top) return { char: "▀", fg: top }
        if (bottom) return { char: "▄", fg: bottom }
        return { char: " " }
      }),
    )
  }
  return rows
}

/** A sextant: bit 0 is the top left pixel, bit 1 the top right, then the middle and bottom pairs. */
function sextant(bits: number) {
  if (bits === 0) return " "
  if (bits === 63) return "█"
  if (bits === 21) return "▌"
  if (bits === 42) return "▐"
  return String.fromCodePoint(0x1fb00 + bits - 1 - (bits > 21 ? 1 : 0) - (bits > 42 ? 1 : 0))
}

/**
 * A mark as text rows of sextant cells, 2 by 3 pixels each. An empty pixel is left to the background behind the
 * mark, so a cell with empty pixels has no background color of its own.
 */
export function markSextants(mark: readonly string[]): MarkCell[][] {
  const rows: MarkCell[][] = []
  for (let y = 0; y < mark.length; y += 3) {
    const row: MarkCell[] = []
    for (let x = 0; x < mark[y].length; x += 2) {
      const pixels = [0, 1, 2].flatMap((dy) => [0, 1].map((dx) => markColors[mark[y + dy]?.[x + dx] ?? "."]))
      const colors = [...new Set(pixels)]
      const fg = colors.find((color) => color !== undefined)
      const bg = colors.find((color) => color !== fg)
      if (!fg) row.push({ char: " " })
      else row.push({ char: sextant(pixels.reduce((bits, p, i) => (p === fg ? bits | (1 << i) : bits), 0)), fg, bg })
    }
    rows.push(row)
  }
  return rows
}

/** The mark's shape alone, for one color output. */
export const markText = () => markCells().map((row) => row.map((cell) => cell.char).join(""))

export const logo = {
  left: ["                                              ", "█▀▀▄ ▄▀▀▄ ▀█▀ ▄▀▀▄ █▀▀ █▀▀█ █▀▀▄ █▀▀▀ █▀▀ █▀▀█", "█  █ █▀▀█  █  █▀▀█ █▀  █  █ █▀▀▄ ▀▀▀█ █▀▀ █  █", "▀▀▀  ▀  ▀  ▀  ▀  ▀ ▀   ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀▀▀ ▀▀▀▀", "                                              "],
  right: ["                      ", "▄▀▀▄ █▀▀▀ █▀▀ █▄ █ ▀█▀", "█▀▀█ █ ▀█ █▀▀ █ ▀█  █ ", "▀  ▀ ▀▀▀▀ ▀▀▀ ▀  ▀  ▀ ", "                      "],
}
/** The wordmark's accent ("AGENT"): DataForSEO gold. */
export const accent = "#EABD59"

export const go = {
  left: ["    ", "█▀▀▀", "█_^█", "▀▀▀▀"],
  right: ["    ", "█▀▀█", "█__█", "▀▀▀▀"],
}
