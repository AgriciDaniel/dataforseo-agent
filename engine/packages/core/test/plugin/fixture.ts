import { Agent } from "@dataforseo-agent/core/agent"
import { Artifact } from "@dataforseo-agent/core/artifact"
import { AISDK } from "@dataforseo-agent/core/aisdk"
import { Command } from "@dataforseo-agent/core/command"
import { Config } from "@dataforseo-agent/core/config"
import { Credential } from "@dataforseo-agent/core/credential"
import { Database } from "@dataforseo-agent/core/database/database"
import { Environment } from "@dataforseo-agent/core/environment/index"
import { FileAccess } from "@dataforseo-agent/core/file-access"
import { LayerNodePlatform } from "@dataforseo-agent/util/effect/app-node-platform"
import { AppProcess } from "@dataforseo-agent/util/process"
import { LayerNode } from "@dataforseo-agent/util/effect/layer-node"
import { Bus } from "@dataforseo-agent/core/bus"
import { FileSystem } from "@dataforseo-agent/core/filesystem"
import { FSUtil } from "@dataforseo-agent/util/fs-util"
import { Global } from "@dataforseo-agent/util/global"
import { Form } from "@dataforseo-agent/core/form"
import { Generate } from "@dataforseo-agent/core/generate"
import { InstructionDiscovery } from "@dataforseo-agent/core/instruction-discovery"
import { Integration } from "@dataforseo-agent/core/integration"
import { Job } from "@dataforseo-agent/core/job"
import { KV } from "@dataforseo-agent/core/kv"
import { Location } from "@dataforseo-agent/core/location"
import { Mcp } from "@dataforseo-agent/core/mcp/index"
import { Model } from "@dataforseo-agent/core/model"
import { Npm } from "@dataforseo-agent/util/npm"
import { Plugin } from "@dataforseo-agent/core/plugin"
import { PluginHooks } from "@dataforseo-agent/core/plugin/hooks"
import { Provider } from "@dataforseo-agent/core/provider"
import { Session } from "@dataforseo-agent/core/session"
import { SharedCache } from "@dataforseo-agent/core/shared-cache"
import { InstructionEntry } from "@dataforseo-agent/core/session/instruction-entry"
import { PersistentPty } from "@dataforseo-agent/core/persistent-pty"
import { LocationServiceMap } from "@dataforseo-agent/core/location-service-map"
import { AppNodeBuilder } from "@dataforseo-agent/core/effect/app-node-builder"
import { Permission } from "@dataforseo-agent/core/permission"
import { Reference } from "@dataforseo-agent/core/reference"
import { Rpc } from "@dataforseo-agent/core/rpc"
import { Skill } from "@dataforseo-agent/core/skill"
import { SkillDiscovery } from "@dataforseo-agent/core/skill/discovery"
import { Watcher } from "@dataforseo-agent/core/filesystem/watcher"
import { Tool } from "@dataforseo-agent/core/tool"
import { Vcs } from "@dataforseo-agent/core/vcs"
import { WebSearch } from "@dataforseo-agent/core/websearch"
import { Worktree } from "@dataforseo-agent/core/worktree"
import { WorktreeStrategies } from "@dataforseo-agent/core/worktree/strategies"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"
import { emptyMcpLayer } from "../fixture/mcp"
import { offlineModels } from "../fixture/models"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: (name) => Effect.succeed({ directory: "", name }),
    resolve: (name) => Effect.succeed({ directory: "", name }),
    check: () => Effect.succeed(false),
    update: (name) => Effect.succeed({ directory: "", name }),
    which: () => Effect.undefined,
  }),
)

const generateLayer = Layer.succeed(
  Generate.Service,
  Generate.Service.of({
    text: () => Effect.succeed(""),
    image: () => Effect.die("unused"),
    decisions: () => Effect.die("unused"),
  }),
)

const configLayer = Config.testLayer()

const permissionLayer = Layer.succeed(
  Permission.Service,
  Permission.Service.of({
    close: Effect.void,
    ask: (input) => Effect.succeed({ id: input.id ?? Permission.ID.create(), effect: "ask" }),
    assert: () => Effect.void,
    assertNotDenied: () => Effect.void,
    allows: () => Effect.succeed(false),
    reply: () => Effect.void,
    get: () => Effect.succeed(undefined),
    forSession: () => Effect.succeed([]),
    list: () => Effect.succeed([]),
  }),
)

export const makePluginTestLayer = (permission = permissionLayer, generate = generateLayer, mcp = emptyMcpLayer) =>
  AppNodeBuilder.build(
    LayerNode.group([
      AppProcess.node,
      FileSystem.node,
      FSUtil.node,
      Location.node,
      Npm.node,
      Credential.node,
      Config.node,
      Database.node,
      Environment.node,
      FileAccess.node,
      Global.node,
      Bus.node,
      Form.node,
      Generate.node,
      LayerNodePlatform.httpClient,
      Plugin.node,
      Agent.node,
      Artifact.node,
      AISDK.node,
      Provider.node,
      Model.node,
      Command.node,
      InstructionDiscovery.node,
      Integration.node,
      Job.node,
      KV.node,
      Mcp.node,
      Session.node,
      SharedCache.node,
      InstructionEntry.node,
      PersistentPty.node,
      LocationServiceMap.node,
      Permission.node,
      PluginHooks.node,
      Reference.node,
      Rpc.node,
      Skill.node,
      SkillDiscovery.node,
      Tool.node,
      Vcs.node,
      Watcher.node,
      WebSearch.node,
      Worktree.node,
      WorktreeStrategies.node,
    ]),
    [
      Location.node.replace(tempLocationLayer),
      Npm.node.replace(npmLayer),
      Config.node.replace(configLayer),
      Mcp.node.replace(mcp),
      Generate.node.replace(generate),
      Permission.node.replace(permission),
      offlineModels,
    ],
  ).pipe(Layer.provideMerge(configLayer))

export const PluginTestLayer = makePluginTestLayer()
