import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure Supabase is pre‑bundled so Vite can find its ESM files
  optimizeDeps: {
    include: ["@supabase/supabase-js"],
  },
})

