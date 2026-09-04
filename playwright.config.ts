import { defineConfig, devices } from "@playwright/test";

/**
 * E2E (Playwright) — javni wizard + admin panel, desktop 1440×900 i mobilni 390×844.
 * Pokreće `next dev` na portu 3100 (da ne smeta `npm run dev` na 3000) i gađa DEV Convex
 * deployment iz .env.local. Admin testovi traže `E2E_ADMIN_KEY` u okruženju (ključ je
 * u HANDOVER-SECRETS.local.md).
 *
 *   E2E_ADMIN_KEY=... npm run e2e
 */
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "sr-Latn-RS",
    timezoneId: "Europe/Belgrade",
    // Hero ima WebGL (R3F neon): u headless Chromium-u hardverski GL zna da izgubi
    // kontekst pod opterećenjem i sruši tab („This page couldn't load") — SwiftShader
    // (softverski GL) je stabilan.
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
