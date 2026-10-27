import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Tests run against the repo root, not vite.config.ts's `client` root — the data
 * pipeline reads `data/cohort.json` and writes to a temp directory.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  /**
   * `tsconfig.json` sets `jsx: "preserve"` for the Vite React plugin, which does the
   * transform in the app build. Vitest runs without that plugin, so the automatic
   * runtime is named here — component tests render through `react-dom/server`.
   */
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "client/src/**/*.test.{ts,tsx}"],
  },
});
