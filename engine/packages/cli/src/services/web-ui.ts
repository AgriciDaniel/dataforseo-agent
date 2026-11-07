import { Effect } from "effect"
import { HttpServerError, HttpServerResponse } from "effect/http"

// DataForSEO Agent is a terminal app: the server answers its API routes and nothing else.
export const handler = Effect.fn("cli.web-ui.handler")(function* () {
  return <E, R>(api: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
    api.pipe(Effect.catchIf(isRouteNotFound, () => Effect.succeed(HttpServerResponse.empty({ status: 404 }))))
})

function isRouteNotFound(error: unknown) {
  return error instanceof HttpServerError.HttpServerError && error.reason._tag === "RouteNotFound"
}

export * as WebUi from "./web-ui"
