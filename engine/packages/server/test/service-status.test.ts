import { expect } from "bun:test"
import { Context, Effect, Layer } from "effect"
import { HttpEffect, HttpServer, HttpServerResponse } from "effect/http"
import { Form } from "@dataforseo-agent/core/form"
import { Permission } from "@dataforseo-agent/core/permission"
import { Session } from "@dataforseo-agent/core/session"
import { LocationServiceMap } from "@dataforseo-agent/core/location-service-map"
import { Global } from "@dataforseo-agent/util/global"
import { AbsolutePath } from "@dataforseo-agent/schema/schema"
import { tempGlobalLayer } from "../../core/test/fixture/global"
import { createEmbeddedRoutes } from "../src/routes"
import { it } from "../../core/test/lib/effect"
import { Status } from "../src/service-status"

it.live("activity counts pending interactions across loaded locations without settling them", () =>
  Effect.gen(function* () {
    const context = yield* Layer.build(
      createEmbeddedRoutes(
        {
          database: { path: ":memory:" },
          models: { fetch: false },
          config: { project: false, claude: false },
          fs: { filewatcher: false, fff: false },
        },
        [Global.node.replace(tempGlobalLayer)],
      ).pipe(Layer.provide(HttpServer.layerServices)),
    )
    const sessions = Context.get(context, Session.Service)
    const locations = Context.get(context, LocationServiceMap.Service)
    const global = Context.get(context, Global.Service)
    const session = yield* sessions.create({
      location: { directory: AbsolutePath.make(global.state) },
      permissions: [{ action: "*", resource: "*", effect: "ask" }],
    })
    const location = yield* locations.contextEffect(session.location)
    const permission = Context.get(location, Permission.Service)
    const form = Context.get(location, Form.Service)
    const approval = yield* permission.ask({ sessionID: session.id, action: "test", resources: ["fixture"] })
    expect(approval.effect).toBe("ask")
    yield* form.create({ sessionID: session.id, title: "Choose", fields: [{ key: "choice", type: "string" }] })
    for (const _ of [1, 2]) {
      const activity = yield* Status.activity().pipe(Effect.provideContext(context))
      expect(activity).toMatchObject({ runningTurns: 0, pendingApprovals: 1, pendingQuestions: 1, openTerminals: 0 })
      expect(activity.uptime).toBeGreaterThanOrEqual(0)
    }
    expect(yield* permission.list()).toHaveLength(1)
    expect(yield* form.list()).toHaveLength(1)
    const handler = Status.withActivity(Effect.succeed(HttpServerResponse.empty())).pipe(
      HttpEffect.toWebHandlerWith(context),
    )
    const response = yield* Effect.promise(() => handler(new Request(`http://localhost${Status.activityPath}`)))
    expect(response.status).toBe(200)
    expect(yield* Effect.promise(() => response.json())).toMatchObject({ pendingApprovals: 1, pendingQuestions: 1 })
  }),
)

it.effect("moves from starting to ready", () =>
  Effect.gen(function* () {
    const status = yield* Status.make()
    expect(yield* status.current).toEqual({ type: "starting" })
    yield* status.ready
    expect(yield* status.current).toEqual({ type: "ready" })
  }),
)

it.effect("keeps a startup failure until shutdown", () =>
  Effect.gen(function* () {
    const status = yield* Status.make()
    yield* status.fail
    yield* status.ready
    yield* status.fail
    expect(yield* status.current).toEqual({ type: "failed" })
  }),
)

it.effect("keeps stopping after shutdown begins", () =>
  Effect.gen(function* () {
    const status = yield* Status.make()

    yield* status.beginStopping
    expect(yield* status.current).toEqual({ type: "stopping" })
    yield* status.beginStopping
    expect(yield* status.current).toEqual({ type: "stopping" })
  }),
)
