// DataForSEO Agent: plays the session crew scenes in the terminal, to review them without running a session.
//   bun engine/packages/tui/src/ui/crew-preview.ts                 a whole turn in every spot, then each scene
//   bun engine/packages/tui/src/ui/crew-preview.ts search left     one scene in one spot, looping
import { SCENES, STAGE_ROWS, crewFrame, type Pose, type Scene, type Spot, type Stage } from "./crew-scenes"
import type { Cell } from "./bots"

const width = Math.min(72, process.stdout.columns ?? 72)
const FPS = 50
const hex = (value: string) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).join(";")
const paint = (cell: Cell) =>
  (cell.fg ? `\x1b[38;2;${hex(cell.fg)}m` : "") + (cell.bg ? `\x1b[48;2;${hex(cell.bg)}m` : "") + cell.char + "\x1b[0m"
const BACK = "\x1b[48;2;6;13;23m"

function show(title: string, rows: Cell[][]) {
  const lines = [`\x1b[2K  \x1b[38;2;234;189;89m${title}\x1b[0m`, ""]
  for (let r = 0; r < STAGE_ROWS; r++) lines.push(r < rows.length ? BACK + rows[r].map(paint).join(BACK) + BACK + "\x1b[0m" : "\x1b[2K")
  process.stdout.write("\x1b[H" + lines.map((line) => line + "\x1b[K").join("\n"))
}

const stage = (spot: Spot): Stage => ({ spot, cast: spot === "peek" ? [1] : [0, 1, 2], side: spot === "left" ? -1 : 1, variant: 0 })
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

// Play one scene for `seconds`, gliding in from the previous poses.
async function play(title: string, scene: Scene, set: Stage, seconds: number, clock: { age: number; poses?: Pose[] }) {
  const from = clock.poses
  for (let t = 0; t < seconds; t += 1 / FPS) {
    const frame = crewFrame({ scene, t, stage: set, width, age: clock.age, from, since: t })
    show(`${title}  ${scene}`, frame.rows)
    clock.poses = frame.poses
    clock.age += 1 / FPS
    await sleep(1000 / FPS)
  }
}

process.stdout.write("\x1b[?25l\x1b[2J")
process.on("SIGINT", () => {
  process.stdout.write("\x1b[?25h\n")
  process.exit(0)
})

const [one, where] = process.argv.slice(2) as [Scene | undefined, Spot | undefined]
if (one) {
  for (;;) await play(`${where ?? "left"}`, one, stage(where ?? "left"), 4, { age: 0 })
}
const TURN: [Scene, number][] = [["thinking", 2.2], ["permission", 2], ["search", 3], ["maps", 3], ["chart", 2], ["done", 1.8]]
for (const spot of ["left", "centre", "right", "peek", "rail"] as Spot[]) {
  const clock = { age: 0 }
  for (const [scene, seconds] of TURN) await play(`a turn, ${spot}`, scene, stage(spot), seconds, clock)
}
for (const scene of SCENES) {
  for (const variant of [0, 1]) await play(`variant ${variant}`, scene, { ...stage("left"), variant }, 3, { age: 9 })
}
process.stdout.write("\x1b[?25h\n")
