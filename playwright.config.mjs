import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  reporter: "list",
  outputDir: "./test-results",
  use: {
    baseURL: "http://127.0.0.1:4317",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node --disable-proto=throw server/index.mjs",
    url: "http://127.0.0.1:4317/healthz",
    env: { PORT: "4317", HOST: "127.0.0.1" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
});
