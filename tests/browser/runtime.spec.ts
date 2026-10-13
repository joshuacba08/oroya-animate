import type {} from '../runtime/types';
import { test, expect } from '@playwright/test';
test.skip(!!process.env.DEPLOYMENT_URL, 'Runtime fixture is a local acceptance harness.');
test('real WebGL, Canvas2D/SVG parity, glTF skin, resize and wrapper cleanup', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175'); await expect(page.locator('#status')).toHaveText('Ready');
  await expect(page.locator('canvas')).toHaveCount(3);
  const parity = await page.evaluate(() => window.validation.parity());
  expect(parity.updates).toBe(1); expect(parity.pixel[3]).toBeGreaterThan(0); expect(parity.svg).toContain('<svg');
  const skin = await page.evaluate(() => window.validation.skinned()); expect(skin.position).toBeCloseTo(1.5);
  await page.evaluate(() => window.validation.resize(800, 400));
  await page.evaluate(() => window.validation.disposeBindings());
  await expect(page.locator('#react canvas')).toHaveCount(0); await expect(page.locator('#vue canvas')).toHaveCount(0); expect(errors).toEqual([]);
});
test('100 real mount cycles retain a bounded allocation count', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175'); await expect(page.locator('#status')).toHaveText('Ready');
  const resources = await page.evaluate(() => window.validation.cycles(100));
  expect(resources.nodes).toBe(4); expect(resources.geometries).toBe(1); expect(resources.textures).toBe(0);
  const disposed = await page.evaluate(() => window.validation.dispose());
  expect(disposed.nodes).toBe(0); expect(disposed.geometries).toBe(0); expect(errors).toEqual([]);
});
