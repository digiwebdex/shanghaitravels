import { test, expect } from "@playwright/test";
import fs from "node:fs";

function env(k: string) {
  if (process.env[k]) return process.env[k]!;
  try {
    const raw = fs.readFileSync(new URL("../../.env.test", import.meta.url), "utf8");
    const m = new RegExp(`^${k}=(.*)$`, "m").exec(raw);
    return m?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

async function login(page: import("@playwright/test").Page) {
  const email = env("ERP_TEST_EMAIL");
  const password = env("ERP_TEST_PASSWORD");
  test.skip(!email || !password, "ERP_TEST_* missing");
  await page.goto("./#/login");
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 30_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/#\/(?!login)/, { timeout: 30_000 });
}

test.describe("V17 Help Center & ERP Assistant", () => {
  test("help center loads, searches and navigates", async ({ page }) => {
    await login(page);

    await page.goto("./#/help");
    await expect(page.getByRole("heading", { name: "ERP Assistant" })).toBeVisible({ timeout: 20_000 });

    // Categories and workflow maps render.
    await expect(page.getByText("Browse by topic")).toBeVisible();
    await expect(page.getByText("Workflow maps")).toBeVisible();
    await expect(page.getByText("Quick actions")).toBeVisible();

    // Search finds passport guidance.
    await page.locator("#help-search").fill("passport");
    await expect(page.getByRole("link", { name: /Scan a passport with OCR/i }).first()).toBeVisible();

    // Search finds the payment family.
    await page.locator("#help-search").fill("supplier due");
    await expect(page.getByText(/supplier due/i).first()).toBeVisible();
  });

  test("an article shows steps, permissions and problems", async ({ page }) => {
    await login(page);
    await page.goto("./#/help/a/scan-passport");

    await expect(page.getByRole("heading", { name: /Scan a passport with OCR/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("What is this?")).toBeVisible();
    await expect(page.getByText("Step by step")).toBeVisible();
    await expect(page.getByText("Expected result")).toBeVisible();
    await expect(page.getByText(/Common problems/i)).toBeVisible();
    await expect(page.getByText("Related guides")).toBeVisible();
    // The real permissions are named.
    await expect(page.getByText(/ocr:use/).first()).toBeVisible();
  });

  test("honest availability banner is shown for manpower", async ({ page }) => {
    await login(page);
    await page.goto("./#/help/a/manpower-workflow");
    await expect(page.getByText(/Partly available in this build/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/cannot be created through the unified booking wizard/i)).toBeVisible();
  });

  test("master flowchart is real clickable HTML", async ({ page }) => {
    await login(page);
    await page.goto("./#/help/flow/master-journey");

    await expect(page.getByRole("heading", { name: /ERP Master Workflow/i })).toBeVisible({ timeout: 20_000 });
    // Nodes are links, not an image.
    expect(await page.locator("ol[aria-label*='flowchart'] a").count()).toBeGreaterThan(15);
    expect(await page.locator("ol[aria-label*='flowchart'] img").count()).toBe(0);

    // Clicking a node opens its guide. Scope to the chart so the flow-switcher
    // chips above it (which link to other flows) cannot satisfy the selector.
    const chart = page.locator("ol[aria-label*='flowchart']");
    await chart.getByRole("link", { name: /^Lead/ }).first().click();
    await expect(page).toHaveURL(/#\/help\/a\/create-lead/);
  });

  test("service flow renders all 11 live stages", async ({ page }) => {
    await login(page);
    await page.goto("./#/help/flow/visa-flow");
    await expect(page.getByText("1. Created")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("5. Embassy Submission")).toBeVisible();
    await expect(page.getByText("11. Completed")).toBeVisible();
  });

  test("floating assistant answers a question and links to the guide", async ({ page }) => {
    await login(page);
    await page.goto("./#/");

    await page.getByRole("button", { name: /Open ERP Assistant/i }).click();
    await expect(page.getByRole("dialog", { name: /ERP Assistant/i })).toBeVisible();
    await expect(page.getByText("How can I help you?")).toBeVisible();

    await page.getByLabel("Ask the ERP Assistant").fill("How do I record a payment?");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/Amount and receiving account are mandatory/i)).toBeVisible();
    await page.getByRole("link", { name: /Full guide/i }).first().click();
    await expect(page).toHaveURL(/#\/help\/a\/record-payment/);
  });

  test("assistant does not invent an answer", async ({ page }) => {
    await login(page);
    await page.goto("./#/");
    await page.getByRole("button", { name: /Open ERP Assistant/i }).click();
    await page.getByLabel("Ask the ERP Assistant").fill("zzzzqqqq wibble");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(/could not find that in the ERP guide/i)).toBeVisible();
  });

  test("renders on mobile, tablet and desktop without horizontal overflow", async ({ page }) => {
    await login(page);
    for (const [w, h] of [[390, 844], [820, 1180], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("./#/help/flow/master-journey");
      await expect(page.getByRole("heading", { name: /ERP Master Workflow/i })).toBeVisible({ timeout: 20_000 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `viewport ${w}x${h}`).toBeLessThanOrEqual(1);
    }
  });
});
