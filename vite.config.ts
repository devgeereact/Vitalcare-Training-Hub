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

  build: {
    // Route splitting alone still leaves every heavy dependency in whichever
    // chunk happens to import it first, so a marketing visitor could pull the
    // charting or spreadsheet library through a shared import. Pin the large
    // third-party packages into their own chunks: they are then fetched only by
    // the routes that use them, and they cache across deploys because their
    // contents change only when the dependency does.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Rollup's own CommonJS interop helpers are shared by many packages.
          // Left to itself Rollup files them into whichever vendor chunk asks
          // first, and the entry then has to download that whole chunk (400kB
          // of PDF code, say) to get one helper function. Give them a home.
          if (id.includes("commonjsHelpers") || id.includes("vite/preload-helper")) {
            return "vendor-helpers"
          }
          if (!id.includes("node_modules")) return undefined

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return "vendor-react"
          }
          if (id.includes("@supabase")) return "vendor-supabase"
          if (id.includes("apexcharts") || id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts"
          }
          if (id.includes("@fullcalendar")) return "vendor-calendar"
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-editor"
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf"
          if (id.includes("exceljs") || id.includes("xlsx")) return "vendor-spreadsheet"
          if (id.includes("mammoth")) return "vendor-docx"
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) {
            return "vendor-motion"
          }
          if (id.includes("@tanstack")) return "vendor-query"
          // Everything else stays where Rollup puts it, which is beside the
          // route that uses it. A catch-all "vendor" chunk would undo the
          // splitting by making one download serve every page.
          return undefined
        },
      },
    },
    // The entry chunk should stay small enough that this never fires.
    chunkSizeWarningLimit: 900,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
