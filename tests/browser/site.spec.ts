import { test, expect } from '@playwright/test';

for (const locale of ['', '/es', '/ja']) {
  test('guides and navigation ' + (locale || 'en'), async ({ page }) => {
    const errors: string[] = [];
    const scripts: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', async (response) => {
      if (/\.js(?:\?|$)/.test(response.url())) {
        try { scripts.push((await response.body()).toString()); } catch {}
      }
    });
    await page.goto(locale + '/docs/serialization', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toContainText('Animator');
    await expect(page.locator('main')).toContainText('Scene(root?: Node)');
    await page.goto(locale + '/docs/scene-graph', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toContainText('setPosition');
    expect(scripts.some((body) => /THREE\.WebGLRenderer|SAPBroadphase|monaco-editor/.test(body))).toBe(false);
    expect(errors).toEqual([]);
  });
}
test('hero creates a working WebGL canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(await page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) =>
    !!canvas.getContext('webgl2') && canvas.width > 0 && canvas.height > 0)).toBe(true);
  expect(errors).toEqual([]);
});
test('gallery lazy loading and repeated mount/unmount', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/examples', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(requests.some((url) => /physics-demo|audio-demo|monaco-editor/.test(url))).toBe(false);
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.getByRole('button', { name: /Hello Cube/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('canvas')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('playground editor and example execution', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/playground', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 30000 });
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('✓ Ejecutado correctamente', { exact: true })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('SVG demo preserves click and hover interaction', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/examples', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /SVG Interactive/ }).first().click();
  const dialog = page.getByRole('dialog');
  const shape = dialog.locator('svg circle[data-oroya-id]').first();
  await expect(shape).toBeVisible();
  const original = await shape.getAttribute('fill');
  await shape.hover(); await expect(shape).toHaveAttribute('stroke-width', '4');
  await shape.click(); expect(await shape.getAttribute('fill')).not.toBe(original);
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});
