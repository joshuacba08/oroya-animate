import { test, expect } from '@playwright/test';
test.skip(!!process.env.DEPLOYMENT_URL, 'Editor is verified locally; documentation deployment contains only web.');
test('viewport gizmo drag is one reversible authoring command', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: 'hero', exact: true }).click();
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  const bounds = (await page.getByLabel('Scene viewport').boundingBox())!;
  const x = bounds.x + bounds.width * 0.57; const y = bounds.y + bounds.height * 0.46;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y + 15, { steps: 10 }); await page.mouse.up();
  const position = Number(await page.getByLabel('Position X', { exact: true }).inputValue()); expect(Math.abs(position)).toBeGreaterThan(0.1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await page.getByRole('button', { name: 'hero', exact: true }).click();
  await expect(page.getByLabel('Position X', { exact: true })).toHaveValue('0'); await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});
test('authoring, undo/redo, save/load and invalid import', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174');
  await expect(page.getByLabel('Scene viewport')).toBeVisible();
  await page.getByRole('button', { name: 'hero', exact: true }).click();
  await page.getByLabel('Position X', { exact: true }).fill('3'); await page.getByLabel('Position X', { exact: true }).press('Enter');
  await expect(page.getByLabel('Position X', { exact: true })).toHaveValue('3');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'hero', exact: true }).click(); await expect(page.getByLabel('Position X', { exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByRole('button', { name: 'hero', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click(); await expect(page.getByRole('button', { name: 'hero copy', exact: true })).toBeVisible();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Save', exact: true }).click();
  const path = await (await download).path(); expect(path).toBeTruthy();
  await page.getByLabel('Add object', { exact: true }).selectOption('sphere');
  page.once('dialog', (dialog) => dialog.accept()); await page.getByLabel('Load scene file', { exact: true }).setInputFiles(path!);
  await expect(page.getByRole('button', { name: 'hero copy', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  // Import is asynchronous; wait for the completed load before replacing its input.
  await expect(page.getByRole('button', { name: 'Load', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Save status', { exact: true })).toHaveText('Saved');
  await page.getByLabel('Load scene file', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"root":null}') });
  await expect(page.getByRole('alert')).toContainText('Expected a node'); await expect(page.getByRole('button', { name: 'hero copy', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
