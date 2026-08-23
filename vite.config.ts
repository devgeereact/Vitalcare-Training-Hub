import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  base: "/",
  envPrefix: "VITE_",

  // Project block 13 in the workspace port scheme
  // (see ~/.claude/CLAUDE.md, "Dev-server ports").
  // strictPort so a clash fails loudly instead of drifting to a random port —
  // a drifted port surfaces as an opaque CORS error or a rejected auth
  // redirect, never as "port in use". preview uses the same port as dev so it
  // does not drift to the shared 4173 default either.
  server: {
    port: 5132,
    strictPort: true,
  },
  preview: {
    port: 5132,
    strictPort: true,
  },

  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
