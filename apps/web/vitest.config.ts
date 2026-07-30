import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Pure helpers under unit test. API/UI covered by smoke + e2e, not v8.
      include: ["src/lib/money.ts", "src/lib/api.ts"],
      exclude: ["src/lib/types.ts", "src/lib/services.ts"],
    },
  },
});
