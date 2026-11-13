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
 * The sidebar mark: the same disc, blue above and yellow below, with the magnifier's dark lens and its handle at
 * the bottom right, drawn 4 by 4 pixels. A blank pixel row above and below centres it on the middle of 3 text rows.
 */
export const MARK_SIDEBAR = ["....", ".BB.", "BKKB", "YKKY", ".YYK", "...."]
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
