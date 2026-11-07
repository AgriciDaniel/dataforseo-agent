import { NodeServices } from "@effect/platform-node"
import { expect } from "bun:test"
import { Effect, FileSystem } from "effect"
import { realpathSync, statSync } from "node:fs"
import path from "node:path"
import { RetainedImage } from "../src/services/retained-image"
import { testEffect } from "../../core/test/lib/effect"

const it = testEffect(NodeServices.layer)
// Hard links to a running image are a Windows concern, and /tmp is often another filesystem elsewhere.
const windows = process.platform === "win32" ? it.live : it.live.skip

windows("retain hard-links the running image for the scope and sweeps only links of exited processes", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const directory = yield* fs.makeTempDirectoryScoped({ prefix: "dataforseo-agent-retained-" })
    // pid 999999999 does not exist; pid 4 is System, alive but not openable (EPERM).
    const kept = ["dataforseo-agent-service-4-aa.exe", `dataforseo-agent-service-${process.pid}-bb.exe`, "unrelated.exe"]
    yield* Effect.forEach([...kept, "dataforseo-agent-service-999999999-cc.exe"], (name) =>
      fs.writeFileString(path.join(directory, name), name),
    )
    const image = statSync(realpathSync(process.execPath))
    yield* Effect.scoped(
      Effect.gen(function* () {
        const link = yield* RetainedImage.retain(directory)
        if (!link) return yield* Effect.die("Expected a link")
        expect(path.basename(link)).toMatch(new RegExp(`^dataforseo-agent-service-${process.pid}-[0-9a-f]{8}\\.exe$`))
        expect(statSync(link).ino).toBe(image.ino)
        expect(statSync(link).nlink).toBe(image.nlink + 1)
        expect((yield* fs.readDirectory(directory)).sort()).toEqual([...kept, path.basename(link)].sort())
      }),
    )
    // The running test process does not lock the image's other links, so the release removes it.
    expect((yield* fs.readDirectory(directory)).sort()).toEqual(kept.sort())
  }),
)

windows("retain tolerates a directory it cannot link into", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const root = yield* fs.makeTempDirectoryScoped({ prefix: "dataforseo-agent-retained-" })
    const file = path.join(root, "not-a-directory")
    yield* fs.writeFileString(file, "")
    expect(yield* Effect.scoped(RetainedImage.retain(file))).toBeUndefined()
  }),
)

windows("installed accepts package-manager and curl binaries only", () =>
  Effect.gen(function* () {
    const home = path.join("C:", "Users", "someone")
    const original = process.execPath
    yield* Effect.addFinalizer(() => Effect.sync(() => (process.execPath = original)))
    const cases = [
      [path.join(home, ".bun", "install", "global", "node_modules", "@dataforseo-agent", "cli", "bin", "dataforseo-agent.exe"), true],
      [path.join(home, ".dataforseo-agent", "bin", "dataforseo-agent.exe"), true],
      [
        path.join(
          home,
          "AppData",
          "Local",
          "Microsoft",
          "WinGet",
          "Packages",
          "Anomaly.DataForSEOAgent_Microsoft.Winget.Source_8wekyb3d8bbwe",
          "dataforseo-agent.exe",
        ),
        true,
      ],
      [path.join(home, "AppData", "Local", "Programs", "DataForSEO Agent", "resources", "dataforseo-agent-cli.exe"), false],
      [path.join(home, "node_modules", "bun", "bin", "bun.exe"), false],
    ] as const
    const results = cases.map(([executable]) => {
      process.execPath = executable
      return RetainedImage.installed(home)
    })
    expect(results).toEqual(cases.map(([, expected]) => expected))
  }),
)
