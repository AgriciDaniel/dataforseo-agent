// DataForSEO Agent: the home screen stage. Daniel's three Homies (red, yellow, green, at the kit's own heights)
// walk a road past six DataForSEO stations and work each one:
// keyword ideas grow into volume bars, the site climbs a result page, On-Page problems get fixed, backlinks
// connect, a local rank grid turns green and an AI answer cites the site. One Homie fires its red laser at the
// station while the others watch; every finished station moves the rank up, and #1 sets off fireworks.
//
// Interaction: click a Homie for a backflip and a tip, click a station to speed its work up, click anywhere else
// and the crew jumps. Stateful: the component steps it about 30 times a second. The short strip (ui/home-crew.ts)
// is used instead when the terminal has no room for this one.
import { PixelCanvas, type Cell } from "./bots"
import { TIPS, rotate } from "./home-crew"

/** Text rows of the stage (18 pixels): a HUD row, the Homies and their stations, the road, a caption row. */
export const STAGE_ROWS = 9
/** Columns the stage needs: the three Homies and one station side by side. */
export const STAGE_MIN_WIDTH = 76

const INK = "#1a1c2c"
const PAPER = "#ffffff"
const LASER = "#ff3b5c"
const GOLD = "#f6c21c"
const GOOD = "#7ED957"
const BAD = "#ef476f"
const WARN = "#ff9f1c"
const MUTED = "#8fa3c8"
const DIM = "#5b6b94"
const PANEL = "#0d1630"
const BORDER = "#2a3763"
const CHIP = "#26335c"
const ROAD = "#f2f5f9"
const ROAD_EDGE = "#8e9ab0"
const RESULT = "#4f8ff0"
const BUILDING = "#101a36"
const WINDOW = "#1d2a52"
const STAR = "#2c3458"
const SPARK = ["#ffffff", "#ffd166", "#8fd3ff", GOOD]
const FIRE = ["#ffd166", WARN, BAD]

// The Homies as in the kit (5 pixels wide, a rounded head, a white shine, two eyes, feet), with the logo's
// rising bar heights as in the kit: red 8, yellow 10, green 13 pixels. c body, s shine, e eye, f feet, h blush.
const HOMIES = [
  { c: "#F44336", s: PAPER, e: INK, f: "#922820", h: "#ff9bb3", rows: 8 },
  { c: "#FFC107", s: PAPER, e: INK, f: "#997404", h: "#ff9bb3", rows: 10 },
  { c: "#7ED957", s: PAPER, e: INK, f: "#4C8234", h: "#ff9bb3", rows: 13 },
]
/** Screen pixels per sprite pixel. */
const S = 1
const BW = 5 * S
const GAP = 2
const FLOOR = 14
const PW = 46
const PANEL_TOP = 2
/** The sprite row the eyes are on. */
const EYES = 3
const GRAVITY = 90

type Kind = "keywords" | "serp" | "onpage" | "backlinks" | "maps" | "ai"
type Station = { kind: Kind; name: string; path: string; title: string; color: string; done: string; say: string; clicks: number }
const STATIONS: Station[] = [
  {
    kind: "keywords",
    name: "LABS API",
    path: "/v3/dataforseo_labs/google/keyword_ideas/live",
    title: "KEYWORD IDEAS",
    color: GOLD,
    done: "740 keywords",
    say: "Easy ones first: KD under 30.",
    clicks: 120,
  },
  {
    kind: "serp",
    name: "SERP API",
    path: "/v3/serp/google/organic/live/advanced",
    title: "GOOGLE RESULTS",
    color: RESULT,
    done: "up 4 places",
    say: "Top 10 pulled. We can beat them.",
    clicks: 340,
  },
  {
    kind: "onpage",
    name: "ON-PAGE API",
    path: "/v3/on_page/lighthouse/live/json",
    title: "SITE AUDIT",
    color: GOOD,
    done: "4 fixes",
    say: "404 mapped, LCP fixed, schema added.",
    clicks: 180,
  },
  {
    kind: "backlinks",
    name: "BACKLINKS API",
    path: "/v3/backlinks/summary/live",
    title: "BACKLINKS",
    color: "#8fd3ff",
    done: "+3 domains",
    say: "Three new referring domains.",
    clicks: 260,
  },
  {
    kind: "maps",
    name: "SERP MAPS",
    path: "/v3/serp/google/maps/live/advanced",
    title: "LOCAL RANK GRID",
    color: BAD,
    done: "top 3 nearby",
    say: "Top 3 across the whole grid.",
    clicks: 210,
  },
  {
    kind: "ai",
    name: "AI OPTIMIZATION",
    path: "/v3/ai_optimization/llm_mentions/search/live",
    title: "AI ANSWERS",
    color: "#ae8cdd",
    done: "cited [1]",
    say: "The AI answer cites us now.",
    clicks: 420,
  },
]
/** The site's rank after each station of a run; the sixth station reaches #1. */
const RANKS = [31, 19, 11, 6, 3, 1]
const START_RANK = 48
const SPACING = PW + 64
const SPEED = 22
const WORK = 4.6
const CHEER = 1.7
const PARTY = 3.6

type Bot = { y: number; vy: number; flip?: number; say?: string; sayUntil: number; happyUntil: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }
type Float = { x: number; y: number; text: string; fg: string; from: number; until: number }

function random(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const part = (p: number, from: number, to: number) => clamp((p - from) / (to - from))
const ease = (p: number) => 1 - Math.pow(1 - clamp(p), 3)
const count = (n: number) => Math.round(n).toLocaleString("en-US")

/** A Homie sprite: its body rows under the head, and the walk step. */
export function homie(bot: number, step: number, happy = false) {
  const body = Array<string>(HOMIES[bot].rows - 5).fill("ccccc")
  if (happy) body[0] = "hccch"
  return [".ccc.", "csccc", "ccccc", "cecec", ...body, step ? ".f.f." : "f...f"]
}

export class HomeStage {
  time = 0
  rank = START_RANK
  clicks = 0
  /** The station the crew is walking to or working on, counted from the start. */
  station = 0
  phase: "walk" | "work" | "cheer" = "walk"
  private readonly H = STAGE_ROWS * 2
  private scroll = 0
  private since = 0
  private boost = 0
  private bots: Bot[] = [0, 1, 2].map(() => ({ y: 0, vy: 0, sayUntil: 0, happyUntil: 0 }))
  private particles: Particle[] = []
  private floats: Float[] = []
  private next: () => number
  private tip: number
  private pointer?: number
  private pointedAt = 0
  private hopped = new Map<number, number>()

  constructor(
    private width: number,
    seed = Date.now(),
  ) {
    this.next = random(seed)
    this.tip = Math.floor(this.next() * TIPS.length)
  }

  resize(width: number) {
    this.width = width
  }

  /** The red Homie's left column; the group and its station sit a little left of the middle. */
  private base() {
    return Math.max(2, Math.round((this.width - (3 * BW + 2 * GAP + 9 + PW)) * 0.4))
  }
  private botX(i: number) {
    return this.base() + i * (BW + GAP)
  }
  /** Where a station's left edge is on screen while the crew works it. */
  private stop() {
    return this.botX(2) + BW + 9
  }
  private stationX(k: number) {
    return this.stop() + 50 + k * SPACING - Math.round(this.scroll)
  }
  private current() {
    return STATIONS[this.station % STATIONS.length]
  }
  /** How far the current station's work is, 0 to 1. */
  progress() {
    if (this.phase === "walk") return 0
    if (this.phase === "cheer") return 1
    return clamp((this.time - this.since + this.boost) / WORK)
  }
  private worker() {
    return this.station % 3
  }

  step(dt: number) {
    this.time += dt
    if (this.phase === "walk") {
      const target = 50 + this.station * SPACING
      this.scroll = Math.min(target, this.scroll + SPEED * dt)
      if (this.scroll >= target) {
        this.phase = "work"
        this.since = this.time
        this.boost = 0
      }
    } else if (this.phase === "work") {
      if (this.progress() >= 1) this.finish()
    } else if (this.time - this.since > (this.rank === 1 ? PARTY : CHEER)) {
      if (this.rank === 1) this.rank = START_RANK
      this.station++
      this.phase = "walk"
    }
    // Fireworks while the site holds #1.
    if (this.phase === "cheer" && this.rank === 1 && Math.floor(this.time / 0.3) !== Math.floor((this.time - dt) / 0.3))
      this.burst(4 + this.next() * (this.width - 8), 3 + this.next() * 8, 16, [...SPARK, ...FIRE], 14)
    for (const bot of this.bots) {
      bot.vy += GRAVITY * dt
      bot.y += bot.vy * dt
      if (bot.y >= 0) {
        bot.y = 0
        bot.vy = 0
        bot.flip = undefined
      }
      if (bot.say && bot.sayUntil <= this.time) bot.say = undefined
    }
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 30 * dt
      p.life -= dt
      return p.life > 0 && p.y < FLOOR
    })
    this.floats = this.floats.filter((f) => f.until > this.time)
  }

  /** The station is done: the rank moves up, clicks come in, the crew cheers and one of them says what happened. */
  private finish() {
    const station = this.current()
    const x = this.stationX(this.station)
    this.phase = "cheer"
    this.since = this.time
    this.rank = RANKS[this.station % RANKS.length]
    this.clicks += station.clicks
    this.float(x + PW - station.done.length - 4, PANEL_TOP, `✓ ${station.done}`, GOOD, 2)
    this.burst(x + PW / 2, PANEL_TOP + 2, 12, SPARK, 8)
    this.bots.forEach((bot, i) => {
      bot.vy = -20 - i
      bot.happyUntil = this.time + CHEER
      if (this.rank === 1) bot.flip = this.time
    })
    const talker = this.bots[(this.station + 1) % 3]
    talker.say = this.rank === 1 ? "#1 on Google!" : station.say
    talker.sayUntil = this.time + (this.rank === 1 ? PARTY : CHEER) - 0.1
  }

  private float(x: number, y: number, text: string, fg: string, seconds: number) {
    this.floats.push({ x, y, text, fg, from: this.time, until: this.time + seconds })
  }
  private burst(x: number, y: number, n: number, colors: readonly string[], speed: number) {
    for (let i = 0; i < n; i++) {
      const a = this.next() * Math.PI * 2
      const v = speed * (0.4 + this.next() * 0.8)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v * 1.6,
        vy: Math.sin(a) * v - 6,
        life: 0.5 + this.next() * 0.6,
        color: colors[Math.floor(this.next() * colors.length) % colors.length],
      })
    }
  }

  private botAt(col: number) {
    return this.bots.findIndex((_, i) => col >= this.botX(i) - 1 && col <= this.botX(i) + BW)
  }

  /** The pointer moved over the stage at column `col`. */
  point(col: number) {
    this.pointer = col
    this.pointedAt = this.time
    const i = this.botAt(col)
    if (i < 0 || this.bots[i].vy !== 0 || this.time - (this.hopped.get(i) ?? -9) < 1) return
    this.hopped.set(i, this.time)
    this.bots[i].vy = -13
  }

  /**
   * A click at column `col`. On a Homie: a backflip and sometimes a tip ("flip"). On the station being worked:
   * the work speeds up ("hit"). Anywhere else: the whole crew jumps ("jump").
   */
  poke(col: number): string {
    this.pointer = col
    this.pointedAt = this.time
    const i = this.botAt(col)
    if (i >= 0) {
      const bot = this.bots[i]
      bot.vy = -24
      bot.flip = this.time
      this.burst(this.botX(i) + BW / 2, FLOOR - 2, 6, SPARK, 6)
      if (this.next() < 0.7) {
        bot.say = TIPS[this.tip++ % TIPS.length]
        bot.sayUntil = this.time + 3.5
      }
      return "flip"
    }
    const x = this.stationX(this.station)
    if (this.phase === "work" && col >= x && col < x + PW) {
      this.boost += 1.2
      this.burst(col, PANEL_TOP + 5, 8, FIRE, 8)
      return "hit"
    }
    this.bots.forEach((bot, k) => {
      if (bot.vy === 0) bot.vy = -18 - k
    })
    return "jump"
  }

  /** Each Homie's screen column, lift in pixels, quarter turns and eyes, for tests. */
  poses() {
    return this.bots.map((bot, i) => {
      const blink = (this.time + i * 1.3) % 3.7 < 0.15
      const laser = this.phase === "work" && i === this.worker() && bot.vy === 0 && (this.time - this.since) % 0.9 < 0.55
      return {
        x: this.botX(i),
        lift: Math.round(-bot.y),
        turn: bot.flip !== undefined ? -Math.min(4, Math.floor(((this.time - bot.flip) / 0.6) * 4)) : 0,
        eyes: laser ? ("laser" as const) : blink ? ("closed" as const) : ("ahead" as const),
        happy: bot.happyUntil > this.time,
        step: this.phase === "walk" && bot.vy === 0 ? Math.floor((this.scroll + i * 2) / 3) % 2 : 0,
      }
    })
  }

  frame(): Cell[][] {
    const canvas = new PixelCanvas(this.width, this.H)
    this.drawSky(canvas)
    for (let k = Math.max(0, this.station - 1); k <= this.station + 1; k++) {
      const x = this.stationX(k)
      if (x > this.width || x + PW < 0) continue
      this.drawStation(canvas, STATIONS[k % STATIONS.length], x, k < this.station ? 1 : k > this.station ? 0 : this.progress(), k)
    }
    this.drawRoad(canvas)
    const poses = this.poses()
    // The Homies walk in front of a station: its text gives way where one of them stands.
    const hidden = canvas.labels.filter((label) =>
      poses.some((pose, i) => {
        const top = FLOOR - HOMIES[i].rows * S + Math.round(this.bots[i].y)
        return label.x >= pose.x && label.x < pose.x + BW && label.row >= Math.floor(top / 2) && label.row * 2 < FLOOR
      }),
    )
    hidden.forEach((label) => canvas.labels.splice(canvas.labels.indexOf(label), 1))
    this.drawLaser(canvas, poses)
    poses.forEach((pose, i) => this.drawBot(canvas, i, pose))
    this.particles.forEach((p) => canvas.dot(p.x, p.y, p.color))
    this.drawText(canvas, poses)
    return canvas.rows()
  }

  private drawSky(canvas: PixelCanvas) {
    for (let k = 0; k < this.width / 11; k++) {
      const x = (((((k * 37) % 997) * 7 - Math.round(this.scroll * 0.1)) % this.width) + this.width) % this.width
      canvas.dot(x, 2 + ((k * 5) % 6), STAR)
    }
    // A skyline far behind the road, drifting at a quarter of the walking speed.
    const shift = Math.round(this.scroll * 0.25)
    for (let b = Math.floor(shift / 13) - 1; b * 13 - shift < this.width; b++) {
      const seed = ((b * 2654435761) >>> 0) % 1000
      const w = 7 + (seed % 5)
      const h = 3 + (seed % 7)
      const x0 = b * 13 - shift
      for (let x = x0; x < x0 + w; x++)
        for (let y = FLOOR - h; y < FLOOR; y++) {
          const lit = (x - x0) % 2 === 1 && (y - (FLOOR - h)) % 2 === 1 && x - x0 < w - 1
          canvas.dot(x, y, lit ? WINDOW : BUILDING)
        }
    }
  }

  private drawRoad(canvas: PixelCanvas) {
    const offset = Math.round(this.scroll)
    for (let x = 0; x < this.width; x++) {
      canvas.dot(x, FLOOR, ROAD)
      canvas.dot(x, FLOOR + 1, (x + offset) % 12 === 0 ? BUILDING : ROAD_EDGE)
      // Result lines under the road, as on a result page: a blue title and a grey line.
      const at = (((x + offset) % 34) + 34) % 34
      if (at >= 2 && at < 11) canvas.dot(x, FLOOR + 2, RESULT)
      if (at >= 2 && at < 19) canvas.dot(x, FLOOR + 3, WINDOW)
    }
  }

  private drawBot(canvas: PixelCanvas, i: number, pose: ReturnType<HomeStage["poses"]>[number]) {
    const pal = HOMIES[i]
    const bot = this.bots[i]
    const rows = rotate(homie(i, pose.step, pose.happy), pose.turn)
    // A slow breath while standing: the head rises one pixel now and then.
    const breath = this.phase !== "walk" && bot.vy === 0 && (this.time * 0.8 + i * 0.37) % 1 < 0.18 ? 1 : 0
    const x0 = pose.x + Math.floor((BW - rows[0].length * S) / 2)
    const y0 = FLOOR - rows.length * S + Math.round(bot.y)
    rows.forEach((row, r) =>
      [...row].forEach((key, c) => {
        if (key === ".") return
        // Breathing in lifts everything above the feet by a pixel; the lowest body row stretches to cover the gap.
        const lifted = breath === 1 && key !== "f" && pose.turn === 0
        const y = y0 + r * S - (lifted ? 1 : 0)
        const color = key === "e" && pose.eyes === "laser" ? LASER : key === "e" && pose.eyes === "closed" ? pal.c : pal[key as "c"]
        for (let dy = 0; dy < S + (lifted && r === rows.length - 2 ? 1 : 0); dy++)
          for (let dx = 0; dx < S; dx++) canvas.dot(x0 + c * S + dx, y + dy, color)
      }),
    )
  }

  /** The working Homie's red laser, from its eyes to the station. */
  private drawLaser(canvas: PixelCanvas, poses: ReturnType<HomeStage["poses"]>) {
    const i = this.worker()
    if (poses[i].eyes !== "laser") return
    const y = FLOOR - HOMIES[i].rows * S + EYES * S
    const to = this.stationX(this.station)
    for (let x = poses[i].x + BW; x < to; x++) if ((x + Math.floor(this.time * 40)) % 5 !== 0) canvas.dot(x, y, LASER)
    if (Math.floor(this.time * 30) % 3 === 0) this.burst(to, y, 1, FIRE, 5)
  }

  private drawStation(canvas: PixelCanvas, station: Station, x: number, p: number, k: number) {
    for (let px = x; px < x + PW; px++)
      for (let y = PANEL_TOP; y < FLOOR; y++) {
        const edge = px === x || px === x + PW - 1 || y === PANEL_TOP || y === FLOOR - 1
        canvas.dot(px, y, edge ? (p >= 1 ? station.color : BORDER) : PANEL)
      }
    const text = (col: number, row: number, value: string, fg: string, bg = PANEL) => {
      const room = x + PW - 2 - (x + col)
      canvas.label(x + col, row, value.slice(0, Math.max(0, room)), fg, bg)
    }
    text(2, 1, ` ${station.title} `, INK, station.color)
    if (station.kind === "keywords") {
      const heights = [0.5, 0.9, 0.35, 1, 0.6, 0.75, 0.3, 0.45]
      const tiers = [GOOD, WARN, GOOD, BAD, GOLD, WARN, GOOD, GOLD]
      heights.forEach((h, i) => {
        const tall = Math.round(8 * h * ease(part(p, i * 0.07, i * 0.07 + 0.45)))
        for (let y = 12 - tall; y < 12; y++) for (let c = 0; c < 4; c++) canvas.dot(x + 3 + i * 5 + c, y, tiers[i])
      })
      text(PW - 21, 6, `${count(740 * ease(p))} ideas for "crm"`.padStart(18), p >= 1 ? GOOD : MUTED)
    }
    if (station.kind === "serp") {
      const top = RANKS[k % RANKS.length]
      const ours = 4 - Math.min(4, Math.floor(p * 5))
      const others = ["rival.com", "bigcrm.io", "crmhub.co", "salesly.app"]
      const list = [...others.slice(0, ours), "yoursite.com", ...others.slice(ours)]
      list.forEach((domain, i) => {
        const line = ` #${top + i}`.padEnd(6) + domain
        if (i === ours) text(2, 2 + i, line.padEnd(PW - 5), INK, GOLD)
        else text(2, 2 + i, line, MUTED)
      })
    }
    if (station.kind === "onpage") {
      const checks = [
        ["404 on /old-page", "404 mapped to 301"],
        ["LCP 4.8s", "LCP 2.1s"],
        ["No schema", "Schema added"],
        ["AI bots blocked", "AI bots allowed"],
      ]
      checks.forEach(([before, after], i) => {
        const fixed = p > (i + 1) * 0.2
        text(2, 2 + i, fixed ? `✓ ${after}` : `✗ ${before}`, fixed ? GOOD : BAD)
      })
      const score = Math.round(41 + 55 * ease(p))
      const fill = Math.round(score / 5)
      const color = score >= 90 ? GOOD : score >= 50 ? GOLD : BAD
      text(2, 6, "Health", MUTED)
      text(9, 6, "█".repeat(fill), color)
      text(9 + fill, 6, "░".repeat(20 - fill), BORDER)
      text(30, 6, ` ${score}/100`, color)
    }
    if (station.kind === "backlinks") {
      const site = " yoursite.com "
      const sx = PW - site.length - 3
      text(sx, 4, site, INK, GOLD)
      ;[" blog.io ", " news.co ", " wiki.org "].forEach((domain, i) => {
        const row = 2 + i * 2
        const grown = part(p, i * 0.25, i * 0.25 + 0.35)
        text(2, row, domain, PAPER, CHIP)
        // An elbow from the domain to the site, drawn as it links.
        const path: [number, number][] = []
        const from = x + 2 + domain.length
        const mid = x + sx - 5
        for (let px = from; px <= mid; px++) path.push([px, row * 2 + 1])
        for (let y = row * 2 + 1; y !== 9; y += row < 4 ? 1 : -1) path.push([mid, y])
        for (let px = mid; px < x + sx; px++) path.push([px, 9])
        path.slice(0, Math.round(path.length * grown)).forEach(([px, y], n) => {
          if (grown >= 1 || n % 2 === 0) canvas.dot(px, y, grown >= 1 ? GOOD : MUTED)
        })
      })
      text(sx, 6, `${count(1281 + 3 * ease(p))} domains`, p >= 1 ? GOOD : MUTED)
    }
    if (station.kind === "maps") {
      const before = [
        [14, 9, 7, 11, 18],
        [8, 5, 4, 6, 12],
        [6, 3, 2, 4, 9],
        [9, 5, 3, 6, 13],
        [16, 10, 8, 12, 20],
      ]
      let top3 = 0
      before.forEach((line, r) =>
        line.forEach((rank, c) => {
          const far = Math.hypot(r - 2, c - 2) / 2.9
          const value = p > far * 0.85 + 0.08 ? 1 + ((r + c) % 3) : rank
          if (value <= 3) top3++
          const bg = value <= 3 ? GOOD : value <= 10 ? GOLD : BAD
          text(2 + c * 5, 2 + r, String(value).padStart(3).padEnd(4), INK, bg)
        }),
      )
      text(29, 2, "5 x 5 grid", DIM)
      text(29, 4, "Top 3 share", MUTED)
      text(29, 5, `${Math.round((top3 / 25) * 100)}%`, top3 === 25 ? GOOD : GOLD)
    }
    if (station.kind === "ai") {
      text(2, 2, 'asked: "best crm for a small team"', DIM)
      const lines = ["Reviewers of small team CRMs", "most often recommend", "yoursite.com [1]"]
      let typed = Math.round(lines.join("").length * part(p, 0, 0.8))
      lines.forEach((line, i) => {
        const shown = line.slice(0, Math.max(0, typed))
        typed -= line.length
        text(2, 3 + i, shown, i === 2 ? GOLD : PAPER)
      })
      text(2, 6, `LLM mentions ${Math.round(3 + 14 * ease(p))}` + (p >= 1 ? " · cited in 4 of 5 answers" : ""), p >= 1 ? GOOD : MUTED)
    }
  }

  private drawText(canvas: PixelCanvas, poses: ReturnType<HomeStage["poses"]>) {
    const station = this.current()
    const hud = `RANK #${this.rank}   ${count(this.clicks)} clicks`
    if (this.width >= 60) {
      canvas.label(this.width - hud.length - 1, 0, `RANK #${this.rank}`, this.rank === 1 ? GOOD : GOLD, "")
      canvas.label(this.width - `${count(this.clicks)} clicks`.length - 1, 0, `${count(this.clicks)} clicks`, MUTED, "")
    }
    const i = this.pointer === undefined || this.time - this.pointedAt > 2.5 ? -1 : this.botAt(this.pointer)
    const x = this.stationX(this.station)
    const onStation = this.pointer !== undefined && this.time - this.pointedAt <= 2.5 && this.pointer >= x && this.pointer < x + PW
    const left =
      i >= 0
        ? { text: "Click a Homie for a backflip and a tip", fg: PAPER }
        : onStation && this.phase === "work"
          ? { text: "Click the station to speed it up", fg: PAPER }
          : { text: `STATION ${(this.station % STATIONS.length) + 1} OF ${STATIONS.length} · ${station.name}`, fg: GOLD }
    canvas.label(1, 0, left.text.slice(0, Math.max(0, this.width - hud.length - 4)), left.fg, "")
    // The endpoint being called, written under the road like a street name.
    for (let k = Math.max(0, this.station - 1); k <= this.station + 1; k++) {
      const at = this.stationX(k)
      const path = STATIONS[k % STATIONS.length].path
      if (at >= 0 && at + path.length < this.width) canvas.label(at, STAGE_ROWS - 1, path, k === this.station ? MUTED : DIM, "")
    }
    if (this.phase === "cheer" && this.rank === 1) {
      const text = " #1 ON GOOGLE! "
      canvas.label(Math.max(0, Math.floor((this.width - text.length) / 2)), 1, text, INK, GOLD)
    }
    this.floats.forEach((f) => {
      const lift = Math.floor(((this.time - f.from) / (f.until - f.from)) * 2)
      const col = Math.max(0, Math.min(this.width - f.text.length, Math.round(f.x)))
      canvas.label(col, Math.max(0, Math.floor(f.y / 2) - lift), f.text, f.fg, "")
    })
    // What a Homie says is written under it, below the road, like a subtitle; it stops short of the endpoint.
    this.bots.forEach((bot, k) => {
      if (!bot.say) return
      const text = ` ${bot.say} `
      const col = Math.max(0, Math.min(poses[k].x, x - 1 - text.length))
      canvas.label(col, STAGE_ROWS - 1, text, INK, PAPER)
    })
  }
}
