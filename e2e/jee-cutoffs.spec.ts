import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { COMPLIANCE } from "../lib/compliance";

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
  expect(html).not.toContain('/ejam/ui.css');

  await page.goto(pagePath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Assam University Silchar cutoff 2025");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.deetnuts.com/jee-main/colleges/assam-university/cutoffs/2025");
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

test("chart hover shows the exact opening and closing ranks", async ({ page }) => {
  await page.goto(pagePath);
  const chart = page.locator("svg.cutoff-chart").first();
  await chart.hover();
  const tooltip = page.locator(".cutoff-chart-tooltip").first();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Opening");
  await expect(tooltip).toContainText("Closing");
  await page.getByRole("heading", { level: 1 }).hover();
  await expect(tooltip).toBeHidden();
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
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(pagePath);
  await page.locator("svg.cutoff-chart").waitFor({ state: "attached" });
  const lightResults = await new AxeBuilder({ page }).include(".jee-cutoff-shell").include(".jee-cutoff-footer").analyze();
  expect(lightResults.violations).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark" });
  const darkResults = await new AxeBuilder({ page }).include(".jee-cutoff-shell").include(".jee-cutoff-footer").analyze();
  expect(darkResults.violations).toEqual([]);
});

test("cutoff routes use the structured product footer", async ({ page }) => {
  await page.goto(pagePath);
  const footer = page.locator(".jee-cutoff-footer");
  await expect(footer).toBeVisible();
  await expect(page.locator("footer.bg-gradient-to-b")).toHaveCount(0);
  await expect(footer.locator(".jee-cutoff-footer-heading")).toHaveText(["Cutoffs", "Tools", "Data", "Project"]);
  expect((await footer.boundingBox())?.height ?? Infinity).toBeLessThan(960);
});

test("homepage and older site pages retain the original footer", async ({ page }) => {
  for (const path of ["/", "/mht-cet"]) {
    await page.goto(path);
    await expect(page.locator(".jee-cutoff-footer")).toHaveCount(0);
    const originalFooter = page.locator(".legacy-site-footer");
    await expect(originalFooter).toBeVisible();
    await expect(originalFooter).toContainText("MHT-CET");
    await expect(originalFooter.locator("[data-legacy-wordmark] svg")).toBeVisible();
  }
});

test("cutoff surfaces follow light and dark color preferences", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(pagePath);
  const colors = () => page.evaluate(() => {
    const shell = getComputedStyle(document.querySelector(".jee-cutoff-shell")!);
    const footer = getComputedStyle(document.querySelector(".jee-cutoff-footer")!);
    const openingLine = getComputedStyle(document.querySelector(".cutoff-chart-opening")!);
    return { shell: shell.backgroundColor, footer: footer.backgroundColor, line: openingLine.stroke };
  });
  const light = await colors();
  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await colors();
  expect(light.shell).not.toBe(dark.shell);
  expect(light.footer).not.toBe(dark.footer);
  expect(light.line).not.toBe(dark.line);
});

test("theme settings override the device preference and persist", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(pagePath);
  await page.getByRole("button", { name: "Decline" }).click();
  const shell = page.locator(".jee-cutoff-shell");
  const deviceBackground = await shell.evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.getByRole("button", { name: "Theme settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Theme" });
  await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".theme-settings-panel").analyze()).violations).toEqual([]);
  await dialog.getByRole("button", { name: /^Light/ }).click();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  const lightBackground = await shell.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(lightBackground).not.toBe(deviceBackground);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.getByRole("button", { name: "Theme settings", exact: true }).click();
  const lightDialog = page.getByRole("dialog", { name: "Theme" });
  expect((await new AxeBuilder({ page }).include(".theme-settings-panel").analyze()).violations).toEqual([]);
  await lightDialog.getByRole("button", { name: /^System/ }).click();
  await expect(page.locator("html")).not.toHaveClass(/\b(?:light|dark)\b/);
  await expect.poll(() => shell.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(deviceBackground);
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

test("analytics consent is versioned and revocation clears GA cookies", async ({ page }) => {
  await page.goto(pagePath);
  await page.evaluate((policyVersion) => {
    document.cookie = `deetnuts_analytics_consent=granted:${policyVersion}; Path=/; SameSite=Lax`;
    document.cookie = "_ga=test-client; Path=/; SameSite=Lax";
    document.cookie = "_ga_TEST=test-session; Path=/; SameSite=Lax";
  }, COMPLIANCE.policyVersion);
  await page.reload();
  await page.getByRole("button", { name: "Cookie settings", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Analytics cookie settings" })).toContainText("Current choice: analytics allowed");
  await page.getByRole("button", { name: "Decline" }).click();
  await expect.poll(() => page.evaluate(() => document.cookie)).toContain(`deetnuts_analytics_consent=denied:${COMPLIANCE.policyVersion}`);
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/(?:^|; )_ga(?:_|=)/);
});

test("legal pages are complete, canonical and readable in both themes", async ({ page, request }) => {
  for (const path of [
    "/compliance/terms-and-conditions",
    "/compliance/privacy-policy",
    "/compliance/cookie-policy",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Version");
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://www.deetnuts.com${path}`);
    await expect(page.locator(".policy-page")).toBeVisible();
  }
  await page.emulateMedia({ colorScheme: "light" });
  const light = await page.locator(".policy-page").evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await page.locator(".policy-page").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(light).not.toBe(dark);
  expect((await new AxeBuilder({ page }).include(".policy-page").analyze()).violations).toEqual([]);
});

test("core sitemap publishes the legal and compliance routes", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain("https://www.deetnuts.com/compliance/terms-and-conditions");
  expect(xml).toContain("https://www.deetnuts.com/compliance/privacy-policy");
  expect(xml).toContain("https://www.deetnuts.com/compliance/cookie-policy");
  expect(xml).toContain("https://www.deetnuts.com/compliance/automated-access");
});

test("unknown routes and invalid API releases fail explicitly", async ({ request }) => {
  const unknownCollege = await request.get("/jee-main/colleges/not-a-college");
  expect(unknownCollege.status()).toBe(404);
  const unknownHtml = await unknownCollege.text();
  expect(unknownHtml).toMatch(/<meta name="robots" content="noindex"/);
  expect(unknownHtml).not.toMatch(/<link rel="canonical"/);
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

test("sitemaps expose only canonical, indexable release routes", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);
  const indexXml = await index.text();
  expect(indexXml).toContain("https://www.deetnuts.com/sitemap.xml");
  expect(indexXml).toContain("https://www.deetnuts.com/sitemaps/jee-main/2025");
  expect(indexXml).toContain("https://www.deetnuts.com/sitemaps/jee-advanced/2025");
  expect(indexXml).toMatch(/<lastmod>[^<]+<\/lastmod>/);

  const shard = await request.get("/sitemaps/jee-main/2025");
  expect(shard.status()).toBe(200);
  const shardXml = await shard.text();
  expect(shardXml).toContain(`https://www.deetnuts.com${pagePath}`);
  expect(shardXml).not.toContain(
    `${pagePath}/programs/agricultural-engineering-b-tech-4-year-agricultural-engineering/csab/all-india/open/female-only`,
  );

  const missingShard = await request.get("/sitemaps/jee-main/2015");
  expect(missingShard.status()).toBe(404);
  expect(missingShard.headers()["x-robots-tag"]).toBe("noindex");
});
