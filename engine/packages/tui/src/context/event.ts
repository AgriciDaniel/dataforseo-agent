import type { DataForSEOAgentEvent } from "@dataforseo-agent/client"
import { useClient } from "./client"

type EventMetadata = {
  directory: string | undefined
}
type DataForSEOAgentEventMap = { [Type in DataForSEOAgentEvent["type"]]: Extract<DataForSEOAgentEvent, { type: Type }> }

export function useEvent() {
  const client = useClient()

  function subscribe(handler: (event: DataForSEOAgentEvent, metadata: EventMetadata) => void) {
    return client.event.listen(({ details }) => {
      if (details.type === "server.connected") return
      handler(details, { directory: details.location?.directory })
    })
  }

  function on<T extends DataForSEOAgentEvent["type"]>(
    type: T,
    handler: (event: DataForSEOAgentEventMap[T], metadata: EventMetadata) => void,
  ) {
    return client.event.on(type, (event) => {
      handler(event, { directory: event.location?.directory })
    })
  }

  return {
    subscribe,
    on,
  }
}
