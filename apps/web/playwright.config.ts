import { defineConfig } from "@playwright/test";
import fs from "node:fs";

function loadEnvTest() {
  try {
    const raw = fs.readFileSync(new URL("./.env.test", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* optional */
  }
}
loadEnvTest();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  // Serial workers + one retry: full platform suite shares one QA IP / rate-limit bucket
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://shanghaitravels.com.bd/erp/",
    trace: "on-first-retry",
  },
});
