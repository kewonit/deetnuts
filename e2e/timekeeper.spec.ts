import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { exams } from "../lib/timekeeper/exams";
import manifest from "../docs/timekeeper-migration/manifest.json";
import { handleRequest } from "../timekeeper-compat/worker.mjs";

const origin = "https://www.deetnuts.com";
const path = "/exam-countdown";
const fixture = {
  version: 1,
  countdowns: [
    {
      id: "source-timer",
      title: "Imported exam",
      description: "Revision",
      targetDate: "2030-05-01T09:30",
      createdAt: "2026-10-09T00:00:00Z",
      color: "pink",
    },
  ],
  theme: "ocean",
  avatarSeed: "test-avatar",
};

async function mockMap(page: Page) {
  let studying = false;
  const rpcCalls: { path: string; body: Record<string, unknown> | null }[] = [];
  await page.route("**/api/exam-countdown/config", (route) =>
    route.fulfill({
      json: {
        url: "https://ivmobluuegkikmbwbfhe.supabase.co",
        anonKey: "sb_publishable_test_only",
      },
    }),
  );
  await page.route(
    "https://ivmobluuegkikmbwbfhe.supabase.co/**",
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith("/auth/")) {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const token = `header.${Buffer.from(JSON.stringify({ exp, sub: "11111111-1111-4111-8111-111111111111", role: "authenticated" })).toString("base64url")}.signature`;
        await route.fulfill({
          json: {
            access_token: token,
            refresh_token: "test-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: "11111111-1111-4111-8111-111111111111",
              aud: "authenticated",
              is_anonymous: true,
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString(),
            },
          },
        });
        return;
      }
      rpcCalls.push({
        path: url.pathname,
        body: route.request().postDataJSON(),
      });
      if (url.pathname.endsWith("upsert_study_session")) studying = true;
      if (url.pathname.endsWith("end_study_session")) studying = false;
      const student = {
        id: "fixture-session",
        latitude: 28.61,
        longitude: 77.2,
        city: "Delhi",
        state: "Delhi",
        avatar_seed: "fixture-avatar",
        exam_slug: "jee-main",
        exam_name: "<script>unsafe</script>",
        subject: "Physics",
        started_at: new Date().toISOString(),
      };
      await route.fulfill({
        json: url.pathname.endsWith("get_active_study_sessions")
          ? studying
            ? [student]
            : []
          : "fixture-session",
      });
    },
  );
  await page.routeWebSocket(
    "wss://ivmobluuegkikmbwbfhe.supabase.co/**",
    (socket) => {
      socket.onMessage((raw) => {
        const message = JSON.parse(String(raw));
        const topic = Array.isArray(message) ? message[2] : message.topic;
        const event = Array.isArray(message) ? message[3] : message.event;
        const payload = Array.isArray(message) ? message[4] : message.payload;
        if (["phx_join", "heartbeat", "phx_leave"].includes(event)) {
          const reply = {
            status: "ok",
            response: {
              postgres_changes: (payload?.config?.postgres_changes ?? []).map(
                (binding: object, index: number) => ({ ...binding, id: index }),
              ),
            },
          };
          socket.send(
            JSON.stringify(
              Array.isArray(message)
                ? [message[0], message[1], topic, "phx_reply", reply]
                : {
                    topic,
                    event: "phx_reply",
                    ref: message.ref,
                    payload: reply,
                  },
            ),
          );
        }
      });
    },
  );
  await page.route("https://ipinfo.io/json", (route) =>
    route.fulfill({
      json: { loc: "19.0760,72.8777", city: "Mumbai", region: "Maharashtra" },
    }),
  );
  await page.route(
    /https:\/\/([abcd]\.basemaps\.cartocdn\.com|api\.dicebear\.com)\//,
    (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#eee"/></svg>',
      }),
  );
  return rpcCalls;
}

test.beforeEach(async ({ page }) => {
  await page.route(
    /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com)\//,
    (route) => route.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await mockMap(page);
});

test("every mapped destination has static content, correct canonical and one scoped CSP", async ({
  request,
}) => {
  for (const destination of Object.values(manifest.redirects)) {
    const response = await request.get(destination, {
      headers: { Host: "www.deetnuts.com" },
    });
    expect(response.status(), destination).toBe(200);
    const html = await response.text();
    expect(html, destination).toContain(
      `rel="canonical" href="${origin}${destination}"`,
    );
    expect(html, destination).not.toMatch(
      /<meta name="robots" content="[^"]*noindex/,
    );
    expect(response.headers()["x-robots-tag"] ?? "").not.toContain("noindex");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("api.dicebear.com");
    expect(csp).toContain("ivmobluuegkikmbwbfhe.supabase.co");
    expect(csp.split("default-src")).toHaveLength(2);
    const exam = exams.find((item) =>
      destination.endsWith(`/exams/${item.slug}`),
    );
    if (exam) {
      const escapeHtml = (value: string) =>
        value
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#x27;");
      expect(
        html.includes(escapeHtml(exam.name)),
        `${destination}: exam name`,
      ).toBe(true);
      expect(
        html.includes(escapeHtml(exam.fullName)),
        `${destination}: full name`,
      ).toBe(true);
      expect(
        html.includes("Latest published schedule"),
        `${destination}: schedule`,
      ).toBe(true);
    }
  }
  expect((await request.get(`${path}/exams/does-not-exist`)).status()).toBe(
    404,
  );
  expect((await request.get(`${path}/category/does-not-exist`)).status()).toBe(
    404,
  );
  const sitemap = await request.get(`${path}/sitemap.xml`);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(74);
  expect(await (await request.get("/sitemap-index.xml")).text()).toContain(
    `${origin}${path}/sitemap.xml`,
  );
  const robots = (await request.get(path)).headers()["x-robots-tag"] ?? "";
  if (process.env.PLAYWRIGHT_BASE_URL === origin)
    expect(robots).not.toContain("noindex");
  else expect(robots).toContain("noindex");
  for (const asset of [
    "favicon.svg",
    "icon-192.png",
    "icon-512.png",
    "fonts/inter.woff2",
    "fonts/playfair-italic.woff2",
    "manifest.webmanifest",
    "sw.js",
  ])
    expect((await request.get(`${path}/${asset}`)).status(), asset).toBe(200);
  expect(
    (await request.get("/")).headers()["content-security-policy"],
  ).not.toContain("supabase.co");
});

test("mobile and desktop navigation retain theme scope and return to existing Deetnuts pages", async ({
  page,
}) => {
  await page.goto("/");
  if ((page.viewportSize()?.width ?? 0) <= 900) {
    await page
      .getByRole("button", { name: "Open navigation menu", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Exam Countdown", exact: true })
      .click();
  } else {
    await page.getByRole("button", { name: "Tools", exact: true }).click();
    await page.getByRole("link", { name: /Exam Countdown/ }).click();
  }
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "All Exams",
  );
  const initialRootTheme = await page
    .locator("html")
    .getAttribute("data-theme");
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await page
      .getByRole("button", { name: "Open TimeKeeper navigation" })
      .click();
  for (const theme of ["light", "dark", "ocean", "valentine", "cupcake"]) {
    await page
      .getByRole("button", {
        name: `${theme[0].toUpperCase()}${theme.slice(1)} theme`,
        exact: true,
      })
      .click();
    await expect(page.locator(".timekeeper")).toHaveAttribute(
      "data-theme",
      theme,
    );
    expect(await page.locator("html").getAttribute("data-theme")).toBe(
      initialRootTheme,
    );
  }
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await page
      .getByRole("button", { name: "Close TimeKeeper navigation" })
      .click();
  await page.reload();
  await expect(page.locator(".timekeeper")).toHaveAttribute(
    "data-theme",
    "cupcake",
  );
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.body.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
  await page.getByRole("link", { name: "← Deetnuts", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".timekeeper")).toHaveCount(0);
  await page.goto("/jee-main/colleges/assam-university/cutoffs/2025");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Assam University",
  );
});

test("custom countdowns create, edit, persist, import idempotently and export recovery data", async ({
  page,
}) => {
  await page.goto(`${path}/countdown`);
  await page
    .getByRole("button", { name: "Create Countdown", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Event Title").fill("Local exam");
  await dialog.getByLabel("Description").fill("My notes");
  await dialog.getByLabel("Target Date & Time").fill("2030-05-01T09:30");
  await dialog
    .getByRole("button", { name: "Create Countdown", exact: true })
    .click();
  await expect(page.getByTestId("custom-countdown")).toHaveCount(1);
  await page.reload();
  await expect(page.getByTestId("custom-countdown")).toContainText(
    "Local exam",
  );
  await page
    .getByRole("button", { name: "Create Countdown", exact: true })
    .click();
  await expect(dialog.getByLabel("Event Title")).toHaveValue("");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  const file = {
    name: "recovery.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  };
  await page.getByLabel("Import countdown JSON").setInputFiles(file);
  await expect(page.getByTestId("custom-countdown")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Edit Imported exam", exact: true })
    .click();
  await dialog.getByLabel("Event Title").fill("Edited import");
  await dialog
    .getByRole("button", { name: "Save Changes", exact: true })
    .click();
  await page.getByLabel("Import countdown JSON").setInputFiles(file);
  await expect(page.getByTestId("custom-countdown")).toHaveCount(2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export countdowns" }).click();
  expect((await download).suggestedFilename()).toBe(
    "timekeeper-countdowns.json",
  );
  page.once("dialog", (confirm) => confirm.accept());
  await page
    .getByRole("button", { name: "Delete Local exam", exact: true })
    .click();
  await expect(page.getByTestId("custom-countdown")).toHaveCount(1);
});

test("import receiver clears the private fragment and redeems once", async ({
  page,
}) => {
  let redemptions = 0;
  await page.route("**/api/exam-countdown/migration/redeem", (route) => {
    redemptions++;
    return route.fulfill({ json: fixture });
  });
  await page.goto(`${path}/import#ticket=${"a".repeat(43)}`);
  await expect(page.getByRole("status")).toContainText("1 countdown imported");
  expect(new URL(page.url()).hash).toBe("");
  expect(redemptions).toBe(1);
  await page.reload();
  expect(redemptions).toBe(1);
  await page.getByRole("link", { name: "Open my countdowns" }).click();
  await expect(page.getByTestId("custom-countdown")).toContainText(
    "Imported exam",
  );
  await expect(page.locator(".timekeeper")).toHaveAttribute(
    "data-theme",
    "ocean",
  );
});

test("old-origin helper transfers only saved preferences and retains the original browser data", async ({
  page,
}) => {
  await page.addInitScript((data) => {
    if (
      location.hostname === "timekeeper.edbn.me" &&
      !localStorage.getItem("timekeeper-countdowns")
    ) {
      localStorage.setItem(
        "timekeeper-countdowns",
        JSON.stringify(data.countdowns),
      );
      localStorage.setItem("timekeeper-theme", data.theme!);
      localStorage.setItem(
        "timekeeper_avatar_seed",
        JSON.stringify(data.avatarSeed),
      );
      localStorage.setItem("timekeeper-auth", "PRIVATE_TEST_TOKEN");
    }
  }, fixture);
  let transferred: unknown;
  await page.route("https://timekeeper.edbn.me/**", async (route) => {
    const response = await handleRequest(
      new Request(route.request().url()),
      { ROLLOUT_PHASE: "serve" },
      async () => new Response("", { status: 404 }),
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  });
  await page.route("https://www.deetnuts.com/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/exam-countdown/migration") {
      const headers = {
        "Access-Control-Allow-Origin": "https://timekeeper.edbn.me",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
      if (route.request().method() === "OPTIONS")
        await route.fulfill({ status: 204, headers });
      else {
        transferred = route.request().postDataJSON();
        await route.fulfill({ headers, json: { token: "a".repeat(43) } });
      }
    } else if (url.pathname.endsWith("/migration/redeem"))
      await route.fulfill({ json: transferred });
    else if (process.env.PLAYWRIGHT_BASE_URL === origin)
      await route.fallback();
    else
      await route.fulfill({
        response: await route.fetch({
          url: `${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3107"}${url.pathname}${url.search}`,
        }),
      });
  });
  await page.goto("https://timekeeper.edbn.me/migrate-to-deetnuts");
  await page.getByRole("button", { name: "Transfer to Deetnuts" }).click();
  await expect(page.getByRole("status")).toContainText("1 countdown imported", {
    timeout: 20_000,
  });
  expect(transferred).toEqual(fixture);
  expect(new URL(page.url()).hash).toBe("");
  await page.goto("https://timekeeper.edbn.me/migrate-to-deetnuts");
  expect(
    await page.evaluate(() => localStorage.getItem("timekeeper-countdowns")),
  ).toBe(JSON.stringify(fixture.countdowns));
  expect(
    await page.evaluate(() => localStorage.getItem("timekeeper-auth")),
  ).toBe("PRIVATE_TEST_TOKEN");
  await page.unrouteAll({ behavior: "wait" });
});

test("timer session selection, fullscreen, sharing and unsupported PiP fallback work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "documentPictureInPicture", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "pictureInPictureEnabled", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as Window & { sharedUrl?: string }).sharedUrl = value;
        },
      },
    });
  });
  await page.goto(`${path}/exams/jee-main`);
  const countdown = page.getByRole("region", { name: "Exam countdown" });
  await expect(
    countdown.getByTestId("countdown-digits").first(),
  ).not.toContainText("--");
  await countdown
    .getByRole("button", { name: "Session 2", exact: true })
    .click();
  await expect(
    countdown.getByRole("button", { name: "Session 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await countdown.getByRole("button", { name: "Pop-Out", exact: true }).click();
  await expect(countdown.getByRole("status")).toContainText("not supported");
  await countdown
    .getByRole("button", { name: "Fullscreen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "JEE Main fullscreen countdown" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Exit Fullscreen · ESC", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "JEE Main fullscreen countdown" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Share This Exam", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as Window & { sharedUrl?: string }).sharedUrl,
    ),
  ).toBe(page.url());
});

test("document PiP follows session changes and closes when leaving the feature", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      maxWidth,
    ) {
      if (y === 92) this.canvas.dataset.session = text;
      if (maxWidth === undefined) fillText.call(this, text, x, y);
      else fillText.call(this, text, x, y, maxWidth);
    };
    Object.defineProperty(window, "documentPictureInPicture", {
      configurable: true,
      value: {
        requestWindow: async () =>
          window.open("about:blank", "timekeeper-test-pip"),
      },
    });
  });
  await page.goto(`${path}/exams/jee-main`);
  const popupEvent = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Pop-Out", exact: true }).click();
  const popup = await popupEvent;
  await expect(popup.locator("canvas")).toHaveAttribute(
    "data-session",
    "Session 1",
  );
  await page.getByRole("button", { name: "Session 2", exact: true }).click();
  await expect(popup.locator("canvas")).toHaveAttribute(
    "data-session",
    "Session 2",
  );
  await page.getByRole("link", { name: "← Deetnuts", exact: true }).click();
  await expect.poll(() => popup.isClosed()).toBe(true);
});

test("timer expiry and feature service-worker caches stay in the browser", async ({
  page,
}) => {
  const target = new Date("2030-05-01T09:30:00Z");
  await page.clock.install({ time: new Date(target.getTime() - 2000) });
  await page.addInitScript(
    (data) =>
      localStorage.setItem("timekeeper-countdowns", JSON.stringify(data)),
    [{ ...fixture.countdowns[0], targetDate: target.toISOString() }],
  );
  await page.goto(`${path}/countdown`);
  await expect(page.getByTestId("countdown-digits").first()).toBeVisible();
  await page.clock.fastForward(3000);
  await expect(
    page
      .getByTestId("custom-countdown")
      .getByRole("status")
      .filter({ visible: true }),
  ).toContainText("Countdown Ended");
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistrations()).map(
          (registration) => new URL(registration.scope).pathname,
        ),
      ),
    )
    .toEqual([path]);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return Promise.all(
      keys
        .filter((key) => key.startsWith("deetnuts-exam-countdown-"))
        .map(async (key) =>
          (await (await caches.open(key)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
    );
  });
  expect(cached.flat()).toHaveLength(3);
  expect(
    cached
      .flat()
      .every(
        (url) =>
          url.startsWith(`${path}/fonts/`) || url === `${path}/favicon.svg`,
      ),
  ).toBe(true);
});

test("study map connects, starts and ends through the existing RPC contract without HTML injection", async ({
  page,
}) => {
  const calls = await mockMap(page);
  await page.goto(`${path}/study-map`);
  await expect(page.locator(".tk-map-toolbar")).toContainText("Live");
  await page.getByLabel("COUNTDOWN", { exact: true }).selectOption("jee-main");
  await page.getByLabel("Study subject").selectOption("Physics");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "End Session", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".tk-map-toolbar")).toContainText("1 studying now");
  const start = calls.find((call) =>
    call.path.endsWith("upsert_study_session"),
  );
  expect(start?.body?.p_exam_slug).toBe("jee-main");
  expect(start?.body?.p_subject).toBe("Physics");
  expect(start?.body?.p_latitude).not.toBe(19.076);
  const marker = page.locator(
    ".leaflet-marker-icon:has(.tk-avatar:not(.tk-avatar-demo))",
  );
  if ((page.viewportSize()?.width ?? 0) < 640) {
    // The source map overlays its timer on narrow screens. Its markers must
    // still expose the same popup through Leaflet's keyboard interaction.
    await marker.press("Enter");
  } else {
    await marker.click();
  }
  await expect(page.locator(".leaflet-popup-content")).toContainText(
    "<script>unsafe</script>",
  );
  expect(await page.locator(".leaflet-popup-content script").count()).toBe(0);
  await page.getByRole("button", { name: "End Session", exact: true }).click();
  await expect(page.locator(".tk-map-toolbar")).toContainText("0 studying now");
  await page.getByRole("link", { name: "← Deetnuts", exact: true }).click();
  expect(calls.some((call) => call.path.endsWith("end_study_session"))).toBe(
    true,
  );
});

test("real browser redirects inherit fragments in a single hop", async ({
  page,
}) => {
  let redirects = 0;
  await page.route("https://timekeeper.edbn.me/**", async (route) => {
    redirects++;
    const response = await handleRequest(new Request(route.request().url()), {
      ROLLOUT_PHASE: "permanent",
    });
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: "",
    });
  });
  await page.route("https://www.deetnuts.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Redirect destination</title><p>Destination</p>",
    }),
  );
  await page.goto(
    "https://timekeeper.edbn.me/exams/jeemains/?session=2#revision",
  );
  expect(page.url()).toBe(`${origin}${path}/exams/jee-main?session=2#revision`);
  expect(redirects).toBe(1);
});

test("countdown surface is accessible in every theme", async ({ page }) => {
  await page.goto(`${path}/exams/jee-main`);
  await page
    .getByRole("heading", { name: "Live Study Map", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(page.locator(".tk-map-canvas")).toBeVisible();
  for (const theme of ["Light", "Dark", "Ocean", "Valentine", "Cupcake"]) {
    await page
      .getByRole("button", { name: `${theme} theme`, exact: true })
      .filter({ visible: true })
      .click();
    const result = await new AxeBuilder({ page })
      .include(".timekeeper")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
