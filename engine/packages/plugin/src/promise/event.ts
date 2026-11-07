import type { DataForSEOAgentEvent } from "@dataforseo-agent/client"
import type { SelectedEvent, SubscribeOptions } from "@dataforseo-agent/client/promise/api"

type EventType = Exclude<DataForSEOAgentEvent["type"], "server.connected">

export interface EventDomain {
  readonly subscribe: <Type extends EventType = EventType>(
    options?: SubscribeOptions<Type>,
  ) => AsyncIterable<SelectedEvent<DataForSEOAgentEvent, Type>>
}
