import { expect, test } from "bun:test"
import { CHAT_ROWS, HOME_ROWS, HomeCrew, MINION_COLORS } from "../../src/ui/home-crew"
import { MARK, markCells, markColors } from "../../src/logo"

const text = (crew: HomeCrew) => crew.frame().map((row) => row.map((cell) => cell.char).join(""))

test("the crew walks a level of result pages in a strip of HOME_ROWS rows", () => {
  const crew = new HomeCrew(80, 1)
  const rows = crew.frame()
  expect(rows).toHaveLength(HOME_ROWS)
  rows.forEach((row) => expect(row).toHaveLength(80))
  const colors = new Set(rows.flat().flatMap((cell) => [cell.fg, cell.bg]))
  MINION_COLORS.forEach((bot) => expect(colors.has(bot.c)).toBe(true))
  expect(text(crew)[0]).toContain("RANK #48")
})

test("over a long walk the crew fixes things, collects coins, climbs the rank and never falls off", () => {
  const crew = new HomeCrew(90, 7)
  let best = crew.rank
  for (let i = 0; i < 30 * 60; i++) {
    crew.step(1 / 30)
    best = Math.min(best, crew.rank)
    crew.poses().forEach((pose) => expect(pose.lift).toBeGreaterThan(-3))
  }
  expect(crew.clicks).toBeGreaterThan(0)
  expect(best).toBeLessThan(30)
})

test("clicks: on the floor the crew jumps, on a bot it backflips", () => {
  const crew = new HomeCrew(80, 3)
  crew.step(0.1)
  expect(crew.poke(79)).toBe("jump")
  crew.step(0.1)
  expect(Math.max(...crew.poses().map((pose) => pose.lift))).toBeGreaterThan(0)
  const other = new HomeCrew(80, 3)
  other.step(0.1)
  expect(other.poke(other.poses()[1].x + 2)).toBe("flip")
  other.step(0.15)
  expect(other.poses()[1].turn).not.toBe(0)
})

test("in a chat the mood sets the pace and waiting stops the crew with a bubble", () => {
  const crew = new HomeCrew(80, 2, CHAT_ROWS)
  expect(crew.frame()).toHaveLength(CHAT_ROWS)
  crew.setMood("permission")
  for (let i = 0; i < 60; i++) crew.step(1 / 30)
  const before = crew.poses()[2].x
  const scrolled = text(crew).join("")
  for (let i = 0; i < 30; i++) crew.step(1 / 30)
  expect(crew.poses()[2].x).toBe(before)
  expect(scrolled + text(crew).join("")).toContain("Waiting for your YES")
})

test("the logo mark is the DataForSEO magnifier: blue above, yellow below, a dark ring", () => {
  expect(MARK).toHaveLength(6)
  const cells = markCells()
  expect(cells).toHaveLength(3)
  const colors = (row: number) => new Set(cells[row].flatMap((cell) => [cell.fg, cell.bg]))
  expect(colors(0).has(markColors.B)).toBe(true)
  expect(colors(0).has(markColors.Y)).toBe(false)
  expect(colors(2).has(markColors.Y)).toBe(true)
  expect(colors(2).has(markColors.B)).toBe(false)
  expect(colors(1).has(markColors.K)).toBe(true)
})
