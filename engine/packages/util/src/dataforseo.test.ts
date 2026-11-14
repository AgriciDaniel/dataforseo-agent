import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  billedCost,
  reportedCost,
  minimumCost,
  priceLine,
  requestPath,
  requestShape,
  requestTarget,
  reachesPaidApi,
} from "./dataforseo.js"

describe("requestPath", () => {
  test("gives one canonical form for the shapes models send", () => {
    expect(requestPath("/v3/appendix/user_data")).toBe("/v3/appendix/user_data")
    expect(requestPath("v3/appendix/user_data/")).toBe("/v3/appendix/user_data")
    expect(requestPath("/appendix/user_data")).toBe("/v3/appendix/user_data")
    expect(requestPath("/v3/serp/google/organic/task_get/advanced/11081723-1535-0066-0000-5b2b0b9c2a1d")).toBe(
      "/v3/serp/google/organic/task_get/advanced/11081723-1535-0066-0000-5b2b0b9c2a1d",
    )
  })

  test("refuses paths that could match a free rule they are not", () => {
    expect(requestPath("/v3/serp/google/organic/live/advanced?x=/appendix/user_data")).toBeUndefined()
    expect(requestPath("/v3/serp/*/user_data")).toBeUndefined()
    expect(requestPath("/v3/../appendix/user_data")).toBeUndefined()
    expect(requestPath("/v3/serp google")).toBeUndefined()
    expect(requestPath("")).toBeUndefined()
    expect(requestPath(42)).toBeUndefined()
  })
})

describe("billedCost", () => {
  test("reads the top-level cost, including exponent notation", () => {
    expect(billedCost(JSON.parse('{"cost":5e-05,"tasks":[{"cost":5e-05,"result":[{"cost":1234.5}]}]}'))).toBe(0.00005)
  })

  test("sums task costs when the top-level cost is missing, ignoring nested result fields", () => {
    expect(billedCost({ tasks: [{ cost: 0.002, result: [{ cost: 99 }] }, { cost: 0.003 }] })).toBeCloseTo(0.005, 9)
  })

  test("accounting distinguishes missing billing from explicit zero", () => {
    expect(reportedCost({ cost: 0, tasks: [{ cost: 2 }] })).toBe(0)
    expect(reportedCost({ tasks: [{ cost: 0 }] })).toBe(0)
    expect(reportedCost({ tasks: [{}] })).toBeUndefined()
    expect(reportedCost({})).toBeUndefined()
    expect(reportedCost({ cost: "0" })).toBeUndefined()
  })

  test("is 0 for anything that is not a response", () => {
    expect(billedCost(undefined)).toBe(0)
    expect(billedCost("cost: 3")).toBe(0)
    expect(billedCost({ cost: "3" })).toBe(0)
  })
})

describe("priceLine", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dfa-prices-"))
  writeFileSync(
    path.join(dir, "prices.json"),
    JSON.stringify({
      "/v3/serp/google/organic/live/advanced": {
        unit: "per_serp",
        usd: 0.002,
        price: "$0.002",
        per: "Per SERP 10 results",
      },
      "/v3/backlinks/summary/live": { unit: "per_task", usd: 0.02, price: "$0.02", per: "Per task" },
      "/v3/ai_optimization/chat_gpt/llm_responses/task_post": {
        unit: "per_task",
        usd: 0.0002,
        price: "$0.0002 + $0.01 advance payment",
        per: "Per task",
      },
      "/v3/serp/google/organic/task_get/advanced/{id}": { unit: "free", usd: 0 },
      "/v3/serp/google/maps/task_post": {
        unit: "per_serp",
        usd: 0.0006,
        price: "$0.0006",
        per: "Per SERP 100 results",
        priority_usd: 0.0012,
        priority_price: "$0.0012",
      },
    }),
  )
  const previous = process.env.DATAFORSEO_AGENT_CONFIG_DIR
  beforeAll(() => {
    process.env.DATAFORSEO_AGENT_CONFIG_DIR = dir
  })
  afterAll(() => {
    if (previous === undefined) delete process.env.DATAFORSEO_AGENT_CONFIG_DIR
    else process.env.DATAFORSEO_AGENT_CONFIG_DIR = previous
  })

  test("per-task prices show the total for the request", () => {
    expect(priceLine("/v3/backlinks/summary/live", 3)).toBe("List price $0.02 per task, $0.06 for 3 tasks.")
  })
  test("other units show the unit and say the bill depends on results", () => {
    expect(priceLine("/v3/serp/google/organic/live/advanced", 1)).toBe(
      "List price $0.002 per SERP 10 results. The bill depends on the results.",
    )
  })
  test("a per-task price with extra charges shows the catalog text and a minimum", () => {
    expect(priceLine("/v3/ai_optimization/chat_gpt/llm_responses/task_post", 3)).toBe(
      "List price $0.0002 + $0.01 advance payment per task, at least $0.0306 for 3 tasks. The bill depends on the results.",
    )
    expect(priceLine("/v3/serp/google/organic/live/advanced", 9)).toBe(
      "List price $0.002 per SERP 10 results, at least $0.018 for 9 tasks. The bill depends on the results.",
    )
  })
  test("a priority 2 request uses the priority queue price", () => {
    expect(priceLine("/v3/serp/google/maps/task_post", 9)).toBe(
      "List price $0.0006 per SERP 100 results, at least $0.0054 for 9 tasks. The bill depends on the results.",
    )
    expect(priceLine("/v3/serp/google/maps/task_post", 9, true)).toBe(
      "List price $0.0012 per SERP 100 results, priority queue, at least $0.0108 for 9 tasks. The bill depends on the results.",
    )
    expect(minimumCost("/v3/serp/google/maps/task_post", 9, true)).toBeCloseTo(0.0108)
    expect(requestShape({ data: [{ priority: 2 }, { priority: 1 }] })).toEqual({ tasks: 2, priority: true })
  })
  test("placeholder paths match, free endpoints say so, unknown ones say so", () => {
    expect(priceLine("/v3/serp/google/organic/task_get/advanced/abc-123", 1)).toBe(
      "Free endpoint (catalog list price $0).",
    )
    expect(priceLine("/v3/nope/live", 1)).toBe("Price unknown: this endpoint is not in the catalog.")
  })
})

describe("requestTarget", () => {
  test("uses path when there is no url", () => {
    expect(requestTarget({ path: "/v3/serp/google/locations" })).toBe("/v3/serp/google/locations")
  })
  test("a url wins over path, as on the server, and must be the DataForSEO API", () => {
    expect(
      requestTarget({
        path: "/v3/serp/google/locations",
        url: "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      }),
    ).toBe("/v3/serp/google/organic/live/advanced")
    expect(requestTarget({ url: "https://evil.example/v3/serp/google/locations" })).toBeUndefined()
    expect(requestTarget({ url: "http://api.dataforseo.com/v3/appendix/user_data" })).toBeUndefined()
    expect(requestTarget({ url: "https://api.dataforseo.com/v3/appendix/user_data?x=1" })).toBeUndefined()
    expect(requestTarget({ url: 42 })).toBeUndefined()
  })
})

describe("reachesPaidApi", () => {
  test("catches direct calls to the live API from the shell", () => {
    expect(reachesPaidApi(`curl -u "$L:$P" https://api.dataforseo.com/v3/serp/google/organic/live/advanced -d @body.json`)).toBe(true)
    expect(reachesPaidApi("wget -qO- HTTPS://API.DataForSEO.com/v3/appendix/user_data")).toBe(true)
    expect(reachesPaidApi("python -c \"import requests; requests.post('https://api.dataforseo.com/v3/x')\"")).toBe(true)
  })

  test("leaves the sandbox, the docs and unrelated hosts alone", () => {
    expect(reachesPaidApi("curl https://sandbox.dataforseo.com/v3/serp/google/organic/live/advanced")).toBe(false)
    expect(reachesPaidApi("curl https://docs.dataforseo.com/v3/")).toBe(false)
    expect(reachesPaidApi("curl https://myapi.dataforseo.com.example.org/")).toBe(false)
    expect(reachesPaidApi("ls -la && echo dataforseo")).toBe(false)
  })
})
