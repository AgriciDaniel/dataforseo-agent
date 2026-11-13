import { Effect, Schema } from "effect"
import { Service, type Endpoint } from "@dataforseo-agent/client/effect/service"

const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))
const Activity = Schema.Struct({
  uptime: Count,
  runningTurns: Count,
  pendingApprovals: Count,
  pendingQuestions: Count,
  openTerminals: Schema.NullOr(Count),
})

export const read = Effect.fn("cli.service-status.read")(function* (endpoint: Endpoint) {
  const body = yield* Effect.tryPromise(async () => {
    const response = await fetch(new URL("/api/experimental/service/status", endpoint.url), {
      headers: Service.headers(endpoint),
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) throw new Error(`Status unavailable (${response.status})`)
    return response.json()
  })
  return yield* Schema.decodeUnknownEffect(Activity)(body)
})

export function format(activity: Schema.Schema.Type<typeof Activity>) {
  return [
    `Running turns: ${activity.runningTurns}`,
    `Pending approvals: ${activity.pendingApprovals}`,
    `Pending questions: ${activity.pendingQuestions}`,
    `Open terminals: ${activity.openTerminals ?? "unavailable"}`,
    `Uptime: ${activity.uptime}s`,
  ].join("\n")
}

export * as ServiceStatus from "./service-status"
