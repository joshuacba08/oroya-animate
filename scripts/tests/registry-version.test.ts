import { describe, expect, it, vi } from 'vitest';
import { registryVersion, waitForRegistry } from '../registry-version.js';
describe('registry propagation and failure handling', () => {
  it('accepts an immutable version and recognizes a missing version', async () => {
    const missing = vi.fn(async () => new Response('', { status: 404 }));
    expect(await registryVersion('@joroya/core', '1.2.0-rc.0', missing)).toBeUndefined();
    const present = vi.fn(async () => Response.json({ name: '@joroya/core', version: '1.2.0-rc.0' }));
    expect(await registryVersion('@joroya/core', '1.2.0-rc.0', present)).toBe('1.2.0-rc.0');
  });
  it('does not classify authorization or server errors as absent versions', async () => {
    for (const status of [401, 403, 500]) await expect(registryVersion('@joroya/core', '1.2.0-rc.0', async () => new Response('', { status }))).rejects.toThrow('HTTP ' + status);
  });
  it('waits for publication to become visible and fails if propagation never completes', async () => {
    const read = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue('1.2.0-rc.0'); const wait = vi.fn(async () => {});
    await waitForRegistry(read, '1.2.0-rc.0', wait); expect(read).toHaveBeenCalledTimes(2);
    await expect(waitForRegistry(async () => undefined, '1.2.0-rc.0', wait)).rejects.toThrow('propagation timeout');
  });
});
