import { expect, test } from "bun:test"
import { HomeStage, STAGE_MIN_WIDTH, STAGE_ROWS, homie } from "../../src/ui/home-stage"

const text = (stage: HomeStage) =>
  stage
    .frame()
    .map((row) => row.map((cell) => cell.char).join(""))
    .join("\n")

test("the Homies keep the logo's rising bars: red, yellow and green are 5, 6 and 7 pixels tall", () => {
  expect([0, 1, 2].map((bot) => homie(bot, 0).length)).toEqual([5, 6, 7])
  expect(homie(0, 0)[2]).toBe("cecec")
})

test("the stage is a fixed size and the crew works DataForSEO stations up to #1", () => {
  const stage = new HomeStage(STAGE_MIN_WIDTH + 24, 7)
  const seen = new Set<string>()
  let best = stage.rank
  for (let t = 0; t < 75; t += 1 / 30) {
    stage.step(1 / 30)
    const frame = stage.frame()
    expect(frame).toHaveLength(STAGE_ROWS)
    frame.forEach((row) => expect(row).toHaveLength(STAGE_MIN_WIDTH + 24))
    best = Math.min(best, stage.rank)
    for (const title of ["KEYWORD IDEAS", "GOOGLE RESULTS", "SITE AUDIT", "BACKLINKS", "LOCAL RANK GRID", "AI ANSWERS"])
      if (text(stage).includes(title)) seen.add(title)
  }
  expect(seen.size).toBe(6)
  expect(best).toBe(1)
  expect(text(stage)).toContain("/v3/")
})

test("a click on a Homie is a backflip, on the working station a speed up, elsewhere a jump", () => {
  const stage = new HomeStage(STAGE_MIN_WIDTH + 24, 7)
  while (stage.phase !== "work") stage.step(1 / 30)
  const [red] = stage.poses()
  expect(stage.poke(red.x + 2)).toBe("flip")
  const before = stage.progress()
  expect(stage.poke(stage.poses()[2].x + 30)).toBe("hit")
  expect(stage.progress()).toBeGreaterThan(before)
  expect(stage.poke(0)).toBe("jump")
})
