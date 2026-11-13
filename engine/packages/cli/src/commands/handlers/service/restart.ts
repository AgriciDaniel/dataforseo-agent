import { EOL } from "os"
import { Effect } from "effect"
import { Service } from "@dataforseo-agent/client/effect/service"
import { Commands } from "../../commands"
import { Runtime } from "../../../framework/runtime"
import { ServiceConfig } from "../../../services/service-config"

export default Runtime.handler(
  Commands.commands.service.commands.restart,
  Effect.fn("cli.service.restart")(function* () {
    const options = yield* ServiceConfig.options()
    yield* Service.stop({ file: options.file, pty: "handoff" })
    const transport = yield* Service.ensure(options)
    process.stdout.write(transport.url + EOL)
  }),
)
