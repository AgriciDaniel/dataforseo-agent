import { EOL } from "os"
import { Effect } from "effect"
import { Service } from "@dataforseo-agent/client/effect/service"
import { Commands } from "../../commands"
import { Runtime } from "../../../framework/runtime"
import { ServiceConfig } from "../../../services/service-config"
import { ServiceStatus } from "../../../services/service-status"

export default Runtime.handler(
  Commands.commands.service.commands.status,
  Effect.fn("cli.service.status")(function* () {
    const options = yield* ServiceConfig.options()
    const found = yield* Service.discover({ ...options, version: undefined })
    process.stdout.write((found?.url ?? "stopped") + EOL)
    if (!found) return
    const text = yield* ServiceStatus.read(found).pipe(
      Effect.map(ServiceStatus.format),
      Effect.orElseSucceed(() => "Activity unavailable; this service may need an update."),
    )
    process.stdout.write(text + EOL)
  }),
)
