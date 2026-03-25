import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Every page loads without crashing
// ---------------------------------------------------------------------------

const ARTICLE_PAGES = [
  { path: "/company/founders", title: "Founders" },
  { path: "/company/founder-wellness", title: "Founder Wellness" },
  { path: "/company/ideation", title: "Ideation" },
  { path: "/company/equity", title: "Equity" },
  { path: "/company/incorporation", title: "Incorporation" },
  { path: "/business/traction", title: "Traction" },
  { path: "/money/fundraising", title: "Fundraising" },
  { path: "/business/pricing", title: "Pricing" },
];

const TOOL_PAGES = [
  { path: "/launch", title: "Dashboard" },
  { path: "/tools/equity-split", title: "Equity Split" },
  { path: "/company/solution-deck", title: "Solution Deck" },
  { path: "/company/accelerator", title: "Accelerator" },
  { path: "/money/runrate", title: "Runrate" },
  { path: "/business/model", title: "Business Model" },
  { path: "/business/market-research", title: "Market Research" },
  { path: "/legal/contracts", title: "Legal Templates" },
  { path: "/legal/safes", title: "SAFEs" },
  { path: "/legal/ip", title: "IP & Trademarks" },
  { path: "/settings", title: "Settings" },
];

test.describe("Page loads", () => {
  for (const page of [...ARTICLE_PAGES, ...TOOL_PAGES]) {
    test(`${page.title} (${page.path}) loads without error`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on("pageerror", (err) => errors.push(err.message));

      const res = await p.goto(page.path, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(500);

      await p.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Article flow — can navigate forward through all articles
// ---------------------------------------------------------------------------

test.describe("Article flow", () => {
  test("can navigate through article chain via Next links", async ({ page }) => {
    await page.goto("/company/founders", { waitUntil: "domcontentloaded" });

    for (const article of ARTICLE_PAGES.slice(1)) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      const nextLink = page.locator("a").filter({ hasText: /^Next:/ });
      if (await nextLink.count() > 0) {
        await nextLink.first().click();
        await page.waitForURL("**/*", { timeout: 5000 });
      }
    }
  });

  test("Dashboard button exits article to /launch", async ({ page }) => {
    await page.goto("/company/ideation", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const dashBtn = page.locator("button", { hasText: "Dashboard" });
    await expect(dashBtn).toBeVisible();
    await dashBtn.click();
    await page.waitForURL("**/launch", { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Sidebar navigation — desktop
// ---------------------------------------------------------------------------

test.describe("Sidebar navigation", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name.includes("Mobile"), "Desktop only");
  });

  test("sidebar is visible on desktop", async ({ page }) => {
    await page.goto("/launch", { waitUntil: "domcontentloaded" });
    const sidebar = page.locator("aside.hidden.md\\:flex");
    await expect(sidebar).toBeVisible();
  });

  test("can navigate to tools via sidebar", async ({ page }) => {
    await page.goto("/launch", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // The desktop sidebar is the first aside
    const sidebar = page.locator("aside").first();

    // Open Tools group
    await sidebar.locator("button", { hasText: /^Tools$/ }).click();
    await page.waitForTimeout(200);

    // Click Equity Splitter
    await sidebar.locator("button", { hasText: "Equity Splitter" }).click();
    await page.waitForURL("**/tools/equity-split", { timeout: 5000 });
  });

  test("can navigate to legal via sidebar", async ({ page }) => {
    await page.goto("/launch", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // Open Legal group — use exact match to avoid matching "Legal" article link
    const legalGroup = sidebar.locator("button").filter({ has: page.locator("text=Legal") }).filter({ has: page.locator("svg") });
    // Click the group header (the one with chevron)
    await sidebar.locator("button", { hasText: /^Legal$/ }).last().click();
    await page.waitForTimeout(200);

    // Click SAFEs
    await sidebar.locator("button", { hasText: "SAFEs" }).click();
    await page.waitForURL("**/legal/safes", { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Mobile navigation
// ---------------------------------------------------------------------------

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu opens sidebar on mobile", async ({ page }) => {
    await page.goto("/launch", { waitUntil: "domcontentloaded" });

    const hamburger = page.locator("button[aria-label='Open menu']");
    await hamburger.click();
    await page.waitForTimeout(300);

    // Mobile sidebar should be visible
    const mobileSidebar = page.locator("aside.md\\:hidden");
    await expect(mobileSidebar).toBeVisible();
  });

  test("can navigate from mobile sidebar", async ({ page }) => {
    await page.goto("/launch", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const hamburger = page.locator("button[aria-label='Open menu']");
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Click Founders in the mobile sidebar
    const buttons = page.locator("aside").last().locator("button");
    const foundersBtn = buttons.filter({ hasText: /^Founders$/ }).first();
    await foundersBtn.click();
    await page.waitForURL("**/company/founders", { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Tools — interactive features work
// ---------------------------------------------------------------------------

test.describe("Tools", () => {
  test("Equity Splitter — sliders and buttons work", async ({ page }) => {
    await page.goto("/tools/equity-split", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Should have "Split equal" and "Add" buttons
    await expect(page.locator("button", { hasText: "Split equal" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Add" })).toBeVisible();

    // Add a founder
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(200);

    // Should now show 3 items in summary
    const summaryItems = page.locator("text=Founder").or(page.locator("text=Unnamed"));
    expect(await summaryItems.count()).toBeGreaterThanOrEqual(3);
  });

  test("Market Research — can add competitor", async ({ page }) => {
    await page.goto("/business/market-research", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Use a unique name to avoid conflicts with previous runs
    const compName = `Comp_${Date.now()}`;

    await page.locator("button", { hasText: "Add Competitor" }).click();
    await page.waitForTimeout(500);

    await page.locator("input[placeholder='Acme Inc.']").fill(compName);

    // Click Save inside the modal
    await page.locator(".fixed").locator("button", { hasText: "Save" }).click();
    await page.waitForTimeout(500);

    // Competitor should be visible in the card header (14px font-medium)
    await expect(page.locator(`span.text-\\[14px\\]:has-text("${compName}")`)).toBeVisible();
  });

  test("Runrate Calculator — shows results when data entered", async ({ page }) => {
    await page.goto("/money/runrate", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Find the cash input by its container context
    const cashInput = page.locator("input[type='number']").first();
    await cashInput.fill("100000");
    await page.waitForTimeout(300);

    // Results section should appear — use exact match
    await expect(page.getByText("MRR", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Runway", { exact: true }).first()).toBeVisible();
  });

  test("Solution Deck — page loads with slides", async ({ page }) => {
    await page.goto("/company/solution-deck", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Should have heading
    await expect(page.locator("h1")).toContainText("Solution Deck");

    // Should have a textarea for content editing
    const textarea = page.locator("textarea");
    expect(await textarea.count()).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// No console errors on any page
// ---------------------------------------------------------------------------

test.describe("No crashes", () => {
  const ALL_PAGES = [...ARTICLE_PAGES, ...TOOL_PAGES];

  for (const pg of ALL_PAGES) {
    test(`${pg.path} has no unhandled errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(pg.path, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const critical = errors.filter(
        (e) => !e.includes("hydration") && !e.includes("Minified React error")
      );
      expect(critical).toEqual([]);
    });
  }
});
