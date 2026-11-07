// DataForSEO Agent: the crew's SEO quest, a little side-scrolling level in the style of the claude-seo README
// scenes. Daniel's three minions walk in a line across result-page platforms, hop the gaps between them and
// collect click coins. On the way they fix what they meet: a 404 ghost gets caught in a sitemap net, the slow LCP
// snail gets stomped, a "NO SCHEMA" sign turns into "SCHEMA ✓", the robots.txt gate lifts for them. Every fix moves
// the site's rank up (#48 toward #1), and reaching #1 sets off fireworks before a new site starts.
//
// Interaction: click anywhere and the crew jumps in a wave; click a bot for a backflip and a tip; click a monster,
// a sign or a coin and the crew deals with it right away. In a chat, the level follows the agent: searches walk
// SERP pages, keyword calls rain coins, backlink calls cross chain bridges, crawls meet more 404 ghosts, map calls
// collect pins and charts climb stairs. Waiting on your YES or the budget stops the crew with a speech bubble.
// Stateful: the component steps it about 30 times a second.
import { PixelCanvas, type Cell } from "./bots"

/** Text rows of the home strip (16 pixels): a HUD row, room to jump, and the level. */
export const HOME_ROWS = 7
/** Text rows of the chat strip above the prompt (12 pixels). */
export const CHAT_ROWS = 7
/** Columns one bot takes. */
const BW = 5

export const TIPS = [
  'Try: top 10 Google results for "best crm"',
  "Paid calls show their price and wait for your YES",
  "Ask what a check costs before running it",
  "Ask for a rank distribution or a keyword overlap",
  "/help lists every command",
  "shift+tab switches agents",
  "ctrl+x b shows or hides the chats",
  "Charts open full screen, sort and save as CSV",
]

const INK = "#1a1c2c"
const LASER = "#ff3b5c"
const PAPER = "#ffffff"
const FIRE = ["#ffd166", "#ff9f1c", "#ef476f"]
const SPARK = ["#ffffff", "#ffd166", "#8fd3ff", "#7ED957"]
// The level: result pages as platforms (as in the claude-seo scenes), coins, a night sky.
const CARD_TOP = "#f2f5f9"
const CARD_EDGE = "#b9c3d1"
const RESULT = "#4f8ff0"
const COIN = "#f6c21c"
const COIN_DARK = "#b8860b"
const STAR = "#2c3458"
const GOOD = "#7ED957"
const BAD = "#ef476f"

// Daniel's minions from his profile kit (ui/bots.ts), kept as drawn: a rounded head, a white shine at the top
// left, two dark eyes, feet, and bar heights rising like the logo (red short, yellow medium, green tall). Only the
// body is shorter, so they fit a small strip. c body, s shine, e eye, f feet, r laser.
const COLORS = [
  { c: "#F44336", s: "#ffffff", e: INK, f: "#922820", r: LASER },
  { c: "#FFC107", s: "#ffffff", e: INK, f: "#997404", r: LASER },
  { c: "#7ED957", s: "#ffffff", e: INK, f: "#4C8234", r: LASER },
]
export type Eyes = "ahead" | "closed" | "laser"
// Two eyes always on columns 1 and 3, as drawn; an eye on the edge breaks the outline, so they only blink or glow.
const EYES: Record<Eyes, string> = { ahead: "cecec", closed: "ccccc", laser: "crcrc" }
/** A minion sprite: bot 0, 1 or 2 (5, 6 and 7 pixels tall), its eyes, and the walk step. */
export function minion(bot: number, eyes: Eyes, step: number) {
  return [".ccc.", "csccc", EYES[eyes], ...Array<string>(bot + 1).fill("ccccc"), step ? ".f.f." : "f...f"]
}
export const MINION_COLORS = COLORS
/** Turn a sprite a quarter turn clockwise `q` times (for backflips). */
export function rotate(rows: readonly string[], q: number): string[] {
  let out = [...rows]
  for (let k = 0; k < ((q % 4) + 4) % 4; k++) {
    const h = out.length
    const w = out[0].length
    out = Array.from({ length: w }, (_, r) => Array.from({ length: h }, (_, c) => out[h - 1 - c][r]).join(""))
  }
  return out
}

// What the crew meets. g ghost, k ink, s shell, b body, e eye, p pin, w white.
const GHOST = [".ggg.", "ggggg", "gkgkg", "ggggg", "g.g.g"]
const SNAIL = [".sss..", "ssbss.", "sbsbs.", "eeeeee"]
const PIN = [".pp.", "pwwp", ".pp.", "..p."]
const SPRITES: Record<string, Record<string, string>> = {
  ghost: { g: "#c9d1e0", k: INK },
  snail: { s: "#e0a040", b: "#8a5a1a", e: "#9bd17a" },
  pin: { p: "#ef476f", w: PAPER },
}

/** The level theme, from what the agent is doing (or "seo" on the home screen). */
export type Theme = "seo" | "search" | "keywords" | "links" | "maps" | "crawl" | "chart" | "data"
// The road is DataForSEO's API: every page the crew walks is a real endpoint, written under the floor, and the
// level is named after its API. Each endpoint brings what it finds: On-Page crawls meet 404 ghosts, Lighthouse
// the slow LCP snail, microdata a missing schema sign, LLM mentions the robots.txt gate that keeps AI bots out,
// Business Data and Maps a local pin; keyword and data endpoints rain result coins.
type Endpoint = { path: string; name: string; thing?: Thing["kind"]; coins: number }
const API: Record<string, Endpoint> = {
  serp: { path: "/v3/serp/google/organic/live/advanced", name: "SERP API", coins: 4 },
  maps: { path: "/v3/serp/google/maps/live/advanced", name: "SERP MAPS", thing: "pin", coins: 2 },
  volume: { path: "/v3/keywords_data/google_ads/search_volume/live", name: "KEYWORDS DATA", coins: 6 },
  ideas: { path: "/v3/dataforseo_labs/google/keyword_ideas/live", name: "LABS", coins: 6 },
  trends: { path: "/v3/keywords_data/google_trends/explore/live", name: "TRENDS", coins: 5 },
  backlinks: { path: "/v3/backlinks/summary/live", name: "BACKLINKS", coins: 3 },
  onpage: { path: "/v3/on_page/task_post", name: "ON-PAGE", thing: "ghost", coins: 2 },
  lighthouse: { path: "/v3/on_page/lighthouse/live/json", name: "LIGHTHOUSE", thing: "snail", coins: 2 },
  microdata: { path: "/v3/on_page/microdata", name: "ON-PAGE SCHEMA", thing: "sign", coins: 2 },
  llm: { path: "/v3/ai_optimization/llm_mentions/search/live", name: "AI OPTIMIZATION", thing: "gate", coins: 2 },
  business: { path: "/v3/business_data/google/my_business_info/live", name: "BUSINESS DATA", thing: "pin", coins: 2 },
  domain: { path: "/v3/domain_analytics/technologies/domain_technologies/live", name: "DOMAIN ANALYTICS", coins: 4 },
  content: { path: "/v3/content_analysis/search/live", name: "CONTENT ANALYSIS", coins: 4 },
  merchant: { path: "/v3/merchant/google/products/task_post", name: "MERCHANT", coins: 4 },
}
const LEVELS: Record<Theme, string[]> = {
  seo: ["serp", "onpage", "ideas", "lighthouse", "backlinks", "microdata", "maps", "llm", "volume", "domain"],
  search: ["serp", "lighthouse", "serp", "microdata", "maps"],
  keywords: ["ideas", "volume", "trends", "microdata"],
  links: ["backlinks", "onpage", "backlinks", "llm"],
  maps: ["maps", "business", "lighthouse", "maps"],
  crawl: ["onpage", "lighthouse", "microdata", "onpage", "llm"],
  chart: ["trends", "ideas", "serp", "volume"],
  data: ["domain", "content", "merchant", "onpage", "lighthouse"],
}

type Ground = { x0: number; x1: number; top: number; chain?: boolean; tag?: string; path?: string }
type Thing = { kind: "coin" | "ghost" | "snail" | "sign" | "gate" | "pin"; x: number; y: number; done?: number }
type Bot = { id: number; y: number; vy: number; flip?: number; say?: string; sayUntil: number; laserUntil: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; gravity: number }
type Shot = { x: number; y: number; target: Thing }
type Float = { x: number; y: number; text: string; fg: string; until: number }

// A small seeded random source (mulberry32), so tests can replay a level.
function random(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GRAVITY = 90

export class HomeCrew {
  time = 0
  /** The site's rank, #48 down to #1, and the clicks the coins brought in. */
  rank = 48
  clicks = 0
  fixes = 0
  private readonly H: number
  /** Jump speed: lower on the short chat strip so heads stay in view. */
  private readonly jumpV: number
  private scroll = 0
  private speed = 19
  private theme: Theme = "seo"
  private mood?: string
  private grounds: Ground[] = []
  private things: Thing[] = []
  private end = 0
  private level = 0
  private banner?: { text: string; until: number }
  private bots: Bot[]
  private particles: Particle[] = []
  private shots: Shot[] = []
  private floats: Float[] = []
  private celebrate?: number
  private tip: number
  private next: () => number
  private pointer?: number
  private pointedAt = 0

  constructor(
    private width: number,
    seed = Date.now(),
    rows = HOME_ROWS,
  ) {
    this.H = rows * 2
    this.jumpV = -25
    this.next = random(seed)
    this.tip = Math.floor(this.next() * TIPS.length)
    // A long first platform so the crew starts on solid ground.
    this.grounds.push({ x0: -20, x1: Math.max(40, Math.round(width * 0.55)), top: this.low() })
    this.end = this.grounds[0].x1
    this.build()
    this.bots = [0, 1, 2].map((id) => ({ id, y: this.low(), vy: 0, sayUntil: 0, laserUntil: 0 }))
  }

  resize(width: number) {
    this.width = width
    this.build()
  }

  // Platform tops: low and high ledges, leaving room overhead for the HUD row and a jump.
  // The floor leaves the last text row free for the endpoint written under it.
  private low() {
    return this.H - 3
  }
  // A small step up on the home strip; the shorter chat strip stays flat (gaps only), so jumps never leave it.
  private high() {
    return this.H - 4
  }
  private pick<T>(items: readonly T[]) {
    return items[Math.floor(this.next() * items.length) % items.length]
  }
  /** Where the leader (green, at the front) walks, in world pixels. */
  private lead() {
    return this.scroll + Math.max(BW * 3 + 12, Math.round(this.width * 0.3))
  }
  /** Each bot's world x: red at the back, yellow, green leading, one pixel apart. */
  private botX(id: number) {
    return this.lead() - (2 - id) * (BW + 4)
  }

  /** Extend the level past the right edge: a gap (or a chain bridge), then a page with one thing to fix. */
  private build() {
    while (this.end < this.scroll + this.width + 60) {
      const links = this.theme === "links"
      const gap = 4 + Math.floor(this.next() * 3)
      const climb = this.theme === "chart"
      const last = this.grounds[this.grounds.length - 1]
      const top = climb
        ? Math.max(this.high() - 1, last.top - 2 < this.high() - 1 ? this.low() : last.top - 2)
        : this.next() < 0.45
          ? this.high()
          : this.low()
      const x0 = this.end + gap
      const length = 40 + Math.floor(this.next() * 30)
      const levels = LEVELS[this.theme]
      const api = API[levels[this.level % levels.length]]
      this.level++
      const ground: Ground = { x0, x1: x0 + length, top, tag: `LV${this.level} ${api.name}`, path: api.path }
      // On the backlinks level the gaps are chain bridges, walked like any page.
      if (links) this.grounds.push({ x0: this.end, x1: x0, top: last.top, chain: true })
      this.grounds.push(ground)
      this.end = ground.x1
      this.place(ground, api)
    }
    this.grounds = this.grounds.filter((g) => g.x1 > this.scroll - 20)
    this.things = this.things.filter((t) => t.x > this.scroll - 20 || (t.done === undefined && t.kind === "snail"))
  }

  /** What stands on an endpoint's page: the thing its API finds, and result coins in an arc. */
  private place(ground: Ground, api: Endpoint) {
    const at = ground.x0 + 10 + Math.floor(this.next() * (ground.x1 - ground.x0 - 20))
    if (api.thing) this.things.push({ kind: api.thing, x: at, y: ground.top })
    const start = api.thing ? at + 9 : ground.x0 + 8
    for (let i = 0; i < api.coins && start + i * 4 < ground.x1 - 2; i++)
      this.things.push({ kind: "coin", x: start + i * 4, y: ground.top - 4 - (i % 3 === 1 ? 2 : 0) })
  }

  /** The highest page top under columns x..x+w (world pixels), or undefined over a gap. */
  private surface(x: number, w = BW) {
    const tops = this.grounds.filter((g) => g.x0 <= x + w - 2 && g.x1 > x + 1).map((g) => g.top)
    return tops.length ? Math.min(...tops) : undefined
  }

  /**
   * In a chat, follow what the agent is doing: the level theme comes from the tool, the crew slows down while
   * thinking, and stops with a speech bubble while waiting on your YES or the budget. A finished turn celebrates.
   */
  setMood(scene: string | undefined) {
    if (scene === this.mood) return
    this.mood = scene
    const themes: Record<string, Theme> = {
      search: "search",
      keywords: "keywords",
      links: "links",
      maps: "maps",
      crawl: "crawl",
      chart: "chart",
      data: "data",
      error: "crawl",
    }
    if (scene && themes[scene]) this.theme = themes[scene]
    const talker = this.bots[1]
    talker.say = undefined
    if (scene === "permission") this.say(talker, "Waiting for your YES", 600)
    if (scene === "budget") this.say(talker, "Session budget reached", 600)
    if (scene === "thinking") this.say(talker, "Thinking…", 1.8)
    if (scene === "done") {
      this.wave(true)
      this.float(this.lead() - 6, this.H - 9, "Done ✓", GOOD, 2)
    }
  }

  private target() {
    if (this.mood === "permission" || this.mood === "budget") return 0
    if (this.mood === "thinking") return 9
    return 19
  }

  /** Advance by `dt` seconds. */
  step(dt: number) {
    this.time += dt
    // The robots.txt gate lifts as the crew comes near, so nobody stops mid jump.
    const gate = this.things.find((t) => t.kind === "gate" && t.done === undefined && t.x - this.lead() < 14)
    if (gate) this.fix(gate)
    this.speed += (this.target() - this.speed) * Math.min(1, dt * 3)
    this.scroll += this.speed * dt
    this.build()
    this.stepBots(dt)
    this.stepThings(dt)
    this.stepEffects(dt)
    if (this.banner && this.banner.until < this.time) this.banner = undefined
  }

  private stepBots(dt: number) {
    for (const bot of this.bots) {
      const x = this.botX(bot.id)
      const ground = this.surface(x)
      const feet = bot.y
      const standing = ground !== undefined && bot.vy >= 0 && Math.abs(feet - ground) < 0.6
      if (standing && this.speed > 0.5) {
        // Hop over a gap or up a step a few pixels ahead, and over a snail nobody has stomped yet.
        const ahead = this.surface(x + 3)
        const snail = this.things.some((t) => t.kind === "snail" && t.done === undefined && t.x - x > 2 && t.x - x < 8)
        if (ahead === undefined || ahead < ground - 0.5 || snail) bot.vy = this.jumpV
      }
      bot.vy += GRAVITY * dt
      bot.y += bot.vy * dt
      const floor = this.surface(x)
      // Land on a page, or scramble up its edge when a jump came up a little short.
      if (floor !== undefined && bot.vy >= 0 && bot.y >= floor && feet <= floor + 3.5) {
        bot.y = floor
        bot.vy = 0
        if (bot.flip !== undefined) bot.flip = undefined
      }
      // A fall into a gap: back on the page next to the leader, with a puff of dust.
      if (bot.y > this.H + 8) {
        bot.y = this.high() - 4
        bot.vy = 0
        this.burst(x + 2, this.high() - 2, 8, ["#9aa4b5", "#c9d1e0"], 6)
      }
      if (bot.say && bot.sayUntil <= this.time) bot.say = undefined
    }
    // A new page under the leader shows its level banner.
    const page = this.grounds.find((g) => !g.chain && g.tag && g.x0 <= this.lead() + 2 && g.x1 > this.lead() + 2)
    if (page?.tag && !page.tag.startsWith("seen:")) {
      this.banner = { text: `LEVEL ${page.tag.split(" ")[0].slice(2)} · ${page.tag.split(" ").slice(1).join(" ")}`, until: this.time + 2.2 }
      page.tag = `seen:${page.tag}`
    }
  }

  private stepThings(dt: number) {
    for (const thing of this.things) {
      if (thing.done !== undefined) continue
      if (thing.kind === "snail") thing.x -= 1.2 * dt
      if (thing.kind === "ghost" && thing.x - this.lead() < 12) this.fix(thing)
      if (thing.kind === "sign" && thing.x <= this.lead() + 2) this.fix(thing)
      // Coins, pins and snails meet the bots' bodies.
      if (thing.kind === "coin" || thing.kind === "pin" || thing.kind === "snail")
        for (const bot of this.bots) {
          const x = this.botX(bot.id)
          const height = 5 + bot.id
          const w = thing.kind === "snail" ? 6 : thing.kind === "pin" ? 4 : 2
          const h = thing.kind === "snail" ? 4 : thing.kind === "pin" ? 4 : 2
          const top = thing.kind === "coin" ? thing.y : thing.y - h
          if (x + BW > thing.x && x < thing.x + w && bot.y > top && bot.y - height < top + h) {
            if (thing.kind === "snail") bot.vy = -16
            this.fix(thing)
            break
          }
        }
    }
    this.things = this.things.filter((t) => t.done === undefined || this.time - t.done < 1.5)
  }

  /** Deal with a thing: collect it, catch it, stomp it, fix it or open it. The rank goes up for every fix. */
  private fix(thing: Thing) {
    if (thing.done !== undefined) return
    thing.done = this.time
    const sx = thing.x
    if (thing.kind === "coin") {
      this.clicks += 60
      this.float(sx - 2, thing.y - 2, "+60", COIN, 0.8)
      this.burst(sx + 1, thing.y + 1, 4, [COIN, PAPER], 5)
      return
    }
    const text = {
      ghost: "404 MAPPED",
      snail: "LCP 2.1s ✓",
      sign: "+rich results",
      gate: "Allow: /",
      pin: "+1 local",
    }[thing.kind]
    this.float(sx - Math.floor(text.length / 2), thing.y - 9, text, GOOD, 1.6)
    if (thing.kind === "ghost") this.burst(sx + 2, thing.y - 7, 14, ["#c9d1e0", PAPER, RESULT], 10)
    if (thing.kind === "snail") this.burst(sx + 3, thing.y - 2, 10, ["#e0a040", PAPER], 8)
    if (thing.kind === "pin") this.burst(sx + 2, thing.y - 3, 10, [BAD, PAPER], 8)
    this.fixes++
    this.rank = Math.max(1, this.rank - (this.rank > 12 ? 5 + Math.floor(this.next() * 5) : 1 + Math.floor(this.next() * 3)))
    if (this.rank === 1 && this.celebrate === undefined) {
      this.celebrate = this.time
      this.wave(true)
    }
  }

  private stepEffects(dt: number) {
    // Fireworks while the site holds #1, then a fresh site.
    if (this.celebrate !== undefined) {
      if (Math.floor((this.time - this.celebrate) / 0.35) !== Math.floor((this.time - dt - this.celebrate) / 0.35))
        this.burst(this.scroll + 6 + this.next() * (this.width - 12), 2 + this.next() * 4, 16, [...SPARK, ...FIRE], 14)
      if (this.time - this.celebrate > 3.5) {
        this.celebrate = undefined
        this.rank = 48
        this.fixes = 0
      }
    }
    // Fireballs (from a click on a monster) fly to their target.
    this.shots = this.shots.filter((shot) => {
      shot.x += 40 * dt
      this.particles.push({ x: shot.x - 1.5, y: shot.y, vx: 0, vy: -3, life: 0.18, color: this.pick(FIRE), gravity: 0 })
      if (shot.x < shot.target.x) return true
      this.fix(shot.target)
      return false
    })
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += p.gravity * dt
      p.life -= dt
      return p.life > 0 && p.y < this.H + 1
    })
    this.floats = this.floats.filter((f) => f.until > this.time)
  }

  private say(bot: Bot, text: string, seconds = 2.5) {
    bot.say = text
    bot.sayUntil = this.time + seconds
  }
  private float(x: number, y: number, text: string, fg: string, seconds = 1.4) {
    this.floats.push({ x, y, text, fg, until: this.time + seconds })
  }
  private burst(x: number, y: number, count: number, colors: readonly string[], speed: number) {
    for (let i = 0; i < count; i++) {
      const a = this.next() * Math.PI * 2
      const v = speed * (0.4 + this.next() * 0.8)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v * 1.6,
        vy: Math.sin(a) * v - 6,
        life: 0.5 + this.next() * 0.6,
        color: this.pick(colors),
        gravity: 30,
      })
    }
  }
  /** The crew jumps one after another, back to front; with `flip`, as backflips. */
  private wave(flip = false) {
    // Only bots standing on a page, and only when the landing spot is solid too, so nobody drops into a gap.
    const air = (2 * -this.jumpV) / GRAVITY
    this.bots.forEach((bot) => {
      if (bot.vy !== 0) return
      if (this.surface(this.botX(bot.id) + this.speed * air) === undefined) return
      bot.vy = this.jumpV
      if (flip) bot.flip = this.time
    })
  }

  /** The pointer moved over the strip at column `col`. */
  point(col: number) {
    this.pointer = col
    this.pointedAt = this.time
    // Pointing at a minion makes it hop and look up at you (once per second, so hovering stays calm).
    const bot = this.bots.find((b) => col + this.scroll >= this.botX(b.id) - 1 && col + this.scroll <= this.botX(b.id) + BW)
    if (bot && bot.vy === 0 && this.time - (this.hopped.get(bot.id) ?? -9) > 1) {
      this.hopped.set(bot.id, this.time)
      bot.vy = this.jumpV * 0.6
      this.burst(this.botX(bot.id) + 2, bot.y, 3, SPARK, 4)
    }
  }
  private hopped = new Map<number, number>()

  /**
   * A click at column `col`. On a monster, a sign, a coin or a pin: the crew deals with it ("hit"). On a bot: a
   * backflip and sometimes a tip ("flip"). Anywhere else: the whole crew jumps ("jump").
   */
  poke(col: number): string {
    this.point(col)
    const x = col + this.scroll
    const thing = this.things.find(
      (t) => t.done === undefined && x >= t.x - 1 && x <= t.x + (t.kind === "coin" ? 2 : 6) && t.x > this.lead(),
    )
    if (thing) {
      const shooter = this.bots[2]
      shooter.laserUntil = this.time + 0.3
      this.shots.push({ x: this.botX(2) + BW, y: shooter.y - 5, target: thing })
      return "hit"
    }
    const bot = this.bots.find((b) => x >= this.botX(b.id) - 1 && x <= this.botX(b.id) + BW)
    if (bot) {
      bot.vy = this.jumpV - 4
      bot.flip = this.time
      this.burst(this.botX(bot.id) + 2, bot.y, 6, SPARK, 6)
      if (this.next() < 0.6) this.say(bot, TIPS[this.tip++ % TIPS.length], 3.5)
      return "flip"
    }
    this.wave()
    return "jump"
  }

  /** Each bot's screen column, lift above its page in pixels, rotation (quarter turns) and eyes, for tests. */
  poses() {
    return this.bots.map((bot) => {
      const x = Math.round(this.botX(bot.id) - this.scroll)
      const ground = this.surface(this.botX(bot.id)) ?? this.low()
      const turn = bot.flip !== undefined ? -Math.min(4, Math.floor(((this.time - bot.flip) / 0.7) * 4)) : 0
      const blink = (this.time + bot.id * 1.3) % 3.7 < 0.15
      const eyes: Eyes = bot.laserUntil > this.time ? "laser" : blink ? "closed" : "ahead"
      return {
        x,
        lift: Math.round(ground - bot.y),
        turn,
        eyes,
        step: bot.vy === 0 && this.speed > 0.5 ? Math.floor((this.scroll + bot.id) / 1.5) % 2 : 0,
      }
    })
  }

  frame(): Cell[][] {
    const canvas = new PixelCanvas(this.width, this.H)
    const sx = (x: number) => Math.round(x - this.scroll)
    // A quiet starry sky, drifting slower than the level.
    for (let k = 0; k < this.width / 9; k++) {
      const x = Math.round((((k * 37) % 997) * 7 - this.scroll * 0.3) % this.width + this.width) % this.width
      canvas.dot(x, (k * 5) % Math.max(2, this.high() - 3), STAR)
    }
    this.drawLevel(canvas, sx)
    this.drawThings(canvas, sx)
    // The crew.
    const poses = this.poses()
    poses.forEach((pose, i) => {
      const bot = this.bots[i]
      const rows = rotate(minion(i, pose.eyes, pose.step), pose.turn)
      canvas.sprite(rows, COLORS[i], pose.x + Math.floor((BW - rows[0].length) / 2), Math.round(bot.y) - rows.length)
    })
    this.shots.forEach((shot) => {
      canvas.dot(sx(shot.x), shot.y, FIRE[0])
      canvas.dot(sx(shot.x) - 1, shot.y, FIRE[1])
    })
    this.particles.forEach((p) => canvas.dot(sx(p.x), p.y, p.color))
    this.drawText(canvas, sx, poses)
    return canvas.rows()
  }

  private drawLevel(canvas: PixelCanvas, sx: (x: number) => number) {
    // A thin floor: one bright line per page, chain links over the backlink bridges, nothing below.
    for (const g of this.grounds) {
      const a = Math.max(0, sx(g.x0))
      const b = Math.min(this.width, sx(g.x1))
      for (let x = a; x < b; x++) canvas.dot(x, g.top, g.chain ? (x % 3 === 2 ? "" : "#9aa4b5") : x === sx(g.x0) ? CARD_EDGE : CARD_TOP)
      // The endpoint, written under its stretch of road (cut to fit), like a street name.
      if (g.path && sx(g.x0) + 1 < this.width) {
        const room = sx(g.x1) - Math.max(0, sx(g.x0) + 1) - 1
        const text = g.path.length <= room ? g.path : room > 6 ? g.path.slice(0, room - 1) + "…" : ""
        if (text && sx(g.x0) + 1 >= -g.path.length) {
          const start = sx(g.x0) + 1
          const shown = start >= 0 ? text : g.path.slice(-start, -start + room)
          if (shown) canvas.label(Math.max(0, start), this.H / 2 - 1, shown, "#6f86b3", "")
        }
      }
    }
  }

  private drawThings(canvas: PixelCanvas, sx: (x: number) => number) {
    for (const t of this.things) {
      const x = sx(t.x)
      if (x < -8 || x > this.width + 2) continue
      const age = t.done === undefined ? undefined : this.time - t.done
      if (t.kind === "coin") {
        if (age !== undefined) continue
        // A spinning coin: full, then edge on.
        const thin = Math.floor(this.time * 4 + t.x) % 4 === 0
        canvas.dot(x, t.y, COIN)
        canvas.dot(x, t.y + 1, COIN_DARK)
        if (!thin) {
          canvas.dot(x + 1, t.y, PAPER)
          canvas.dot(x + 1, t.y + 1, COIN)
        }
      }
      if (t.kind === "ghost") {
        const y = t.y - 7 + Math.round(Math.sin(this.time * 4 + t.x))
        if (age === undefined || age < 0.5) canvas.sprite(GHOST, SPRITES.ghost, x, y)
        // The sitemap net drops over it once the crew is close.
        if (age !== undefined && age < 0.6)
          for (let k = -1; k <= 5; k++)
            for (let j = -1; j <= 5; j++) if (k % 2 === 1 || j % 2 === 1) canvas.dot(x + k, y + j, RESULT)
        if (age === undefined) canvas.label(x, Math.floor((y - 2) / 2), "404", BAD, "")
      }
      if (t.kind === "snail") {
        if (age === undefined) {
          canvas.sprite(SNAIL, SPRITES.snail, x, t.y - SNAIL.length)
          canvas.label(x - 1, Math.floor((t.y - 7) / 2), "LCP 4.8s", "#e0a040", "")
        }
        // Squashed flat for a moment.
        if (age !== undefined && age < 0.5) for (let k = 0; k < 6; k++) canvas.dot(x + k, t.y - 1, "#e0a040")
      }
      if (t.kind === "sign") {
        for (let y = t.y - 4; y < t.y; y++) canvas.dot(x + 1, y, "#9aa4b5")
        const ok = age !== undefined
        const text = ok ? " SCHEMA ✓ " : " NO SCHEMA "
        canvas.label(x - Math.floor(text.length / 2) + 1, Math.floor((t.y - 6) / 2), text, ok ? INK : PAPER, ok ? GOOD : BAD)
      }
      if (t.kind === "gate") {
        // robots.txt: bars that lift once the crew arrives.
        const lift = age === undefined ? 0 : Math.min(8, Math.round(age * 14))
        for (let k = 0; k < 6; k++)
          for (let y = t.y - 8; y < t.y - lift; y++) if (k % 2 === 0) canvas.dot(x + k, y, "#9aa4b5")
        for (let k = 0; k < 6; k++) canvas.dot(x + k, t.y - 9 - lift, "#c9d1e0")
        if (age === undefined) canvas.label(x - 2, Math.floor((t.y - 11) / 2), "robots.txt", "#9aa4b5", "")
      }
      if (t.kind === "pin" && age === undefined)
        canvas.sprite(PIN, SPRITES.pin, x, t.y - PIN.length - Math.round(Math.abs(Math.sin(this.time * 3))))
    }
  }

  private drawText(canvas: PixelCanvas, sx: (x: number) => number, poses: ReturnType<HomeCrew["poses"]>) {
    // The HUD on the top row: the site's rank with its fix pips, and the clicks the coins earned.
    const pips = Array.from({ length: 5 }, (_, k) => (k < this.fixes % 6 ? "■" : "□")).join("")
    const hud = `RANK #${this.rank}  ${pips}  ${this.clicks.toLocaleString("en-US")} clicks`
    if (this.width >= hud.length + 4) {
      const x = this.width - hud.length - 1
      canvas.label(x, 0, `RANK #${this.rank}`, this.rank === 1 ? GOOD : COIN, "")
      canvas.label(x + 7 + String(this.rank).length + 2, 0, pips, GOOD, "")
      canvas.label(this.width - 1 - `${this.clicks.toLocaleString("en-US")} clicks`.length, 0, `${this.clicks.toLocaleString("en-US")} clicks`, "#9aa4b5", "")
    }
    // Pointing at something says what it is and what a click does; otherwise the level banner shows.
    const hovered =
      this.pointer === undefined || this.time - this.pointedAt > 2.5
        ? undefined
        : this.things.find((t) => t.done === undefined && sx(t.x) - 1 <= this.pointer! && sx(t.x) + 6 >= this.pointer!)
    const hint = hovered
      ? {
          coin: "Click coin: +60 clicks",
          ghost: "404 page: click to map it",
          snail: "Slow LCP: click to speed it up",
          sign: "Missing schema: click to add it",
          gate: "robots.txt blocks AI bots: click to open",
          pin: "Local pin: click to claim it",
        }[hovered.kind]
      : undefined
    if (hint && this.width >= 40) canvas.label(1, 0, hint, PAPER, "")
    else if (this.banner && this.width >= 40) canvas.label(1, 0, this.banner.text, "#e0a040", "")
    if (this.celebrate !== undefined) {
      const text = " #1 ON GOOGLE! "
      canvas.label(Math.max(0, Math.floor((this.width - text.length) / 2)), 1, text, INK, COIN)
    }
    this.floats.forEach((f) => {
      const row = Math.max(0, Math.floor(f.y / 2) - (f.until - this.time < 0.5 ? 1 : 0))
      canvas.label(Math.max(0, Math.min(this.width - f.text.length, sx(f.x))), row, f.text, f.fg, "")
    })
    this.bots.forEach((bot, i) => {
      if (!bot.say) return
      const text = ` ${bot.say} `
      const right = poses[i].x + BW + 1
      const x = right + text.length <= this.width ? right : Math.max(0, poses[i].x - text.length - 1)
      canvas.label(x, Math.max(0, Math.floor((bot.y - 8 - bot.id) / 2) - 1), text, INK, PAPER)
    })
  }
}
