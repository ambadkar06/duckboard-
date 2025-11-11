import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const port = isCI ? 4173 : 5173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  expect: {
    timeout: isCI ? 15000 : 5000,
  },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },

  projects: isCI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
      ],

  webServer: {
    command: isCI ? 'npm run preview' : 'npm run dev',
    port,
    reuseExistingServer: !isCI,
  },
})