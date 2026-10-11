import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
const results = [];
for (const route of ['/docs/serialization', '/examples', '/']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const scripts = [];
  page.on('response', async (response) => {
    if (!/\.js(?:\?|$)/.test(response.url())) return;
    try {
      const body = await response.body();
      scripts.push({ url: response.url(), bytes: body.length });
    } catch {}
  });
  await page.goto((process.argv[2] || 'http://127.0.0.1:4321') + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  results.push({ route, bytes: scripts.reduce((sum, s) => sum + s.bytes, 0), scripts });
  await page.close();
}
await browser.close();
writeFileSync(process.argv[3] || 'site-transfer.json', JSON.stringify(results, null, 2));
console.log(results.map(({route, bytes}) => ({route, bytes})));
