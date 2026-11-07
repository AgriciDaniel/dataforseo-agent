// DataForSEO Agent: the three bar bots (red, yellow, green) from Daniel's GitHub profile, drawn in the
// terminal with half blocks (two pixels per cell). Used for the home screen crew and loading animations.
import { RGBA } from "@opentui/core"
import type { ColorGenerator } from "../component/spinner-renderable"

type Sprite = { frames: string[][]; pal: Record<string, string> }

// Sprite rows from the profile kit (bots.json): c body, s shine, e eye, f feet. Two walk frames each.
export const BOTS: Sprite[] = [
  {
    frames: [
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "f...f"],
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", ".f.f."],
    ],
    pal: { c: "#F44336", s: "#ffffff", e: "#1a1c2c", f: "#922820" },
  },
  {
    frames: [
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "f...f"],
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", ".f.f."],
    ],
    pal: { c: "#FFC107", s: "#ffffff", e: "#1a1c2c", f: "#997404" },
  },
  {
    frames: [
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "f...f"],
      [".ccc.", "csccc", "ccccc", "cecec", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", "ccccc", ".f.f."],
    ],
    pal: { c: "#7ED957", s: "#ffffff", e: "#1a1c2c", f: "#4C8234" },
  },
]

export const BOT_COLORS = BOTS.map((bot) => bot.pal.c)

/** One cell of a rendered scene: a half-block glyph with its top (fg) and bottom (bg) pixel colors. */
export type Cell = { char: string; fg?: string; bg?: string }

/** A pixel canvas that turns into half-block cells, two pixel rows per text row. */
export class PixelCanvas {
  readonly px: (string | undefined)[][]
  readonly labels: { x: number; row: number; cell: Cell }[] = []
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.px = Array.from({ length: height }, () => Array<string | undefined>(width).fill(undefined))
  }
  sprite(rows: readonly string[], pal: Record<string, string>, x: number, y: number, blink = false) {
    rows.forEach((row, r) =>
      [...row].forEach((key, c) => {
        if (key === ".") return
        const px = Math.round(x) + c
        const py = Math.round(y) + r
        if (px < 0 || py < 0 || px >= this.width || py >= this.height) return
        this.px[py][px] = pal[blink && key === "e" ? "c" : key]
      }),
    )
  }
  dot(x: number, y: number, color: string) {
    const px = Math.round(x)
    const py = Math.round(y)
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return
    this.px[py][px] = color
  }
  /** Text drawn over a whole cell (both of its pixels), such as the "$" on a sign. */
  label(x: number, row: number, text: string, fg: string, bg: string) {
    ;[...text].forEach((char, i) => this.labels.push({ x: Math.round(x) + i, row, cell: { char, fg, bg } }))
  }
  rows(): Cell[][] {
    const out: Cell[][] = []
    for (let y = 0; y < this.height; y += 2) {
      out.push(
        Array.from({ length: this.width }, (_, x) => {
          const top = this.px[y][x]
          const bottom = this.px[y + 1]?.[x]
          if (top && bottom) return { char: "▀", fg: top, bg: bottom }
          if (top) return { char: "▀", fg: top }
          if (bottom) return { char: "▄", fg: bottom }
          return { char: " " }
        }),
      )
    }
    this.labels.forEach((label) => {
      if (label.x < 0 || label.x >= this.width || !out[label.row]) return
      out[label.row][label.x] = label.cell
    })
    return out
  }
}

/**
 * The working indicator: three little bars in the bots' colors, bouncing in turn like a level meter.
 * Returns frames for the `<spinner>` element plus a per-character color generator.
 */
export function bounceFrames(): { frames: string[]; color: ColorGenerator } {
  const levels = "▁▂▃▄▅▆▇█"
  const base = [2, 3, 5]
  const total = 24
  const frames = Array.from({ length: total }, (_, f) =>
    base
      .map((b, i) => {
        const phase = ((f / total) * 2 * Math.PI) - i * 0.9
        const lift = Math.max(0, Math.sin(phase)) * 2.4
        return levels[Math.min(7, Math.round(b + lift))]
      })
      .join(" "),
  )
  const palette = BOT_COLORS.map((hex) => RGBA.fromHex(hex))
  const color: ColorGenerator = (_frame, charIndex) => palette[Math.floor(charIndex / 2) % palette.length]
  return { frames, color }
}
