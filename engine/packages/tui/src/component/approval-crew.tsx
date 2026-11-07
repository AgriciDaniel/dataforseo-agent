// DataForSEO Agent: the three tiny bots next to a paid call's approval buttons, bobbing and pointing at Accept.
import { createSignal, onCleanup } from "solid-js"
import { useConfig } from "../config"
import { PixelCanvas, type Cell } from "../ui/bots"
import { CellRows } from "./crew"

import { MINION_COLORS as BOTS, minion } from "../ui/home-crew"
const ARM = "#ffffff"
/** Width in columns and height in text rows. */
export const APPROVAL_CREW_WIDTH = 24
const H = 8

/** One frame at time `t` (seconds): the bots look right and bob in turn, the last one points with a pulsing arm. */
export function approvalCrewFrame(t: number): Cell[][] {
  const canvas = new PixelCanvas(APPROVAL_CREW_WIDTH, H)
  BOTS.forEach((pal, i) => {
    const bob = Math.sin(t * 7 - i * 1.1) > 0.3 ? 1 : 0
    // Daniel's minions, eyes to the right (toward Accept).
    const rows = minion(i, "ahead", i === 1 && Math.floor(t * 4) % 2 ? 1 : 0)
    canvas.sprite(rows, pal, i * 6, H - rows.length - bob)
  })
  // The pointing arm: from the green bot's side to an arrow head, stretching and pulling back.
  const reach = 2 + Math.round((Math.sin(t * 6) + 1) * 1)
  const bob = Math.sin(t * 7 - 2 * 1.1) > 0.3 ? 1 : 0
  const y = H - 4 - bob
  for (let x = 17; x < 17 + reach; x++) canvas.dot(x, y, ARM)
  const tip = 17 + reach
  canvas.dot(tip, y, ARM)
  canvas.dot(tip - 1, y - 1, ARM)
  canvas.dot(tip - 1, y + 1, ARM)
  return canvas.rows()
}

export function ApprovalCrew() {
  const config = useConfig().data
  const animate = () => config.animations ?? true
  const start = Date.now()
  const [rows, setRows] = createSignal(approvalCrewFrame(0))
  const timer = setInterval(() => setRows(approvalCrewFrame(animate() ? (Date.now() - start) / 1000 : 0)), animate() ? 33 : 1000)
  onCleanup(() => clearInterval(timer))
  return (
    <box flexShrink={0} width={APPROVAL_CREW_WIDTH}>
      <CellRows rows={rows()} />
    </box>
  )
}
