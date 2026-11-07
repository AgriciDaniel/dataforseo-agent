// DataForSEO Agent: the small session crew. While a turn runs, one to three little bots appear at the end of the
// transcript (or walk along the row under it) and act out what the agent is doing: searching, gathering keywords,
// following links, pinning a map, crawling a site, waiting on your YES, drawing a chart. Each turn picks its own
// spot, entry side, cast and variant from a seed, so the crew turns up in a different place every time but never
// jumps around inside one turn.
import { BOTS, PixelCanvas, type Cell } from "./bots"

/** What the crew acts out. The tool scenes follow the DataForSEO API the running call goes to. */
export type Scene =
  | "thinking"
  | "search"
  | "keywords"
  | "links"
  | "maps"
  | "crawl"
  | "data"
  | "permission"
  | "chart"
  | "budget"
  | "error"
  | "done"

export const SCENES: Scene[] = [
  "thinking",
  "search",
  "keywords",
  "links",
  "maps",
  "crawl",
  "data",
  "permission",
  "chart",
  "budget",
  "error",
  "done",
]

/** Where the crew shows up: on the stage at the end of the transcript (left, centre, right or peeking in at the
 * right edge), or as micro bots on the one row rail under the transcript. */
export type Spot = "left" | "centre" | "right" | "peek" | "rail"

export type Stage = {
  spot: Spot
  /** Bot indices into BOTS, the lead first. */
  cast: number[]
  /** The side they walk in from and leave to: -1 left, 1 right. */
  side: -1 | 1
  variant: number
}

/** Text rows of the stage and the rail. */
export const STAGE_ROWS = 7
export const RAIL_ROWS = 1

/** Seconds each one shot scene lasts after the turn: the wave goodbye, and the bow at a budget stop. */
export const AFTER_TURN = { done: 1.6, budget: 3 } as const

/** Seconds the bots take to walk in when the stage first appears, and to glide between two scenes. */
export const ENTER_TIME = 0.9
export const GLIDE_TIME = 0.35

/** The still pose for each scene when animations are off. */
export const STILL: Record<Scene, number> = {
  thinking: 0.6,
  search: 0.8,
  keywords: 1.5,
  links: 0.6,
  maps: 1.6,
  crawl: 0.8,
  data: 0.6,
  permission: 0,
  chart: 1.4,
  budget: 1.2,
  error: 0.15,
  done: 0.25,
}

const INK = "#1a1c2c"
const RING = "#d0d4dc"
const RIM = "#8a93a8"
const LENS = "#8fd3ff"
const GLINT = "#ffffff"
const METAL = "#5a5f73"
const GLASS = "#ffe08a"
const FLAME = ["#ffb347", "#fff3c4"]
const GLOW = ["#ffe08a", "#ffb347"]
const CRATE = ["#d39a5e", "#b07a45", "#7a4f2a"]
const PUFF = ["#b8bccb", "#8a8fa3"]
const PIN = "#F44336"
const PAPER = "#ffffff"

// A tiny seeded random source (mulberry32), so a turn's stage is the same on every frame.
function random(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
  let a = (h << 13) | (h >>> 19)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The stage for one turn. `stage: false` (a short or narrow terminal) keeps the crew on the rail. */
export function pickStage(seed: string, room: { stage: boolean } = { stage: true }): Stage {
  const next = random(seed)
  const weighted = <T,>(items: [T, number][]) => {
    let roll = next() * items.reduce((sum, [, weight]) => sum + weight, 0)
    for (const [item, weight] of items) if ((roll -= weight) < 0) return item
    return items[items.length - 1][0]
  }
  const spot: Spot = room.stage
    ? weighted<Spot>([
        ["left", 2],
        ["centre", 2],
        ["right", 2],
        ["peek", 1],
        ["rail", 2],
      ])
    : "rail"
  const order = [0, 1, 2].sort(() => next() - 0.5)
  const size = spot === "peek" ? 1 : weighted<number>([[3, 5], [2, 3], [1, 2]])
  return {
    spot,
    cast: order.slice(0, size),
    side: spot === "right" || spot === "peek" ? 1 : spot === "left" ? -1 : next() < 0.5 ? -1 : 1,
    variant: Math.floor(next() * 2),
  }
}

type Eyes = "ahead" | "left" | "right" | "closed"
/** One bot's pose. `x` is its left column; `lean` bows the head that way (-1 left, 1 right). */
export type Pose = { x: number; lift?: number; eyes?: Eyes; step?: number; lean?: number; head?: number }

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const clamp = (t: number) => Math.max(0, Math.min(1, t))
const hop = (t: number, start: number, length: number, height: number) =>
  t >= start && t < start + length ? Math.round(Math.sin(Math.PI * ((t - start) / length)) * height) : 0
const look = (dir: number): Eyes => (dir < 0 ? "left" : "right")

// The bar bots from ui/bots.ts, redrawn smaller: the same rounded head, shine pixel and two eyes, on bodies that
// rise like the logo's three bars (6, 8 and 10 pixels tall, feet included).
const SPRITE = (i: number, step: number) => [
  ".ccc.",
  "csccc",
  "cecec",
  ...Array<string>([2, 4, 6][i]).fill("ccccc"),
  step ? ".f.f." : "f...f",
]
const HEAD = 3
const EYE_ROW = 2
const WIDTH = 5
/** Columns one small bot takes. */
export const BOT_WIDTH = WIDTH
const GAP = 7
// Looking aside shows one eye in profile; closed eyes are lids in the darker foot color.
const EYES: Record<Eyes, string> = { ahead: "cecec", left: "ceccc", right: "cccec", closed: "cfcfc" }

// Pixel props, drawn from a map of keys to colors like the sprites.
const MAGNIFIER = [".rrr.", "rLLLr", "rLgLr", "rLLLr", ".rrr."]
const LANTERN = [".h.", "h.h", "mmm", "GFG", "GFG", "mmm"]
const LINK = [".rrr.sss.", "r...x...s", ".rrr.sss."]
const CRATE_ROWS = ["tttt", "bkkb", "dddd"]
const PIN_ROWS = [".ppp.", "ppwpp", "ppppp", ".ppp.", "..p..", "..d.."]
const CLOUD = [
  ["..", ".a"],
  [".aa.", "abba", ".aa."],
  [".aaa.", "abbba", "aabaa", ".aaa."],
]

/** Columns the group takes, and its home column for the spot. */
function layout(stage: Stage, width: number) {
  const group = WIDTH + (stage.cast.length - 1) * GAP
  const home = {
    left: 2,
    centre: Math.floor((width - group) / 2),
    right: width - group - 2,
    peek: width - 3,
    rail: 1,
  }[stage.spot]
  // How far the walking scenes may roam from home, and which way the open floor lies.
  const lane = {
    left: [home, Math.min(width - group - 2, home + 22)],
    centre: [Math.max(2, home - 11), Math.min(width - group - 2, home + 11)],
    right: [Math.max(2, home - 22), home],
    peek: [home, home],
    rail: [home, Math.max(home, width - group - 2)],
  }[stage.spot]
  const facing = stage.spot === "right" || stage.spot === "peek" ? -1 : 1
  return { group, home, lane: { min: lane[0], max: Math.max(lane[0], lane[1]) }, facing }
}

// Ping pong along the lane at `speed` columns a second, starting at home: the group's left column and heading.
function patrol(t: number, home: number, lane: { min: number; max: number }, speed: number, facing: number) {
  const length = lane.max - lane.min
  if (length <= 0) return { x: home, dir: facing }
  const start = facing > 0 ? home - lane.min : 2 * length - (home - lane.min)
  const u = (((start + t * speed) % (2 * length)) + 2 * length) % (2 * length)
  return u < length ? { x: lane.min + Math.round(u), dir: 1 } : { x: lane.min + Math.round(2 * length - u), dir: -1 }
}

type Props = (canvas: PixelCanvas, poses: Pose[], bottom: number) => void
type Act = { poses: Pose[]; props?: Props }

/** The scene at `t` seconds, before any entrance or glide. Props are drawn before the bots, so a bot always sits
 * in front of a prop and nothing ever covers a face. */
function act(scene: Scene, t: number, stage: Stage, width: number): Act {
  const { home, lane, facing } = layout(stage, width)
  const n = stage.cast.length
  const at = (i: number) => home + i * GAP
  const blink = (i: number) => (t + i * 1.3) % 3.4 < 0.15
  const idle = (i: number, eyes?: Eyes): Pose => ({ x: at(i), eyes: blink(i) ? "closed" : (eyes ?? "ahead") })
  const lead = facing > 0 ? n - 1 : 0
  const all = (fn: (i: number) => Pose) => Array.from({ length: n }, (_, i) => fn(i))
  const tall = (i: number) => SPRITE(stage.cast[i], 0).length
  // Pixel row of a bot's head top, and the first free column past the front of the group.
  const top = (poses: Pose[], i: number, bottom: number) => bottom - tall(i) - (poses[i].lift ?? 0)
  const ahead = (poses: Pose[], gap: number, size: number) =>
    facing > 0 ? poses[n - 1].x + WIDTH + gap : poses[0].x - gap - size
  const toward = (i: number) => look(at(lead) - at(i) || facing)

  switch (scene) {
    case "thinking": {
      if (stage.variant === 0) {
        // A thought bubble over the lead's shoulder fills with dots while everyone bobs in turn.
        const dots = ["·  ", "·· ", "···", "···"][Math.floor(t / 0.45) % 4]
        return {
          poses: all((i) => ({ ...idle(i), lift: Math.sin((2 * Math.PI * t) / 1.6 - i * 0.9) > 0.4 ? 1 : 0 })),
          props: (canvas, poses, bottom) => {
            const x = facing > 0 ? poses[lead].x + WIDTH + 1 : poses[lead].x - 5
            const head = top(poses, lead, bottom)
            canvas.dot(facing > 0 ? x - 1 : x + 4, head - 1, PAPER)
            canvas.label(x, Math.max(0, Math.floor((head - 4) / 2)), ` ${dots} `.slice(0, 4), INK, PAPER)
          },
        }
      }
      // The lead looks one way, then the other, and wonders.
      const glance = Math.floor(t / 1.1) % 3
      const eyes: Eyes = glance === 0 ? "left" : glance === 1 ? "right" : "ahead"
      return {
        poses: all((i) => idle(i, i === lead ? eyes : toward(i))),
        props: (canvas, poses, bottom) =>
          glance === 2 && canvas.label(poses[lead].x + 2, Math.max(0, Math.floor((top(poses, lead, bottom) - 3) / 2)), "?", "#EABD59", ""),
      }
    }

    case "search":
    case "crawl": {
      // Walk the floor, the front bot holding a magnifier (search) or a lantern (crawl) out ahead.
      const { x, dir } = patrol(t, home, lane, 7, facing)
      const step = Math.floor(t * 7) % 2
      return {
        poses: all((i) => ({ x: x + i * GAP, step: (step + i) % 2, eyes: look(dir) })),
        props: (canvas, poses, bottom) => {
          const front = dir > 0 ? n - 1 : 0
          const p = poses[front]
          const head = top(poses, front, bottom)
          if (scene === "search") {
            // A round lens at eye level with a glint, its handle running back to the bot.
            const y = head + EYE_ROW - 2 + (step ? 1 : 0)
            const ring = dir > 0 ? p.x + WIDTH + 1 : p.x - 6
            canvas.sprite(MAGNIFIER, { r: RING, L: LENS, g: GLINT }, ring, y)
            const hand = dir > 0 ? ring - 1 : ring + 5
            canvas.dot(hand, y + 4, RIM)
            canvas.dot(hand - dir, y + 5, RIM)
            return
          }
          // A lantern on a bail handle, held out at chest height, its flame flickering and light on the floor ahead.
          const flicker = Math.floor(t * 6) % 2
          const lamp = dir > 0 ? p.x + WIDTH + 1 : p.x - 4
          const y = Math.min(bottom - 7, head + 1)
          canvas.sprite(LANTERN, { h: RIM, m: METAL, G: GLASS, F: FLAME[flicker] }, lamp, y)
          canvas.dot(dir > 0 ? lamp - 1 : lamp + 3, y + 1, RIM)
          Array.from({ length: 4 }, (_, k) =>
            k < 3 + flicker ? canvas.dot(lamp + 1 + dir * (k + 2), bottom - 1, GLOW[k % 2]) : undefined,
          )
        },
      }
    }

    case "keywords": {
      // The crew sets letter blocks down in a row, spelling the word left to right, one block per hop.
      const word = stage.variant ? "seo" : "key"
      const cycle = 2.6
      const placed = Math.min(3, Math.floor((t % cycle) / 0.6) + 1)
      const turn = Math.floor((t % cycle) / 0.6) % n
      return {
        poses: all((i) => ({ ...idle(i, look(facing)), lift: i === turn ? hop(t % 0.6, 0.05, 0.35, 2) : 0 })),
        props: (canvas, poses, bottom) => {
          const start = ahead(poses, 2, 11)
          Array.from({ length: placed }, (_, k) => {
            const x = start + k * 4
            const color = BOTS[stage.cast[k % n]].pal
            // Each block is 3 columns by 2 rows: the letter on the upper row, a shaded base below.
            canvas.sprite(["ccc", "ccc", "ccc", "fff"], { c: color.c, f: color.f }, x, bottom - 4)
            canvas.label(x + 1, bottom / 2 - 2, word[k], INK, color.c)
          })
        },
      }
    }

    case "links": {
      // A chain link arcs high over the crew from bot to bot, and each one hops as it catches it.
      const pass = 0.7
      const k = Math.floor(t / pass)
      const u = (t % pass) / pass
      const chain = n === 1 ? [0, 0] : [k % n, (k + 1) % n]
      return {
        poses: all((i) => ({ ...idle(i, toward(i)), lift: i === chain[1] ? hop(u, 0.75, 0.25, 1) : 0 })),
        props: (canvas, poses) => {
          const from = n === 1 ? poses[0].x - 4 : poses[chain[0]].x
          const to = n === 1 ? poses[0].x + WIDTH + 3 : poses[chain[1]].x
          const x = Math.round(from + (to - from) * ease(u))
          canvas.sprite(LINK, { r: RING, s: LENS, x: PAPER }, x - 2, Math.round(1 - Math.sin(Math.PI * u)))
        },
      }
    }

    case "maps": {
      // The front bot drops a map pin beside it, then a little rank grid lights up around the pin.
      const s = t % 3.2
      return {
        poses: all((i) => ({ ...idle(i, i === lead ? look(facing) : toward(i)), lift: i === lead ? hop(s, 0.55, 0.3, 2) : 0 })),
        props: (canvas, poses, bottom) => {
          const x = ahead(poses, 4, 5)
          const rest = bottom - PIN_ROWS.length - 1
          canvas.sprite(PIN_ROWS, { p: PIN, w: PAPER, d: BOTS[0].pal.f }, x, Math.round(ease(clamp(s / 0.6)) * rest))
          if (s < 0.8) return
          const ranks = ["#7ED957", "#7ED957", "#FFC107", "#7ED957", "#FFC107", "#F44336"]
          const spots = [[-3, 1], [7, 1], [-3, 3], [7, 3], [-5, 1], [9, 1]]
          spots.forEach(([dx, dy], k) => {
            if (s < 0.8 + k * 0.15) return
            canvas.dot(x + dx, bottom - dy, ranks[(k + stage.variant) % ranks.length])
            canvas.dot(x + dx + 1, bottom - dy, ranks[(k + stage.variant) % ranks.length])
          })
        },
      }
    }

    case "data": {
      // A crate of results travels along the line, tossed in an arc above their heads.
      const pass = 0.8
      const k = Math.floor(t / pass)
      const u = (t % pass) / pass
      const order = facing > 0 ? [...Array(n).keys()] : [...Array(n).keys()].reverse()
      const a = order[k % n]
      const b = order[(k + 1) % n]
      return {
        poses: all((i) => ({ ...idle(i, look(facing)), lift: i === b ? hop(u, 0.7, 0.3, 1) : 0 })),
        props: (canvas, poses) => {
          const from = poses[a].x
          const to = n === 1 ? from + facing * 7 : poses[b].x
          const x = Math.round(from + (to - from) * ease(u))
          canvas.sprite(CRATE_ROWS, { t: CRATE[0], b: CRATE[1], k: CRATE[2], d: CRATE[2] }, x, Math.round(1 - Math.sin(Math.PI * u)))
        },
      }
    }

    case "permission": {
      // The lead holds up a "$" sign and taps a foot, waiting on your YES; the others look up at it.
      const tap = Math.floor(t / 0.45) % 2
      const sway = Math.floor(t / 0.9) % 2
      return {
        poses: all((i) => (i === lead ? { x: at(i), step: tap } : idle(i, toward(i)))),
        props: (canvas, poses, bottom) => {
          const pole = Math.min(poses[lead].x + 2 + sway, width - 3)
          canvas.label(pole - 1, 0, " $ ", INK, PAPER)
          for (let y = 2; y < top(poses, lead, bottom); y++) canvas.dot(pole, y, BOTS[stage.cast[lead]].pal.f)
        },
      }
    }

    case "chart": {
      // Bars grow out of the floor in the crew's colors, then the bots hop on the beat.
      const grow = clamp(t / 0.8)
      return {
        poses: all((i) => ({ ...idle(i), lift: hop(t, 0.8 + i * 0.15, 0.4, 2) || hop(t, 1.5, 0.45, 2) })),
        props: (canvas, poses, bottom) => {
          const x = ahead(poses, 2, 8)
          ;[4, 7, 10].forEach((h, k) => {
            const height = Math.round(h * ease(grow))
            for (let y = 0; y < height; y++) {
              canvas.dot(x + k * 3, bottom - 1 - y, BOTS[k].pal.c)
              canvas.dot(x + k * 3 + 1, bottom - 1 - y, BOTS[k].pal.f)
            }
          })
        },
      }
    }

    case "budget": {
      // The budget ran out: the crew bows one after another toward you and holds it, under a small sign.
      return {
        poses: all((i) => {
          const bowed = t >= 0.2 + i * 0.15
          return { x: at(i), lean: bowed ? facing : 0, eyes: bowed ? "closed" : "ahead" }
        }),
        props: (canvas, poses) =>
          t >= 0.5 && canvas.label(Math.max(0, Math.min(poses[0].x, width - 9)), 0, " budget ", INK, "#EABD59"),
      }
    }

    case "error": {
      // The lead shakes its head and a grey puff of smoke rises from it and drifts off; the others turn to look.
      const shaking = t < 1.2
      const side = Math.floor(t * 8) % 2 ? 1 : -1
      return {
        poses: all((i) =>
          i === lead
            ? { x: at(i), head: shaking ? side : 0, eyes: shaking ? look(side) : "ahead" }
            : idle(i, toward(i)),
        ),
        props: (canvas, poses, bottom) => {
          if (t > 1.6) return
          const size = Math.min(2, 1 + Math.floor(t / 0.4))
          const cloud = CLOUD[size]
          const rise = Math.floor(t * 3)
          const x = poses[lead].x + (facing > 0 ? 3 : 2 - cloud[0].length) + Math.floor(t * 2) * facing
          canvas.sprite(cloud, { a: PUFF[1], b: PUFF[0] }, x, top(poses, lead, bottom) - cloud.length - rise)
        },
      }
    }

    case "done": {
      // A happy hop together, then they walk off the way they came.
      const leave = clamp((t - 0.5) / 1.1)
      const away = stage.side > 0 ? width - home + 2 : -(home + layout(stage, width).group + 2)
      const step = Math.floor(t * 7) % 2
      return {
        poses: all((i) => ({
          x: at(i) + Math.round(ease(leave) * away),
          lift: hop(t, 0.05 + i * 0.08, 0.35, 2),
          eyes: t < 0.5 ? "closed" : look(stage.side),
          step: leave > 0 ? (step + i) % 2 : 0,
        })),
      }
    }
  }
}

/** Where the bots start when the stage first appears: just off the side they walk in from. */
function offstage(stage: Stage, width: number, poses: Pose[]): Pose[] {
  const { home, group } = layout(stage, width)
  const shift = stage.side > 0 ? width - home + 2 : -(home + group + 2)
  return poses.map((pose) => ({ x: pose.x + shift, eyes: look(-stage.side) }))
}

function glide(from: Pose[], to: Pose[], k: number): Pose[] {
  if (k >= 1 || from.length !== to.length) return to
  const e = ease(k)
  return to.map((pose, i) => {
    const x = Math.round(from[i].x + (pose.x - from[i].x) * e)
    const moving = x !== pose.x
    return { ...pose, x, step: moving ? Math.floor(k * 10) % 2 : pose.step, eyes: moving ? look(pose.x - from[i].x) : pose.eyes }
  })
}

export type Frame = { rows: Cell[][]; poses: Pose[] }

/**
 * One frame. `t` is seconds into the scene; `age` is seconds since the stage appeared (the walk in); `from` and
 * `since` are the poses the bots held when the scene changed and how long ago that was, so they glide over.
 */
export function crewFrame(input: {
  scene: Scene
  t: number
  stage: Stage
  width: number
  age?: number
  from?: Pose[]
  since?: number
}): Frame {
  const { scene, t, stage, width } = input
  if (stage.spot === "rail") return railFrame(scene, t, stage, width, input.age ?? Infinity)
  const height = STAGE_ROWS * 2
  const canvas = new PixelCanvas(width, height)
  const scripted = act(scene, t, stage, width)
  let poses = scripted.poses
  const age = input.age ?? Infinity
  if (age < ENTER_TIME) poses = glide(offstage(stage, width, poses), poses, age / ENTER_TIME)
  else if (input.from && (input.since ?? Infinity) < GLIDE_TIME) poses = glide(input.from, poses, (input.since ?? 0) / GLIDE_TIME)
  const entering = age < ENTER_TIME
  if (!entering) scripted.props?.(canvas, poses, height)
  poses.forEach((pose, i) => drawBot(canvas, stage.cast[i], pose, height))
  return { rows: canvas.rows(), poses }
}

/** Draw one small crew bot standing on `bottom` (shared with the home screen crew). */
export function drawBot(canvas: PixelCanvas, bot: number, pose: Pose, bottom: number) {
  const sprite = SPRITE(bot, pose.step ?? 0).map((row, r) => (r === EYE_ROW ? EYES[pose.eyes ?? "ahead"] : row))
  const pal = BOTS[bot].pal
  const top = bottom - sprite.length - (pose.lift ?? 0)
  if (pose.lean) {
    // A bow: the bot drops one row and leans forward from the feet up, the head furthest over.
    const rows = [...sprite.slice(0, HEAD), ...sprite.slice(HEAD + 1)]
    rows.forEach((row, r) => {
      const over = r < rows.length / 3 ? 2 : r < (rows.length * 2) / 3 ? 1 : 0
      canvas.sprite([row], pal, pose.x + over * pose.lean!, top + 1 + r)
    })
    return
  }
  canvas.sprite(sprite.slice(0, HEAD), pal, pose.x + (pose.head ?? 0), top)
  canvas.sprite(sprite.slice(HEAD), pal, pose.x, top + HEAD)
}

// The rail: micro bots one text row tall (3 by 2 pixels) walking the row under the transcript, with a small sign.
// Micro bots are too small for a profile, so they keep one centred eye; lids close in the foot color.
const MICRO_EYES: Record<Eyes, string> = { ahead: "cec", left: "cec", right: "cec", closed: "cfc" }
const RAIL_SIGN: Partial<Record<Scene, [string, string, string]>> = {
  search: [" serp ", INK, LENS],
  keywords: [" keywords ", INK, "#FFC107"],
  links: [" links ", INK, RING],
  maps: [" map ", PAPER, PIN],
  crawl: [" crawl ", INK, GLOW[0]],
  data: [" data ", INK, CRATE[0]],
  permission: [" $ ", INK, PAPER],
  budget: [" budget ", INK, "#EABD59"],
  error: ["!", "#F44336", ""],
}

function railFrame(scene: Scene, t: number, stage: Stage, width: number, age: number): Frame {
  const canvas = new PixelCanvas(width, RAIL_ROWS * 2)
  const n = stage.cast.length
  const span = 3 + (n - 1) * 4
  const lane = { min: 1, max: Math.max(1, Math.min(width - span - 8, 40)) }
  const walking = ["search", "crawl", "data", "keywords", "links", "maps", "thinking"].includes(scene)
  const speed = scene === "thinking" ? 2 : 6
  let { x, dir } = walking ? patrol(t, 1, lane, speed, 1) : { x: 1, dir: 1 }
  if (age < ENTER_TIME) x = Math.round(-span - 2 + (x + span + 2) * ease(age / ENTER_TIME))
  if (scene === "done") x += Math.round(ease(clamp((t - 0.3) / 1.2)) * (width + 2))
  const step = walking || scene === "done" ? Math.floor(t * 7) % 2 : 0
  const poses: Pose[] = stage.cast.map((_, i) => ({ x: x + i * 4, step: (step + i) % 2, eyes: look(dir) }))
  poses.forEach((pose, i) => {
    const pal = BOTS[stage.cast[i]].pal
    const shake = scene === "error" && t < 1.2 && i === 0 ? (Math.floor(t * 8) % 2 ? 1 : -1) : 0
    const blink = (t + i * 1.3) % 3.4 < 0.15 || scene === "budget" || (scene === "done" && t < 0.3)
    canvas.sprite([MICRO_EYES[blink ? "closed" : (pose.eyes ?? "ahead")]], pal, pose.x + shake, 0)
    canvas.sprite([pose.step ? ".f." : "f.f"], pal, pose.x, 1)
  })
  const sign = RAIL_SIGN[scene]
  const after = x + span + 1
  if (sign && age >= ENTER_TIME) canvas.label(dir > 0 ? after : Math.max(0, x - 1 - sign[0].length), 0, sign[0], sign[1], sign[2])
  if (scene === "thinking") canvas.label(after, 0, ["·", "··", "···"][Math.floor(t / 0.45) % 3], PAPER, "")
  if (scene === "chart")
    ["▂", "▄", "▆"].forEach((bar, k) => t > k * 0.25 && canvas.label(after + k, 0, bar, BOTS[k].pal.c, ""))
  return { rows: canvas.rows(), poses }
}

/** The scene for a running tool, from the DataForSEO API its request goes to. */
export function toolScene(name: string, path: string | undefined): Scene {
  if (path) {
    if (/\/maps|local_finder|business_data|my_business|\/locations/.test(path)) return "maps"
    if (/^\/v3\/(serp|ai_optimization)\//.test(path)) return "search"
    if (/^\/v3\/keywords_data\//.test(path) || /keyword/.test(path)) return "keywords"
    if (/^\/v3\/backlinks\//.test(path)) return "links"
    if (/^\/v3\/(on_page|domain_analytics)\//.test(path)) return "crawl"
    if (/^\/v3\/dataforseo_labs\//.test(path)) return "search"
    return "data"
  }
  if (name === "chart") return "chart"
  if (/search|fetch|grep|glob/.test(name)) return "search"
  return "data"
}
