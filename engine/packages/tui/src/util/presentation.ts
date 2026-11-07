import { barColors, bars, logo } from "../logo"

const reset = "\x1b[0m"
const bold = "\x1b[1m"
const dim = "\x1b[90m"

function wordmark(pad = "") {
  const draw = (line: string, fg: string, shadow: string, bg: string) =>
    [...line]
      .map((char) => {
        if (char === "_") return `${bg} ${reset}`
        if (char === "^") return `${fg}${bg}▀${reset}`
        if (char === "~") return `${shadow}▀${reset}`
        if (char === " ") return " "
        return `${fg}${char}${reset}`
      })
      .join("")

  return logo.left.map((line, index) => {
    const mark = bars
      .map((bar, column) => {
        const hex = barColors[column].slice(1).match(/../g)!.map((part) => parseInt(part, 16))
        return `\x1b[38;2;${hex.join(";")}m${bar[index]}${reset}`
      })
      .join(" ")
    const left = `${mark}  ${draw(line, reset, "\x1b[38;5;238m", "\x1b[48;5;238m")}`
    const right = draw(logo.right[index] ?? "", reset, "\x1b[38;5;238m", "\x1b[48;5;238m")
    return `${pad}${left} ${right}`
  })
}

export type SessionEpilogue = { readonly title: string; readonly sessionID?: string }

// Printed after the TUI closes.
export function epilogue(input: { readonly session?: SessionEpilogue }) {
  if (!input.session) return
  const row = (label: string, value: string) => `  ${dim}${label.padEnd(10, " ")}${reset}${bold}${value}${reset}`
  return [
    ...wordmark("  "),
    "",
    ...(input.session
      ? [row("Session", input.session.title), row("Continue", `dataforseo-agent -s ${input.session.sessionID}`), ""]
      : []),
  ].join("\n")
}
