import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5187', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chrome', use: { channel: 'chrome', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chrome', use: { channel: 'chrome', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: false },
})
