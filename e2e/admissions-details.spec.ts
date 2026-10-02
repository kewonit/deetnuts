import { expect, test } from "@playwright/test";
import { getCanonicalMhtCetCollegePath } from "../lib/admissions/proxy-canonical";

const collegePath = getCanonicalMhtCetCollegePath("3475")!;
const canonical = "https://www.deetnuts.com" + collegePath;

test("college facts and canonical metadata are present in server HTML", async ({
  request,
}) => {
  const response = await request.get(collegePath);
  expect(response.status()).toBe(200);
  const html = (await response.text()).replace(/<!--.*?-->/g, "");
  expect(html).toContain('rel="canonical" href="' + canonical + '"');
  expect(html).toContain('name="robots" content="index, follow"');
  expect(html).not.toMatch(/name="robots" content="noindex/);
  expect(html).toContain('"@type":"CollegeOrUniversity"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain("2026 Round 1 cutoffs");
  expect(html).toContain("Civil Engineering");
  expect(html).toContain("<table");
  expect(html).toContain('href="/mht-cet/colleges"');
});

test("invalid detail query and entity routes return real uncached 404s", async ({
  request,
}) => {
  for (const path of [
    collegePath + "?year=2023",
    collegePath + "?year=2026&round=2",
    collegePath + "?year=2024&year=2026",
    collegePath + "?round=1&round=2",
    "/mht-cet/colleges/unknown-99999",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(await response.text()).not.toContain('rel="canonical"');
  }
});

test("college aliases preserve historical selection in a single permanent redirect", async ({
  request,
}) => {
  const response = await request.get(
    "/mht-cet/colleges/old-name-3475?year=2024&round=2",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe(canonical + "?year=2024&round=2");
});

test("MHT-CET sitemap is discoverable and contains query-free canonical college URLs", async ({
  request,
}) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain(
    "https://www.deetnuts.com/mht-cet/sitemap.xml",
  );
  const response = await request.get("/mht-cet/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain("<loc>" + canonical + "</loc>");
  expect(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].every(
      (match) => !/[?#]/.test(match[1]),
    ),
  ).toBe(true);
});

test("direct college hydration retains one canonical and visible cutoff evidence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(collegePath);
  await expect(page.locator(".mht-college h1")).toContainText("Shah");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
  await expect(page.locator(".mht-college table").first()).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb", exact: true }),
  ).toContainText("Colleges");
  expect(errors).toEqual([]);
});

test("intercepted college navigation shares metadata with the full page and restores the directory", async ({
  page,
}) => {
  await page.goto("/mht-cet/colleges");
  await page.getByPlaceholder("Search by name, ID, or university").fill("3475");
  const link = page.locator('a[href="' + collegePath + '"]').first();
  await expect(link).toBeVisible();
  await link.click();
  const dialog = page.getByRole("dialog", { name: /Shah/ });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(new RegExp(collegePath + "$"));
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical,
  );
  await expect(page).toHaveTitle(/Shah.*MHT-CET cutoffs/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.deetnuts.com/mht-cet/colleges",
  );
});

test("cold wrong-exam hub and year redirects provide exactly one destination", async ({
  request,
}) => {
  for (const suffix of ["", "/cutoffs/2025"]) {
    const response = await request.get(
      "/jee-main/colleges/iit-bhilai" + suffix,
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(
      "https://www.deetnuts.com/jee-advanced/colleges/iit-bhilai" + suffix,
    );
  }
});
