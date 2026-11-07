import type { FileSystem } from "@dataforseo-agent/core/filesystem"
import { Bus } from "@dataforseo-agent/core/bus"
import { Image } from "@dataforseo-agent/core/image"
import { LocationServiceMap } from "@dataforseo-agent/core/location-service-map"
import type { LocationServices } from "@dataforseo-agent/core/location-services"
import { Plugin } from "@dataforseo-agent/core/plugin"
import { PluginHooks } from "@dataforseo-agent/core/plugin/hooks"
import { Skill } from "@dataforseo-agent/core/skill"
import type { Location } from "@dataforseo-agent/schema/location"
import { makeGlobalNode } from "@dataforseo-agent/util/effect/app-node"
import { LayerNode } from "@dataforseo-agent/util/effect/layer-node"
import { Effect, Layer, LayerMap } from "effect"

// Plain-prompt unit fixtures use virtual directories.
export const promptLocationNode = makeGlobalNode({
  service: LocationServiceMap.Service,
  layer: Layer.effect(
    LocationServiceMap.Service,
    Effect.gen(function* () {
      const bus = yield* Bus.Service
      return yield* LayerMap.make(
        (_ref: Location.Ref) =>
          LayerNode.compile(LayerNode.group([PluginHooks.node, Image.node, Skill.node, Plugin.node]), {
            replacements: [
              Bus.node.replace(Layer.succeed(Bus.Service, bus)),
              Plugin.node.replace(Layer.mock(Plugin.Service, { awaitActivation: Effect.void })),
            ],
          }) as unknown as Layer.Layer<LocationServices, FileSystem.DirectoryNotFoundError>,
      )
    }),
  ),
  deps: [Bus.node],
})
