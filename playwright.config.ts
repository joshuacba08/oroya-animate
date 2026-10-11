import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  use: { baseURL: process.env.DEPLOYMENT_URL || 'http://127.0.0.1:4321',
    viewport: { width: 1280, height: 800 },
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
    trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: process.env.DEPLOYMENT_URL ? undefined : {
    command: 'pnpm --filter web preview --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
