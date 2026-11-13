export * as Status from "./service-status"

import { Context, Effect, Option, RcMap, Ref } from "effect"
import { Session } from "@dataforseo-agent/core/session"
import { Permission } from "@dataforseo-agent/core/permission"
import { Form } from "@dataforseo-agent/core/form"
import { PersistentPty } from "@dataforseo-agent/core/persistent-pty"
import { LocationServiceMap } from "@dataforseo-agent/core/location-service-map"
import { HttpServerRequest, HttpServerResponse } from "effect/http"

// Internal management readout, deliberately outside the generated public SDK.
export const activityPath = "/api/experimental/service/status"

export const activity = Effect.fnUntraced(function* () {
  const sessions = yield* Session.Service
  const locations = yield* LocationServiceMap.Service
  const pty = yield* PersistentPty.Service
  const active = yield* sessions.active
  const counts = yield* Effect.forEach(Array.from(yield* RcMap.keys(locations.rcMap)), (ref) =>
    Effect.scoped(
      Effect.gen(function* () {
        const context = yield* locations.contextEffectOption(ref)
        if (Option.isNone(context)) return { approvals: 0, questions: 0 }
        const permission = Context.get(context.value, Permission.Service)
        const form = Context.get(context.value, Form.Service)
        return { approvals: (yield* permission.list()).length, questions: (yield* form.list()).length }
      }),
    ),
  )
  const terminals = yield* pty.list().pipe(Effect.option)
  return {
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    runningTurns: active.size,
    pendingApprovals: counts.reduce((sum, count) => sum + count.approvals, 0),
    pendingQuestions: counts.reduce((sum, count) => sum + count.questions, 0),
    openTerminals: Option.isSome(terminals)
      ? terminals.value.filter((terminal) => terminal.status === "running").length
      : null,
  }
})

export const withActivity = <A, E, R>(app: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest
    if (request.method === "GET" && new URL(request.url, "http://localhost").pathname === activityPath)
      return HttpServerResponse.jsonUnsafe(yield* activity())
    return yield* app
  })

export type State =
  | { readonly type: "starting" }
  | { readonly type: "ready" }
  | { readonly type: "stopping" }
  | { readonly type: "failed" }

export interface Interface {
  readonly current: Effect.Effect<State>
  readonly ready: Effect.Effect<void>
  readonly fail: Effect.Effect<void>
  readonly beginStopping: Effect.Effect<void>
}

export const make = Effect.fnUntraced(function* (options: { readonly initial?: State } = {}) {
  const current = yield* Ref.make(options.initial ?? ({ type: "starting" } satisfies State))
  const beginStopping = Ref.update(current, (status) =>
    status.type === "stopping" ? status : ({ type: "stopping" } satisfies State),
  )

  return {
    current: Ref.get(current),
    ready: Ref.update(current, (status) => (status.type === "starting" ? ({ type: "ready" } satisfies State) : status)),
    fail: Ref.update(current, (status) => (status.type === "starting" ? ({ type: "failed" } satisfies State) : status)),
    beginStopping,
  } satisfies Interface
})
