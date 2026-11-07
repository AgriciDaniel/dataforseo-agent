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

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const clamp = (t: number) => Math.max(0, Math.min(1, t))

/**
 * The home screen crew, a 12 second loop: the bots walk in, line up like the logo's three rising bars,
 * hop one after another, blink, then walk off to the right. Same story every loop, so it is calm.
 */
export function crewScene(t: number, width: number): Cell[][] {
  const T = 12
  const s = ((t % T) + T) % T
  const height = 13 + 4 + 1 // tallest bot, hop room, ground row
  const canvas = new PixelCanvas(width, height + (height % 2))
  const ground = height - 1
  const spacing = 8
  const centre = Math.floor(width / 2) - Math.floor((spacing * 2 + 5) / 2)
  BOTS.forEach((bot, i) => {
    const home = centre + i * spacing
    const delay = i * 0.35
    const walkIn = clamp((s - delay) / 3.2)
    const walkOut = clamp((s - 8.4 - (2 - i) * 0.25) / 3.2)
    const x = walkOut > 0 ? home + ease(walkOut) * (width - home + 6) : -6 + ease(walkIn) * (home + 6)
    const moving = (walkIn > 0 && walkIn < 1) || (walkOut > 0 && walkOut < 1)
    const hopAt = 4.2 + i * 0.45
    const hop = s >= hopAt && s < hopAt + 0.5 ? Math.sin(Math.PI * ((s - hopAt) / 0.5)) * 4 : 0
    const frame = moving ? Math.floor(s * 6) % 2 : 0
    const blink = s > 6.6 + i * 0.1 && s < 6.78 + i * 0.1
    const rows = bot.frames[frame]
    canvas.sprite(rows, bot.pal, x, ground - rows.length - hop, blink)
  })
  return canvas.rows()
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

/** What the session crew is acting out, chosen from the live session in component/crew.tsx. */
export type CrewMood = "thinking" | "tool" | "permission" | "chart" | "budget" | "error"

/**
 * The session strip comes in two sizes: "full" draws the real BOTS sprites (13 pixels tall, so 8 text rows with
 * room for the sign and the hop) and "mini" draws smaller bots in 4 text rows for shorter terminals.
 */
export type StripSize = "full" | "mini"

type Layout = {
  rows: number
  spacing: number
  hop: number
  // Rows from the top of a sprite: the head that leans or shakes, and the eye row.
  head: number
  eyes: number
  sprite: (i: number, step: number) => readonly string[]
}

const LAYOUTS: Record<StripSize, Layout> = {
  full: { rows: 8, spacing: 8, hop: 3, head: 4, eyes: 3, sprite: (i, step) => BOTS[i].frames[step] },
  mini: {
    rows: 4,
    spacing: 7,
    hop: 2,
    head: 2,
    eyes: 1,
    // Mini bot heights in pixels, feet included, rising like the logo's three bars: 4, 5 and 6.
    sprite: (i, step) => [".scc.", "cecec", ...Array<string>(i + 1).fill("ccccc"), step ? ".f.f." : "f...f"],
  },
}

/** Text rows the strip takes at each size. */
export const STRIP_ROWS: Record<StripSize, number> = { full: LAYOUTS.full.rows, mini: LAYOUTS.mini.rows }

const STRIP_LEFT = 5
const INK = "#1a1c2c"
const RING = "#d0d4dc"
const LENS = "#8fd3ff"

/** The still pose for each mood when animations are off: a moment that reads clearly on its own. */
export const STILL_TIME: Record<CrewMood, number> = {
  thinking: 0,
  tool: 0,
  permission: 0,
  chart: 1.15,
  budget: 1,
  error: 0.1,
}

type Eyes = "ahead" | "left" | "right" | "closed"
type Pose = { x: number; lift?: number; eyes?: Eyes; step?: number; bow?: boolean; head?: number }

/**
 * One frame of the session strip. `t` is seconds into the mood, so one shot moods (hop, bow, shake) play from
 * their start and looping moods simply loop.
 */
export function crewStrip(mood: CrewMood, t: number, width: number, size: StripSize = "mini"): Cell[][] {
  const layout = LAYOUTS[size]
  const height = layout.rows * 2
  const canvas = new PixelCanvas(width, height)
  const home = (i: number) => STRIP_LEFT + i * layout.spacing
  const blink = (i: number) => (t + i * 1.3) % 3.4 < 0.15
  const draw = (i: number, pose: Pose) => drawBot(canvas, layout, i, pose)
  const top = (i: number) => height - layout.sprite(i, 0).length

  if (mood === "thinking") {
    // Idle bob: each bot rises a pixel in turn, and blinks now and then.
    ;[0, 1, 2].forEach((i) =>
      draw(i, {
        x: home(i),
        lift: Math.sin((2 * Math.PI * t) / 1.6 - i * 0.9) > 0.3 ? 1 : 0,
        eyes: blink(i) ? "closed" : "ahead",
      }),
    )
    return canvas.rows()
  }

  if (mood === "tool") {
    // Walk back and forth across the strip; the bot in front carries the magnifier at eye level.
    const lane = Math.max(0, width - STRIP_LEFT * 2 - layout.spacing * 2 - 5)
    const travel = lane > 0 ? (t * 8) % (lane * 2) : 0
    const right = travel < lane || lane === 0
    const offset = right ? travel : lane * 2 - travel
    const step = Math.floor(t * 6) % 2
    ;[0, 1, 2].forEach((i) =>
      draw(i, { x: home(i) + offset, step: (step + i) % 2, eyes: right ? "right" : "left" }),
    )
    const lead = right ? 2 : 0
    const x = home(lead) + offset
    const centre = top(lead) + layout.eyes + step
    const ring = right ? x + 6 : x - 4
    ;[0, 1, 2].forEach((dx) => [-1, 0, 1].forEach((dy) => canvas.dot(ring + dx, centre + dy, RING)))
    canvas.dot(ring + 1, centre, LENS)
    canvas.dot(right ? x + 5 : x - 1, centre + 2, RING)
    return canvas.rows()
  }

  if (mood === "permission") {
    // Yellow holds up a "$" sign on a stick and waves it a little; red and green turn to look at it.
    const wave = Math.floor(t / 0.6) % 2
    const centre = home(1) + 2 + wave
    canvas.label(centre - 1, 0, " $ ", INK, "#ffffff")
    Array.from({ length: top(1) - 2 }, (_, dy) => canvas.dot(centre, 2 + dy, BOTS[1].pal.f))
    draw(0, { x: home(0), eyes: blink(0) ? "closed" : "right" })
    draw(1, { x: home(1) })
    draw(2, { x: home(2), eyes: blink(2) ? "closed" : "left" })
    return canvas.rows()
  }

  if (mood === "chart") {
    // A chart landed: a quick hop in turn, then one together (about 1.5 s).
    const hop = (start: number, length: number) =>
      t >= start && t < start + length ? Math.round(Math.sin(Math.PI * ((t - start) / length)) * layout.hop) : 0
    ;[0, 1, 2].forEach((i) => draw(i, { x: home(i), lift: hop(i * 0.18, 0.45) || hop(0.9, 0.5) }))
    return canvas.rows()
  }

  if (mood === "budget") {
    // The session budget ran out: everyone stops and bows, one after another, and stays bowed.
    ;[0, 1, 2].forEach((i) => {
      const bowed = t >= 0.2 + i * 0.15
      draw(i, { x: home(i), bow: bowed, eyes: bowed ? "closed" : "ahead" })
    })
    return canvas.rows()
  }

  // Error: red shakes its head for a moment while the others look at it.
  const shaking = t < 1.2
  const side = Math.floor(t * 8) % 2 ? 1 : -1
  draw(0, { x: home(0), head: shaking ? side : 0, eyes: shaking ? (side > 0 ? "right" : "left") : "ahead" })
  draw(1, { x: home(1), eyes: "left" })
  draw(2, { x: home(2), eyes: "left" })
  return canvas.rows()
}

function drawBot(canvas: PixelCanvas, layout: Layout, i: number, pose: Pose) {
  const eyes = { ahead: "cecec", left: "ececc", right: "ccece", closed: "ccccc" }[pose.eyes ?? "ahead"]
  const sprite = layout.sprite(i, pose.step ?? 0).map((row, r) => (r === layout.eyes ? eyes : row))
  // A bow drops the first body row and leans the head forward a pixel.
  const rows = pose.bow ? sprite.filter((_, r) => r !== layout.head) : sprite
  const top = canvas.height - rows.length - (pose.lift ?? 0)
  const pal = BOTS[i].pal
  canvas.sprite(rows.slice(0, layout.head), pal, pose.x + (pose.bow ? 1 : (pose.head ?? 0)), top)
  canvas.sprite(rows.slice(layout.head), pal, pose.x, top + layout.head)
}
