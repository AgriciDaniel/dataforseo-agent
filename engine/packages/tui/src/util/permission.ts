import { Locale } from "./locale"
import { canonicalToolName, finiteNumber, webSearchProviderLabel } from "./tool-display"
import { minimumCost, priceLine, requestPath as canonicalPath, requestShape } from "@dataforseo-agent/util/dataforseo"

type Dict = Record<string, unknown>

export type PermissionPresentation = {
  icon: string
  title: string
  lines: string[]
  diff?: string
  patch?: string
  file?: string
  /** A DataForSEO request, in pieces, for the compact paid call prompt. */
  paid?: {
    method: string
    path: string
    tasks: number
    /** The headline amount: "$0.06", "from $0.012" when the bill depends on the results, "Free" or "Price ?". */
    amount: string
    /** The catalog price line, as in `lines`. */
    note: string
    /** The first task's parameters on one line, such as `keywords ["ai marketing"] · location_code 2840`. */
    params: string
  }
}

export type PermissionPresentationInput = {
  action: string
  resources: ReadonlyArray<unknown>
  metadata?: unknown
  input?: unknown
  toolMetadata?: unknown
}

export function permissionPresentation(
  source: PermissionPresentationInput,
  formatPath: (value: string) => string = (value) => value,
): PermissionPresentation {
  const action = canonicalToolName(source.action)
  const input = normalizeInput(action, source.input)
  const metadata = { ...dict(source.toolMetadata), ...dict(source.metadata) }
  const resources = source.resources.filter((item): item is string => typeof item === "string")

  if (action === "edit") {
    const file = text(input.path) || resources[0] || ""
    const first = dict(Array.isArray(metadata.files) ? metadata.files[0] : undefined)
    const diff = text(first.patch) || text(first.diff) || text(metadata.diff) || undefined
    return {
      icon: "→",
      title: `Edit ${formatPath(file)}`,
      lines: [],
      diff,
      patch: diff ? undefined : text(input.patchText) || undefined,
      file,
    }
  }

  if (action === "read" || action === "list") {
    const value = text(input.path) || resources[0] || ""
    const title = action === "read" ? "Read" : "List"
    return {
      icon: "→",
      title: `${title} ${formatPath(value)}`,
      lines: value ? [`Path: ${formatPath(value)}`] : [],
    }
  }

  if (action === "glob" || action === "grep") {
    const pattern = text(input.pattern) || resources[0] || ""
    const title = action === "glob" ? "Glob" : "Grep"
    return {
      icon: "✱",
      title: `${title} "${pattern}"`,
      lines: pattern ? [`Pattern: ${pattern}`] : [],
    }
  }

  if (action === "shell") {
    const command = text(input.command)
    return {
      icon: "#",
      title: "Shell command",
      lines: command ? [`$ ${command}`] : resources.map((item) => `- ${item}`),
    }
  }

  if (action === "subagent") {
    const agent = text(input.agent) || "general"
    const description = text(input.description)
    return {
      icon: "#",
      title: `${Locale.titlecase(agent)} Subagent`,
      lines: description ? [`◉ ${description}`] : [],
    }
  }

  if (action === "webfetch") {
    const url = text(input.url) || text(metadata.url)
    return {
      icon: "%",
      title: `WebFetch ${url}`,
      lines: url ? [`URL: ${url}`] : [],
    }
  }

  if (action === "websearch") {
    const query = text(input.query) || text(metadata.query)
    const title = webSearchProviderLabel(metadata.provider)
    return {
      icon: "◈",
      title: query ? `${title} "${query}"` : title,
      lines: query ? [`Query: ${query}`] : [],
    }
  }

  if (action === "lsp") {
    const file = text(input.path)
    const operation = text(input.operation) || "request"
    const line = finiteNumber(input.line)
    const character = finiteNumber(input.character)
    const position = line !== undefined && character !== undefined ? `${line}:${character}` : undefined
    return {
      icon: "→",
      title: `LSP ${operation}${file ? ` ${formatPath(file)}${position ? `:${position}` : ""}` : ""}`,
      lines: [
        ...(input.operation ? [`Operation: ${operation}`] : []),
        ...(file ? [`Path: ${formatPath(file)}`] : []),
        ...(position ? [`Position: ${position}`] : []),
      ],
    }
  }

  if (action === "external_directory") {
    const raw = text(metadata.parentDir) || text(metadata.filepath) || resources[0] || ""
    const directory = wildcardDirectory(raw)
    return {
      icon: "←",
      title: `Access external directory ${formatPath(directory)}`,
      lines: resources.map((item) => `- ${item}`),
    }
  }

  if (action === "doom_loop") {
    return {
      icon: "⟳",
      title: "Continue after repeated failures",
      lines: ["This keeps the session running despite repeated failures."],
    }
  }

  // DataForSEO Agent: show what a tool call will do, so a paid API request is never approved blind.
  const called = dict(metadata.input)
  const short = (value: unknown, max: number) => {
    const json = typeof value === "string" ? value : JSON.stringify(value)
    return json && json.length > max ? json.slice(0, max - 1) + "…" : (json ?? "")
  }
  const requestPath = text(called.path)
  if (requestPath && source.action.startsWith("dataforseo")) {
    const method = (text(called.method) || "POST").toUpperCase()
    const body = called.data ?? called.params ?? called.body
    // Each array item is one task, billed separately: say how many before the body gets cut short.
    const tasks = Array.isArray(body) ? body.length : body === undefined ? 0 : 1
    const endpoint = canonicalPath(requestPath) ?? requestPath
    const priority = requestShape(called).priority
    const note = priceLine(endpoint, tasks, priority)
    const cost = "$" + Number(minimumCost(endpoint, tasks, priority).toPrecision(4)).toString()
    const amount = note.startsWith("Free")
      ? "Free"
      : note.startsWith("Price unknown")
        ? "Price ?"
        : note.includes("depends on the results")
          ? `from ${cost}`
          : cost
    const first = dict(Array.isArray(body) ? body[0] : body)
    const params = Object.entries(first)
      .map(([key, value]) => `${key} ${typeof value === "string" ? value : short(value, 80)}`)
      .join(" · ")
    return {
      icon: "$",
      title: `${method} ${requestPath}`,
      lines: [
        `Tool: ${source.action}`,
        ...(tasks > 1 ? [`${tasks} tasks in this request, each billed.`] : []),
        ...(body !== undefined ? [`Body: ${short(body, 400)}`] : []),
        note,
      ],
      paid: {
        method,
        path: requestPath,
        tasks,
        amount,
        note,
        params: (params.length > 300 ? params.slice(0, 299) + "…" : params) + (tasks > 1 ? ` · and ${tasks - 1} more` : ""),
      },
    }
  }
  return {
    icon: "⚙",
    title: `Call tool ${source.action}`,
    lines: [`Tool: ${source.action}`, ...(Object.keys(called).length ? [`Input: ${short(called, 400)}`] : [])],
  }
}

function wildcardDirectory(value: string) {
  const wildcard = value.indexOf("*")
  if (wildcard === -1) return value
  const prefix = value.slice(0, wildcard)
  if (/^[\\/]+$/.test(prefix) || /^[A-Za-z]:[\\/]$/.test(prefix)) return prefix
  return prefix.replace(/[\\/]+$/, "")
}

export function permissionAlwaysLines(input: { action: string; save?: ReadonlyArray<string> }): string[] {
  const save = input.save ?? []
  if (save.length === 1 && save[0] === "*") {
    return [`This will always allow ${input.action} for this project.`]
  }
  return ["This will always allow the following patterns for this project.", ...save.map((item) => `- ${item}`)]
}

export function permissionOptionLabel(option: "once" | "always" | "reject" | "confirm" | "cancel") {
  if (option === "once") return "Allow once"
  if (option === "always") return "Always allow"
  if (option === "reject") return "Reject"
  if (option === "confirm") return "Confirm"
  return "Cancel"
}

function normalizeInput(action: string, value: unknown): Dict {
  const input = dict(value)
  const path = text(input.path) || text(input.filePath) || text(input.filepath)
  const agent = text(input.agent) || text(input.subagent_type)
  return {
    ...input,
    ...(["read", "edit", "list", "lsp"].includes(action) && path ? { path } : {}),
    ...(action === "subagent" && agent ? { agent } : {}),
  }
}

function dict(value: unknown): Dict {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Dict
}

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}
