import { describe, expect, test } from "bun:test"
import { permissionPresentation } from "../../src/util/permission"

test("preserves permission roots and self-contained metadata", () => {
  expect(permissionPresentation({ action: "external_directory", resources: ["/*"] }).title).toBe(
    "Access external directory /",
  )
  expect(permissionPresentation({ action: "external_directory", resources: ["C:/*"] }).title).toBe(
    "Access external directory C:/",
  )
  expect(
    permissionPresentation({ action: "webfetch", resources: [], metadata: { url: "https://example.com" } }),
  ).toMatchObject({
    title: "WebFetch https://example.com",
    lines: ["URL: https://example.com"],
  })
  expect(permissionPresentation({ action: "websearch", resources: [], metadata: { query: "releases" } })).toMatchObject(
    {
      title: 'Web Search "releases"',
      lines: ["Query: releases"],
    },
  )
})

describe("DataForSEO request permission", () => {
  test("shows method, path and body of an api_request", () => {
    const info = permissionPresentation({
      action: "dataforseo_api_request",
      resources: ["/v3/serp/google/organic/live/advanced"],
      metadata: { input: { method: "post", path: "/v3/serp/google/organic/live/advanced", data: [{ keyword: "seo", depth: 10 }] } },
    })
    expect(info.title).toBe("POST /v3/serp/google/organic/live/advanced")
    expect(info.lines.join("\n")).toContain('"keyword":"seo"')
    expect(info.lines.join("\n")).toMatch(/List price|Price unknown|Free endpoint/)
  })
})
