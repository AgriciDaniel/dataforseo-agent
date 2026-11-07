import { createRequire } from "node:module"

declare const DATAFORSEO_AGENT_LIBC: string | undefined

// Lazy: on workerd import.meta.url is undefined and the watcher is never
// loaded, so createRequire must not run at module scope.
export default function load() {
  const require = createRequire(import.meta.url)
  const libc = typeof DATAFORSEO_AGENT_LIBC === "undefined" ? undefined : DATAFORSEO_AGENT_LIBC
  return require(
    process.env.DATAFORSEO_AGENT_PARCEL_WATCHER_PATH ??
      `@parcel/watcher-${process.platform}-${process.arch}${process.platform === "linux" ? `-${libc || "glibc"}` : ""}`,
  )
}
