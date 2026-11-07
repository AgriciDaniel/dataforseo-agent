export * as RetainedImage from "./retained-image"

import { Effect, FileSystem } from "effect"
import { randomBytes } from "node:crypto"
import path from "node:path"

// Windows refuses to delete the last hard link of a running executable, and bun 1.4 spins
// forever when its package replacement meets one. Any other link to the image can be removed,
// so a process that must survive an installer keeps a second link to its own image while it
// runs. Windows reuses process IDs quickly, so names carry a random suffix and only links of
// processes that no longer exist are swept.
const pattern = /^dataforseo-agent-service-(\d+)-[0-9a-f]+\.exe$/

/** Hold a second link to the running image in `directory` for the lifetime of the scope. */
export const retain = Effect.fnUntraced(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem
  return yield* Effect.acquireRelease(
    Effect.gen(function* () {
      yield* fs.makeDirectory(directory, { recursive: true }).pipe(Effect.ignore)
      const names = yield* fs.readDirectory(directory).pipe(Effect.orElseSucceed((): string[] => []))
      yield* Effect.forEach(names, (name) =>
        Effect.gen(function* () {
          const pid = Number(pattern.exec(name)?.[1])
          if (!pid || (yield* alive(pid))) return
          yield* fs.remove(path.join(directory, name)).pipe(Effect.ignore)
        }),
      )
      const target = path.join(directory, `dataforseo-agent-service-${process.pid}-${randomBytes(4).toString("hex")}.exe`)
      const executable = yield* fs.realPath(process.execPath).pipe(Effect.orElseSucceed(() => process.execPath))
      return yield* fs.link(executable, target).pipe(
        Effect.as(target),
        Effect.tapError((cause) => Effect.logWarning("could not link the running binary", { cause })),
        Effect.orElseSucceed(() => undefined),
      )
    }),
    // The last link of a still-running image refuses deletion; a later sweep removes it.
    (target) => (target === undefined ? Effect.void : fs.remove(target).pipe(Effect.ignore)),
  )
})

/**
 * Whether the running binary was installed by a package manager or the curl installer, the installs
 * whose upgrades replace it in place.
 */
export function installed(home: string) {
  const runtime = path.basename(process.execPath, path.extname(process.execPath)).toLowerCase()
  if (runtime === "bun" || runtime === "node" || runtime === "nodejs") return false
  const executable = path.resolve(process.execPath)
  return (
    executable.split(path.sep).includes("node_modules") ||
    /[\\/]winget[\\/]packages[\\/]/i.test(executable) ||
    executable === path.resolve(home, ".dataforseo-agent", "bin", "dataforseo-agent.exe")
  )
}

// Only ESRCH means the process is gone; EPERM is a live process this user cannot open.
const alive = (pid: number) =>
  Effect.try({ try: () => process.kill(pid, 0), catch: (cause) => cause }).pipe(
    Effect.as(true),
    Effect.catch((cause) => Effect.succeed(!(cause instanceof Error && "code" in cause && cause.code === "ESRCH"))),
  )
