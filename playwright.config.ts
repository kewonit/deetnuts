import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3107";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "chromium-320", use: { viewport: { width: 320, height: 800 }, hasTouch: true } },
    { name: "chromium-390", use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "chromium-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "chromium-1024", use: { viewport: { width: 1024, height: 900 } } },
    { name: "chromium-1440", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3107",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          ADMISSIONS_V2_MHT_CET: "true",
        },
      },
});
