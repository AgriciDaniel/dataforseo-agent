// DataForSEO Agent: auto-allow paid DataForSEO calls for one chat. The engine's "Always allow" saves a rule for
// the whole project, and session rules do not reach subagent sessions, so the chat switch lives here: while it is
// on, the session view answers DataForSEO permission requests from this chat and its subagents with "once".
// The session budget still applies, since the engine checks it after the permission. It lasts until the app
// closes.
import { createSignal } from "solid-js"

const [allowed, setAllowed] = createSignal<ReadonlySet<string>>(new Set())

/** True when a permission action is a DataForSEO MCP call (the paid ones are the ones that ask). */
export const isDataForSEOAction = (action: string) => /^dataforseo_/.test(action)

/** Whether paid DataForSEO calls are auto-allowed in the chat with this root session. */
export function chatAutoAllowed(rootSessionID: string | undefined) {
  return rootSessionID !== undefined && allowed().has(rootSessionID)
}

export function setChatAutoAllowed(rootSessionID: string, on: boolean) {
  setAllowed((current) => {
    const next = new Set(current)
    if (on) next.add(rootSessionID)
    else next.delete(rootSessionID)
    return next
  })
}

/** The chat a session belongs to: follow parents up to the top session. */
export function rootSession(sessionID: string, parent: (id: string) => string | undefined) {
  let current = sessionID
  const seen = new Set<string>()
  while (!seen.has(current)) {
    seen.add(current)
    const next = parent(current)
    if (!next) break
    current = next
  }
  return current
}
