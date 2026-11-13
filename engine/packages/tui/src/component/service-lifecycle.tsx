import { createEffect, onCleanup, untrack } from "solid-js"
import { useClient } from "../context/client"
import { useData } from "../context/data"
import { useExit } from "../context/exit"
import { Keymap } from "../context/keymap"
import { useRoute } from "../context/route"
import { useTuiLifecycle } from "../context/runtime"
import { useStorage } from "../context/storage"
import { useToast } from "../ui/toast"

export function ServiceLifecycle(props: { managed: boolean; standalone?: boolean; restore: boolean }) {
  const client = useClient()
  const data = useData()
  const exit = useExit()
  const route = useRoute()
  const toast = useToast()
  const storage = useStorage()
  const [saved, update] = storage.store<{ pid?: number; sessionID?: string }>("service-attachment", {
    initial: {},
  })
  // Keep this registered through Solid disposal so process exit waits for queued layout writes.
  useTuiLifecycle().add(() =>
    storage.flush().catch(() => {
      process.stderr.write("Could not save TUI layout; open chats from Sessions next time.\n")
    }),
  )
  const last = untrack(() => saved.sessionID)
  let initialized = false

  Keymap.createLayer(() => ({
    mode: "global",
    commands: [
      {
        id: "app.detach",
        title: "Detach (keep chats running)",
        group: "System",
        palette: true,
        bind: false,
        slash: { name: "detach" },
        run: () => {
          if (props.managed) return exit()
          toast.show({ variant: "warning", message: "Detach requires the background service; start with dataforseo." })
        },
      },
    ],
  }))

  // Prompt layers reuse app.exit to reject or cancel. Under the service it must detach instead.
  Keymap.createLayer(() => ({
    mode: "global",
    priority: 1000,
    enabled: () =>
      props.managed &&
      route.data.type === "session" &&
      data.session
        .family(route.data.sessionID)
        .concat(route.data.sessionID)
        .some(
          (id) => (data.session.permission.list(id)?.length ?? 0) > 0 || (data.session.form.list(id)?.length ?? 0) > 0,
        ),
    commands: [
      { id: "app.exit", title: "Detach (keep chats running)", group: "System", bind: false, run: () => exit() },
    ],
    bindings: ["app.exit"],
  }))

  createEffect(() => {
    if (client.connection.status() !== "connected") return
    let stale = false
    onCleanup(() => {
      stale = true
    })
    void Promise.all([client.api.server.info(), client.api.session.active()])
      .then(async ([info]) => {
        if (stale) return
        if (props.standalone && !initialized)
          toast.show({
            variant: "warning",
            message: "Standalone mode: closing this TUI stops running work and terminals.",
          })
        if (props.managed && saved.pid !== undefined && saved.pid !== info.pid)
          toast.show({
            variant: "warning",
            message: "Service restarted; pending approvals or questions may need to be asked again.",
            duration: 15000,
          })
        if (!initialized && props.restore && last) {
          await data.session.sync(last)
          if (stale) return
          if (!data.session.get(last))
            toast.show({
              variant: "warning",
              message: "The previous chat could not be restored; open it from Sessions.",
            })
          else if (route.data.type === "home") route.navigate({ type: "session", sessionID: last })
        }
        initialized = true
        await update((draft) => {
          draft.pid = info.pid
        })
      })
      .catch(() => {
        if (!stale)
          toast.show({
            variant: "warning",
            message: "Could not restore the previous connection; open chats from Sessions.",
          })
      })
  })

  createEffect(() => {
    if (client.connection.status() !== "connected" || route.data.type !== "session") return
    const sessionID = route.data.sessionID
    if (sessionID === "dummy") return
    let stale = false
    onCleanup(() => {
      stale = true
    })
    void Promise.all([data.session.permission.sync(sessionID), data.session.form.sync(sessionID)]).catch(() => {
      if (!stale)
        toast.show({ variant: "warning", message: "Could not restore approvals or questions; reconnect to try again." })
    })
  })

  createEffect(() => {
    if (route.data.type !== "session" || route.data.sessionID === "dummy") return
    const sessionID = route.data.sessionID
    void update((draft) => {
      draft.sessionID = sessionID
    }).catch(() =>
      toast.show({ variant: "warning", message: "Could not save the open chat for your next connection." }),
    )
  })
  return null
}

export async function detachMessage(api: {
  session: { active: (input: { signal: AbortSignal }) => Promise<Record<string, unknown>> }
}) {
  const active = await api.session.active({ signal: AbortSignal.timeout(1500) }).catch(() => undefined)
  return active === undefined
    ? "Detached; running chat count unavailable. Come back with dataforseo."
    : `Detached; ${Object.keys(active).length} chats still running. Come back with dataforseo.`
}
