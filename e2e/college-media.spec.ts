import { expect, test } from "@playwright/test";
import { getCanonicalMhtCetCollegePath } from "../lib/admissions/proxy-canonical";

const collegePath = getCanonicalMhtCetCollegePath("3475")!;
const logoPath = "/mht-cet/colleges/03475/logo.webp";
const campusPath = "/mht-cet/colleges/03475/campus.webp";

for (const theme of ["light", "dark"] as const) {
  test(`full college page and slide-over share local media in ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("deetnuts_theme", value),
      theme,
    );
    await page.goto(collegePath);
    const header = page.locator(".mht-college-mark");
    await expect(header.locator(".mht-college-logo img")).toHaveAttribute(
      "src",
      /\/mht-cet\/colleges\/03475\/logo\.webp$/,
    );
    await expect
      .poll(() =>
        header
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await expect(header.locator(".mht-college-logo")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    const bannerSource = await header
      .locator(".mht-profile-banner img")
      .getAttribute("src");
    const focalPosition = await header
      .locator(".mht-profile-banner img")
      .evaluate((image) => (image as HTMLElement).style.objectPosition);
    expect(bannerSource).toContain(encodeURIComponent(campusPath));
    await page
      .getByRole("combobox", { name: "Year", exact: true })
      .selectOption("2025");
    await expect(page.locator(".mht-college table").first()).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Find a program", exact: true })
      .fill("Computer");
    await expect(
      page.getByRole("button", { name: "Civil Engineering", exact: true }),
    ).toHaveCount(0);

    await page.goto("/mht-cet/colleges");
    await page
      .getByPlaceholder("Search by name, ID, or university")
      .fill("3475");
    await page.locator(`a[href="${collegePath}"]`).first().click();
    const dialog = page.getByRole("dialog", { name: /Shah/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".mht-college-logo img")).toHaveAttribute(
      "src",
      /\/mht-cet\/colleges\/03475\/logo\.webp$/,
    );
    await expect
      .poll(() =>
        dialog
          .locator(".mht-college-mark img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await expect(dialog.locator(".mht-profile-banner img")).toHaveCSS(
      "object-position",
      focalPosition,
    );
    await expect(dialog.locator(".mht-college-logo")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await dialog.getByRole("button", { name: /close/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/mht-cet\/colleges$/);
  });
}

test("failed logo uses the same college photo and keeps its campus banner", async ({
  page,
}) => {
  await page.route(`**${logoPath}`, (route) => route.abort());
  await page.goto(collegePath);
  await expect(page.locator(".mht-college-logo img")).toHaveAttribute(
    "src",
    /\/mht-cet\/colleges\/03475\/campus\.webp$/,
  );
  await expect
    .poll(() =>
      page
        .locator(".mht-college-mark img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
});

test("failed college images restore initials and the neutral banner", async ({
  page,
}) => {
  await page.goto("/mht-cet/colleges");
  await page.route("**/*", (route) => {
    const url = decodeURIComponent(route.request().url());
    return url.includes(logoPath) || url.includes(campusPath)
      ? route.abort()
      : route.continue();
  });
  await page.getByPlaceholder("Search by name, ID, or university").fill("3475");
  await page.locator(`a[href="${collegePath}"]`).first().click();
  const dialog = page.getByRole("dialog", { name: /Shah/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".mht-college-logo")).toHaveText("A");
  await expect(dialog.locator(".mht-college-mark img")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.goto(collegePath);
  await expect(page.locator(".mht-college-logo")).toHaveText("A");
  await expect(page.locator(".mht-college-mark img")).toHaveCount(0);
  await expect(page.locator(".mht-profile-banner")).toBeVisible();
  await expect(page.locator(".mht-college table").first()).toBeVisible();
});

test("reviewed missing assets use the agreed fallbacks on full pages and slide-overs", async ({
  page,
}) => {
  const fixtures = [
    {
      code: "4762",
      avatar: "/mht-cet/colleges/04762/campus.webp",
      banner: true,
      sheet: false,
    },
    {
      code: "3723",
      avatar: "/mht-cet/colleges/03723/logo.webp",
      banner: false,
      sheet: false,
    },
    { code: "3546", avatar: null, banner: false, sheet: false },
    {
      code: "6625",
      avatar: "/mht-cet/colleges/06625/campus.webp",
      banner: true,
      sheet: true,
    },
  ];

  for (const fixture of fixtures) {
    const path = getCanonicalMhtCetCollegePath(fixture.code)!;
    await page.goto(path);
    const header = page.locator(".mht-college-mark");
    if (fixture.avatar) {
      await expect(header.locator(".mht-college-logo img")).toHaveAttribute(
        "src",
        new RegExp(`${fixture.avatar.replaceAll(".", "\\.")}$`),
      );
      await expect
        .poll(() =>
          header
            .locator(".mht-college-logo img")
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    } else {
      await expect(header.locator(".mht-college-logo img")).toHaveCount(0);
      await expect(header.locator(".mht-college-logo span")).toHaveText(/\S/);
    }
    await expect(header.locator(".mht-profile-banner img")).toHaveCount(
      fixture.banner ? 1 : 0,
    );

    if (!fixture.sheet) continue;
    await page.goto("/mht-cet/colleges");
    await page
      .getByPlaceholder("Search by name, ID, or university")
      .fill(fixture.code);
    const collegeLink = page.locator(`a[href="${path}"]`).first();
    await collegeLink.click();
    const dialog = page.getByRole("dialog", { name: /Universal/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".mht-college-logo img")).toHaveCount(
      fixture.avatar ? 1 : 0,
    );
    if (fixture.avatar)
      await expect(dialog.locator(".mht-college-logo img")).toHaveAttribute(
        "src",
        new RegExp(`${fixture.avatar.replaceAll(".", "\\.")}$`),
      );
    await expect(dialog.locator(".mht-profile-banner img")).toHaveCount(
      fixture.banner ? 1 : 0,
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});

test("a white college crest keeps its reviewed contrast background in both themes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("deetnuts_theme", "system"),
  );
  const path = getCanonicalMhtCetCollegePath("4142")!;
  await page.goto(path);
  const avatar = page.locator(".mht-college-logo");
  await expect(avatar).toHaveCSS("background-color", "rgb(23, 53, 107)");
  await expect
    .poll(() =>
      avatar
        .locator("img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".deetnuts-ejam-shell").first()).toHaveClass(
    /dark/,
  );
  await expect(avatar).toHaveCSS("background-color", "rgb(23, 53, 107)");
});
