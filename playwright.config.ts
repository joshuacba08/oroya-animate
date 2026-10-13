import { defineConfig, devices } from '@playwright/test';
const deployed = !!process.env.DEPLOYMENT_URL;
export default defineConfig({
  testDir: './tests/browser', timeout: 60000,
  use: { baseURL: process.env.DEPLOYMENT_URL || 'http://127.0.0.1:4321',
    viewport: { width: 1280, height: 800 }, storageState: process.env.DEPLOYMENT_STORAGE_STATE,
    trace: process.env.DEPLOYMENT_STORAGE_STATE ? 'off' : 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'],
      // Linux runners have software GL drivers; Firefox otherwise blocks WebGL2.
      ...(process.platform === 'linux' ? { launchOptions: { firefoxUserPrefs: {
        'webgl.force-enabled': true, 'webgl.disabled': false,
      } } } : {}),
    } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', testMatch: /runtime\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', testMatch: /runtime\.spec\.ts/, use: { ...devices['iPhone 13'] } },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: deployed ? undefined : [
    { command: 'pnpm --filter web preview --host 127.0.0.1 --port 4321', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI, timeout: 60000 },
    { command: 'pnpm --filter editor preview --host 127.0.0.1 --port 4174', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI, timeout: 60000 },
    { command: 'pnpm --filter editor exec vite --config ../../tests/runtime/vite.config.ts', url: 'http://127.0.0.1:4175', reuseExistingServer: !process.env.CI, timeout: 60000 },
  ],
});
