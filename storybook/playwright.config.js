import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:6006',
    browserName: 'chromium',
    channel: process.env.STORYBOOK_BROWSER_CHANNEL || 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: [{
    command: 'npm run dev',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  }, {
    command: 'npx -y @adobe/aem-cli up --url https://migrate-hersheyland-homepage--hersheys-eds--adobedrago.aem.page --no-open --no-stop-other --no-livereload',
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  }],
});
