import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/**/*.sql.ts", "./src/**/sql.ts"],
  out: "./migration",
  dbCredentials: {
    // Only used by drizzle-kit when working on migrations: point it at a local database.
    url: process.env.DATAFORSEO_AGENT_DB ?? "./dataforseo-agent.db",
  },
})
