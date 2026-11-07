// TODO: Keep additional network capabilities inside Schema and Protocol as the client grows; /effect must never import
// Core or Server. Preserve these datatype exports so internal model reorganizations do not require caller migrations.
import type { Effect } from "effect"
import type { DataForSEOAgent } from "./client.js"

export * from "./generated/index"
export { DataForSEOAgent } from "./client.js"
export type {
  AgentApi,
  AppApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcClient,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export { Agent } from "@dataforseo-agent/schema/agent"
export { Command } from "@dataforseo-agent/schema/command"
export { Config } from "@dataforseo-agent/schema/config"
export { Credential } from "@dataforseo-agent/schema/credential"
export { Event } from "@dataforseo-agent/schema/event"
export { EventLog } from "@dataforseo-agent/schema/event-log"
export { FileSystem } from "@dataforseo-agent/schema/filesystem"
export { Form } from "@dataforseo-agent/schema/form"
export { Integration } from "@dataforseo-agent/schema/integration"
export { Location } from "@dataforseo-agent/schema/location"
export { Model } from "@dataforseo-agent/schema/model"
export { Permission } from "@dataforseo-agent/schema/permission"
export { PermissionSaved } from "@dataforseo-agent/schema/permission-saved"
export { Project } from "@dataforseo-agent/schema/project"
export { Worktree } from "@dataforseo-agent/schema/worktree"
export { Vcs } from "@dataforseo-agent/schema/vcs"
export { Provider } from "@dataforseo-agent/schema/provider"
export { Pty } from "@dataforseo-agent/schema/pty"
export { Question } from "@dataforseo-agent/schema/question"
export { Reference } from "@dataforseo-agent/schema/reference"
export { WebSearch } from "@dataforseo-agent/schema/websearch"
export { AbsolutePath, RelativePath } from "@dataforseo-agent/schema/schema"
export { Session } from "@dataforseo-agent/schema/session"
export { SessionInbox } from "@dataforseo-agent/schema/session-inbox"
export { SessionMessage } from "@dataforseo-agent/schema/session-message"
export { Skill } from "@dataforseo-agent/schema/skill"
export { Prompt } from "@dataforseo-agent/schema/prompt"
export { PromptInput } from "@dataforseo-agent/schema/prompt-input"
export type { DataForSEOAgentEvent } from "@dataforseo-agent/protocol/groups/event"
export type DataForSEOAgentClient = Effect.Success<ReturnType<typeof DataForSEOAgent.make>>
