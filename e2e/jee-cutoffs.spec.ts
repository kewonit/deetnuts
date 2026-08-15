import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pagePath = "/jee-main/colleges/assam-university/cutoffs/2025";

test("year page is source-useful in server HTML and exposes canonical SEO", async ({ page, request }) => {
  const response = await request.get(pagePath);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Assam University Silchar");
  expect(html).toContain("Computer Science and Engineering");
  expect(html).toContain("Source records");
  expect(html).not.toContain('"@type":"Dataset"');
  expect(html).not.toContain('"@type":"CollegeOrUniversity"');
  expect(html).not.toContain('/ejam-ui.css');

  await page.goto(pagePath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Assam University Silchar cutoff 2025");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://deetnuts.com/jee-main/colleges/assam-university/cutoffs/2025");
  await expect(page.locator(".cutoff-table")).toContainText("Computer Science and Engineering");
});

test("filters cascade, persist in the fragment, and support browser history", async ({ page }) => {
  await page.goto(pagePath);
  await page.locator("svg.cutoff-chart").waitFor({ state: "attached" });
  await page.getByLabel("Counselling").selectOption("csab");
  await expect(page.getByLabel("Round")).toHaveValue("3");
  await expect(page).toHaveURL(/#body=csab&round=3/);
  await page.getByLabel("Counselling").selectOption("josaa");
  await expect(page.getByLabel("Round")).toHaveValue("6");
  await page.goBack();
  await expect(page.getByLabel("Counselling")).toHaveValue("csab");
  await expect(page.getByLabel("Round")).toHaveValue("3");
});

test("mobile restyles the one semantic table without horizontal page overflow", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 390, "Mobile assertion");
  await page.goto(pagePath);
  await expect(page.locator(".cutoff-table tbody tr").first()).toBeVisible();
  await expect(page.locator(".cutoff-table")).toHaveCount(1);
  const widths = await page.evaluate(() => ({ viewport: innerWidth, content: document.body.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
});

test("cutoff surface has no detectable WCAG A/AA violations", async ({ page }) => {
  await page.goto(pagePath);
  await page.locator("svg.cutoff-chart").waitFor({ state: "attached" });
  const results = await new AxeBuilder({ page }).include(".jee-cutoff-shell").analyze();
  expect(results.violations).toEqual([]);
});

test("cutoff routes use the compact product footer", async ({ page }) => {
  await page.goto(pagePath);
  const footer = page.locator(".jee-cutoff-footer");
  await expect(footer).toBeVisible();
  await expect(page.locator("footer.bg-gradient-to-b")).toHaveCount(0);
  expect((await footer.boundingBox())?.height ?? Infinity).toBeLessThan(450);
});

test("header stays in flow with the intended responsive height", async ({ page }) => {
  await page.goto(pagePath);
  const layout = await page.evaluate(() => {
    const nav = document.querySelector(".site-default-chrome nav")!.getBoundingClientRect();
    const main = document.querySelector("main")!.getBoundingClientRect();
    return { navBottom: nav.bottom, navHeight: nav.height, mainTop: main.top, width: innerWidth };
  });
  expect(layout.mainTop).toBeGreaterThanOrEqual(layout.navBottom - 1);
  expect(layout.navHeight).toBe(layout.width <= 500 ? 64 : 88);
});

test("program and profile pages expose complete server-rendered facts", async ({ page, request }) => {
  const program = `${pagePath}/programs/agricultural-engineering-b-tech-4-year-agricultural-engineering`;
  const profile = `${program}/csab/all-india/open/gender-neutral`;
  const response = await request.get(profile);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Published rounds");
  expect(html).toContain("opening-rank");
  expect(html).toContain("closing-rank");
  expect(html).toContain("Source records");
  await page.goto(program);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Agricultural Engineering cutoff 2025");
  await expect(page.getByRole("link", { name: /CSAB · AI quota · OPEN · Gender-Neutral/ }).first()).toBeVisible();
});

test("one-round profiles remain useful and are noindex,follow", async ({ page }) => {
  await page.goto(`${pagePath}/programs/agricultural-engineering-b-tech-4-year-agricultural-engineering/csab/all-india/open/female-only`);
  await expect(page.getByText("Only Round", { exact: false })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*follow/i);
});

test("analytics makes no Google request before consent", async ({ page }) => {
  const googleRequests: string[] = [];
  page.on("request", (request) => {
    if (/google-analytics|googletagmanager/.test(request.url())) googleRequests.push(request.url());
  });
  await page.goto(pagePath);
  await expect(page.getByRole("dialog", { name: "Analytics cookie settings" })).toBeVisible();
  expect(googleRequests).toEqual([]);
  await page.getByRole("button", { name: "Decline" }).click();
  expect(googleRequests).toEqual([]);
});

test("unknown routes and invalid API releases fail explicitly", async ({ request }) => {
  expect((await request.get("/jee-main/colleges/not-a-college")).status()).toBe(404);
  expect((await request.get("/jee-main/colleges/assam-university/cutoffs/2015")).status()).toBe(404);

  const wrongExam = await request.get("/jee-main/colleges/iit-bhilai", { maxRedirects: 0 });
  expect(wrongExam.status()).toBe(308);
  expect(wrongExam.headers().location).toBe("/jee-advanced/colleges/iit-bhilai");

  const missingRelease = await request.get("/api/jee-cutoffs/jee-main/assam-university/2025");
  expect(missingRelease.status()).toBe(400);
  expect(missingRelease.headers()["cache-control"]).toContain("no-store");

  const staleRelease = await request.get("/api/jee-cutoffs/jee-main/assam-university/2025?release=old");
  expect(staleRelease.status()).toBe(409);
  expect(staleRelease.headers()["cache-control"]).toContain("no-store");
});
