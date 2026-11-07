import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Database } from "@dataforseo-agent/core/database/database"
import { AppNodeBuilder } from "@dataforseo-agent/core/effect/app-node-builder"
import { LayerNode } from "@dataforseo-agent/util/effect/layer-node"
import { Bus } from "@dataforseo-agent/core/bus"
import { Location } from "@dataforseo-agent/core/location"
import { Project } from "@dataforseo-agent/core/project"
import { AbsolutePath } from "@dataforseo-agent/core/schema"
import { Session } from "@dataforseo-agent/core/session"
import { SessionProjector } from "@dataforseo-agent/core/session/projector"
import { SessionExecution } from "@dataforseo-agent/core/session/execution"
import { SessionStore } from "@dataforseo-agent/core/session/store"
import { testEffect } from "./lib/effect"
import { globalProjectNode } from "./lib/project"

const location = Location.Ref.make({ directory: AbsolutePath.make("/project") })
const awaited: Session.ID[] = []
const execution = Layer.mock(SessionExecution.Service, {
  awaitIdle: (sessionID) => Effect.sync(() => awaited.push(sessionID)),
})
const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([Database.node, Bus.node, SessionProjector.node, SessionStore.node, Session.node]),
    [Project.node.replace(globalProjectNode), SessionExecution.node.replace(execution)],
  ),
)

describe("Session.wait", () => {
  it.effect("delegates to SessionExecution.awaitIdle", () =>
    Effect.gen(function* () {
      awaited.length = 0
      const sessions = yield* Session.Service
      const session = yield* sessions.create({ location })

      yield* sessions.wait(session.id)

      expect(awaited).toEqual([session.id])
    }),
  )
})
