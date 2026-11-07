import { NodeFileSystem } from "@effect/platform-node"
import { compile, emitEffectImported, emitEffectShape, emitPromise, write } from "@dataforseo-agent/httpapi-codegen"
import {
  ClientApi,
  clientNamespace,
  effectOmitEndpoints,
  groupNames,
  promiseOmitEndpoints,
} from "@dataforseo-agent/protocol/client"
import { Agent } from "@dataforseo-agent/schema/agent"
import { Artifact } from "@dataforseo-agent/schema/artifact"
import { Command } from "@dataforseo-agent/schema/command"
import { Config } from "@dataforseo-agent/schema/config"
import { Credential } from "@dataforseo-agent/schema/credential"
import { Event } from "@dataforseo-agent/schema/event"
import { EventLog } from "@dataforseo-agent/schema/event-log"
import { FileDiff } from "@dataforseo-agent/schema/file-diff"
import { FileSystem } from "@dataforseo-agent/schema/filesystem"
import { Form } from "@dataforseo-agent/schema/form"
import { Generate } from "@dataforseo-agent/schema/generate"
import { Instruction } from "@dataforseo-agent/schema/instruction"
import { InstructionEntry } from "@dataforseo-agent/schema/instruction-entry"
import { Integration } from "@dataforseo-agent/schema/integration"
import { Job } from "@dataforseo-agent/schema/job"
import { Location } from "@dataforseo-agent/schema/location"
import { Mcp } from "@dataforseo-agent/schema/mcp"
import { Model } from "@dataforseo-agent/schema/model"
import { Money } from "@dataforseo-agent/schema/money"
import { Permission } from "@dataforseo-agent/schema/permission"
import { PermissionSaved } from "@dataforseo-agent/schema/permission-saved"
import { Plugin } from "@dataforseo-agent/schema/plugin"
import { Project } from "@dataforseo-agent/schema/project"
import { Worktree } from "@dataforseo-agent/schema/worktree"
import { AgentAttachment, FileAttachment, Prompt, PromptMention } from "@dataforseo-agent/schema/prompt"
import { PromptInput } from "@dataforseo-agent/schema/prompt-input"
import { Provider } from "@dataforseo-agent/schema/provider"
import { Pty } from "@dataforseo-agent/schema/pty"
import { PtyTicket } from "@dataforseo-agent/schema/pty-ticket"
import { Question } from "@dataforseo-agent/schema/question"
import { Reference } from "@dataforseo-agent/schema/reference"
import { AbsolutePath, RelativePath } from "@dataforseo-agent/schema/schema"
import { Schedule } from "@dataforseo-agent/schema/schedule"
import { Session } from "@dataforseo-agent/schema/session"
import { SessionMessage } from "@dataforseo-agent/schema/session-message"
import { SessionInbox } from "@dataforseo-agent/schema/session-inbox"
import { Shell } from "@dataforseo-agent/schema/shell"
import { Skill } from "@dataforseo-agent/schema/skill"
import { Snapshot } from "@dataforseo-agent/schema/snapshot"
import { Vcs } from "@dataforseo-agent/schema/vcs"
import { WebSearch } from "@dataforseo-agent/schema/websearch"
import { Workspace } from "@dataforseo-agent/schema/workspace"
import { Effect, Schema } from "effect"
import { fileURLToPath } from "url"

const promiseContract = compile(ClientApi, {
  groupNames,
  omitEndpoints: promiseOmitEndpoints,
  namespace: clientNamespace,
  aliases: true,
})
const effectContract = compile(ClientApi, {
  groupNames,
  omitEndpoints: effectOmitEndpoints,
  namespace: clientNamespace,
  aliases: true,
})
const effectTypeReferences = [
  ...namespaceTypes("Agent", "@dataforseo-agent/schema/agent", Agent),
  ...namespaceTypes("Artifact", "@dataforseo-agent/schema/artifact", Artifact),
  ...namespaceTypes("Command", "@dataforseo-agent/schema/command", Command),
  ...namespaceTypes("Config", "@dataforseo-agent/schema/config", Config),
  ...namespaceTypes("Credential", "@dataforseo-agent/schema/credential", Credential),
  ...namespaceTypes("Event", "@dataforseo-agent/schema/event", Event),
  ...namespaceTypes("EventLog", "@dataforseo-agent/schema/event-log", EventLog),
  ...namespaceTypes("FileDiff", "@dataforseo-agent/schema/file-diff", FileDiff),
  ...namespaceTypes("FileSystem", "@dataforseo-agent/schema/filesystem", FileSystem),
  ...namespaceTypes("Form", "@dataforseo-agent/schema/form", Form),
  ...namespaceTypes("Generate", "@dataforseo-agent/schema/generate", Generate),
  ...namespaceTypes("Instruction", "@dataforseo-agent/schema/instruction", Instruction),
  ...namespaceTypes("InstructionEntry", "@dataforseo-agent/schema/instruction-entry", InstructionEntry),
  ...namespaceTypes("Integration", "@dataforseo-agent/schema/integration", Integration),
  ...namespaceTypes("Job", "@dataforseo-agent/schema/job", Job),
  typeReference("Location.PublicRef", "@dataforseo-agent/schema/location", Location.PublicRef),
  typeReference("Location.PublicInfo", "@dataforseo-agent/schema/location", Location.PublicInfo),
  ...namespaceTypes("Mcp", "@dataforseo-agent/schema/mcp", Mcp),
  ...namespaceTypes("Model", "@dataforseo-agent/schema/model", Model),
  ...namespaceTypes("Money", "@dataforseo-agent/schema/money", Money),
  ...namespaceTypes("Permission", "@dataforseo-agent/schema/permission", Permission),
  ...namespaceTypes("PermissionSaved", "@dataforseo-agent/schema/permission-saved", PermissionSaved),
  ...namespaceTypes("Plugin", "@dataforseo-agent/schema/plugin", Plugin),
  ...namespaceTypes("Project", "@dataforseo-agent/schema/project", Project),
  ...namespaceTypes("Worktree", "@dataforseo-agent/schema/worktree", Worktree),
  ...namespaceTypes("PromptInput", "@dataforseo-agent/schema/prompt-input", PromptInput),
  ...namespaceTypes("Provider", "@dataforseo-agent/schema/provider", Provider),
  ...namespaceTypes("Pty", "@dataforseo-agent/schema/pty", Pty),
  ...namespaceTypes("PtyTicket", "@dataforseo-agent/schema/pty-ticket", PtyTicket),
  ...namespaceTypes("Question", "@dataforseo-agent/schema/question", Question),
  ...namespaceTypes("Reference", "@dataforseo-agent/schema/reference", Reference),
  ...namespaceTypes("Schedule", "@dataforseo-agent/schema/schedule", Schedule),
  ...namespaceTypes("Session", "@dataforseo-agent/schema/session", Session),
  ...namespaceTypes("SessionMessage", "@dataforseo-agent/schema/session-message", SessionMessage),
  ...namespaceTypes("SessionInbox", "@dataforseo-agent/schema/session-inbox", SessionInbox),
  ...namespaceTypes("Shell", "@dataforseo-agent/schema/shell", Shell),
  ...namespaceTypes("Skill", "@dataforseo-agent/schema/skill", Skill),
  ...namespaceTypes("Snapshot", "@dataforseo-agent/schema/snapshot", Snapshot),
  ...namespaceTypes("Vcs", "@dataforseo-agent/schema/vcs", Vcs),
  ...namespaceTypes("WebSearch", "@dataforseo-agent/schema/websearch", WebSearch),
  ...namespaceTypes("Workspace", "@dataforseo-agent/schema/workspace", Workspace),
  typeReference("Prompt", "@dataforseo-agent/schema/prompt", Prompt),
  typeReference("PromptMention", "@dataforseo-agent/schema/prompt", PromptMention),
  typeReference("FileAttachment", "@dataforseo-agent/schema/prompt", FileAttachment),
  typeReference("AgentAttachment", "@dataforseo-agent/schema/prompt", AgentAttachment),
  typeReference("AbsolutePath", "@dataforseo-agent/schema/schema", AbsolutePath),
  typeReference("RelativePath", "@dataforseo-agent/schema/schema", RelativePath),
]

await Effect.runPromise(
  Effect.all(
    [
      write(
        emitPromise(promiseContract, {
          mutableOutputs: true,
        }),
        fileURLToPath(new URL("../src/promise/generated", import.meta.url)),
      ),
      write(
        emitEffectImported(effectContract, {
          module: "../../contract",
          api: "ClientApi",
          shapeModule: "../api/api.js",
        }),
        fileURLToPath(new URL("../src/effect/generated", import.meta.url)),
      ),
      write(
        emitEffectShape(effectContract, {
          typeReferences: effectTypeReferences,
          outputTypes: {
            "event.subscribe": {
              name: "DataForSEOAgentEvent",
              import: 'import type { DataForSEOAgentEvent } from "@dataforseo-agent/protocol/groups/event"',
            },
          },
        }),
        fileURLToPath(new URL("../src/effect/api", import.meta.url)),
      ),
    ],
    { concurrency: 3, discard: true },
  ).pipe(Effect.provide(NodeFileSystem.layer)),
)

function namespaceTypes(namespace: string, module: string, values: object) {
  return Object.entries(values).flatMap(([name, schema]) =>
    Schema.isSchema(schema) ? [typeReference(`${namespace}.${name}`, module, schema)] : [],
  )
}

function typeReference(name: string, module: string, schema: Schema.Top) {
  return {
    schema,
    name,
    import: `import type { ${name.split(".")[0]} } from ${JSON.stringify(module)}`,
  }
}
