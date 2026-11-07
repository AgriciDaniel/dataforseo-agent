import { expect, test } from "bun:test"
import { App } from "@dataforseo-agent/core/app"

test("formats app metadata as a user agent", () => {
  expect(App.useragent(App.make({ name: "sdk", version: "1.2.3", channel: "beta" }))).toBe("dataforseo-agent/beta/1.2.3/sdk")
})
