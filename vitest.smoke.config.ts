import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/smoke/**/*.smoke.test.ts"],
    passWithNoTests: false,
    testTimeout: 90_000,
    hookTimeout: 90_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
