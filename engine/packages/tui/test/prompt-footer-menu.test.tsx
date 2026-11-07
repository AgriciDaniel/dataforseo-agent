import { expect, test } from "bun:test"
import { directory, json } from "./fixture/tui-client"
import { tmpdir } from "./fixture/fixture"
import { createAppFixture } from "./fixture/app"

// DataForSEO Agent: clicking the agent or the model under the prompt opens a dropdown to switch.
test("clicking the agent or model in the prompt footer opens a dropdown that switches it", async () => {
  await using state = await tmpdir()
  const mutations: { type: string; body: unknown }[] = []
  const location = { directory, project: { id: "project", directory, canonical: directory } }
  const session = {
    id: `ses_${crypto.randomUUID()}`,
    projectID: "project",
    title: "Footer menu fixture",
    agent: "general",
    model: { providerID: "demo", id: "first" },
    location: { directory },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    time: { created: 0, updated: 0 },
  }
  await using setup = await createAppFixture({
    state: state.path,
    width: 110,
    config: { animations: false, session: { sidebar: "hide" } },
    args: { sessionID: session.id },
    fetch: async (url, request) => {
      if (url.pathname === "/api/location") return json(location)
      if (url.pathname === "/api/agent")
        return json({
          location,
          data: [
            { id: "general", mode: "primary", hidden: false, permissions: [], description: "Everyday DataForSEO work" },
            { id: "onpage", mode: "primary", hidden: false, permissions: [], description: "Site audits" },
          ],
        })
      if (url.pathname === "/api/provider") return json({ location, data: [{ id: "demo", name: "Demo" }] })
      if (url.pathname === "/api/model")
        return json({
          location,
          data: ["first", "second"].map((id) => ({
            id,
            providerID: "demo",
            name: `${id} model`,
            variants: [],
            cost: [],
            time: { released: 0 },
          })),
        })
      if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
      if (/^\/api\/session\/[^/]+\/(message|inbox|permission)$/.test(url.pathname))
        return json({ data: [], cursor: {} })
      const type = url.pathname.match(/^\/api\/session\/[^/]+\/(agent|model)$/)?.[1]
      if (!type) return
      mutations.push({ type, body: await request.json() })
      return new Response(null, { status: 204 })
    },
  })
  const find = (text: string) => {
    const lines = setup.captureCharFrame().split("\n")
    const row = lines.findLastIndex((line) => line.includes(text))
    return { x: lines[row].indexOf(text), y: row }
  }
  await setup.ready
  await setup.waitForFrame((frame) => frame.includes("General · first model"))
  expect(setup.captureCharFrame()).toContain("auto-allow paid calls: off")

  const agent = find("General · first model")
  await setup.mockMouse.click(agent.x + 1, agent.y)
  await setup.waitForFrame((frame) => frame.includes("Site audits"))
  console.log(setup.captureCharFrame().split("\n").slice(-14).join("\n"))
  // Typing in the prompt closes the menu, and Enter then submits instead of switching the agent.
  await setup.mockInput.typeText("x")
  await setup.waitForFrame((frame) => !frame.includes("Site audits"))
  expect(setup.captureCharFrame()).toContain("General · first model")
  setup.mockInput.pressBackspace()
  await setup.mockMouse.click(agent.x + 1, agent.y)
  await setup.waitForFrame((frame) => frame.includes("Site audits"))
  const onpage = find("○ OnPage")
  await setup.mockMouse.click(onpage.x + 3, onpage.y)
  await setup.waitForFrame((frame) => frame.includes("OnPage · first model") && !frame.includes("Site audits"))
  // A switch is never silent.
  await setup.waitForFrame((frame) => frame.includes("Now using OnPage"))

  const model = find("· first model")
  await setup.mockMouse.click(model.x + 3, model.y)
  await setup.waitForFrame((frame) => frame.includes("All models…") && frame.includes("○ second model"))
  console.log(setup.captureCharFrame().split("\n").slice(-12).join("\n"))
  const second = find("○ second model")
  await setup.mockMouse.click(second.x + 3, second.y)
  await setup.waitForFrame((frame) => frame.includes("OnPage · second model") && !frame.includes("All models…"))

  const toggle = find("auto-allow paid calls: off")
  await setup.mockMouse.click(toggle.x + 2, toggle.y)
  await setup.waitForFrame((frame) => frame.includes("auto-allow paid calls: on"))
})
