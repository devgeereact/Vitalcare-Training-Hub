import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import { loadEnv } from "vite"

/**
 * Two test projects, because they need different things.
 *
 * "unit" runs in jsdom against the source: pure logic and component behaviour,
 * no network, fast enough to run on every commit.
 *
 * "security" runs in node against a real Supabase project, signing in as real
 * accounts to prove what each role can and cannot read. Authorisation cannot be
 * proved with mocks: the thing being tested is the database's own policies, so
 * a mock would only test the mock. It is skipped unless credentials are present.
 */
// The authorisation suite reads project URL, key and account credentials from
// the environment. .env.test.local holds them locally and is git-ignored.
const env = {
  ...loadEnv("test", process.cwd(), ""),
  ...process.env,
}
for (const [k, v] of Object.entries(env)) {
  if (v !== undefined) process.env[k] = v as string
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "security",
          environment: "node",
          globals: true,
          include: ["tests/security/**/*.test.ts"],
          // Signing in and reading over the network is slower than a unit test,
          // and running these in parallel would fight over rate limits.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
})
