import { describe, expect, it, vi } from 'vitest';
import { deploymentPage } from '../deployment-page.js';
const page = (commit: string) => new Response('Oroya <meta content="' + commit + '">');
describe('deployment propagation checks', () => {
  it('waits for the public alias to serve the accepted commit without forwarding protected-host cookies', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(page('old')).mockResolvedValueOnce(page('new'));
    const wait = vi.fn();
    await expect(deploymentPage('https://docs.example/', 'new', {}, { publicAlias: true, fetcher, wait })).resolves.toContain('new');
    expect(wait).toHaveBeenCalledWith(2000);
    expect(fetcher.mock.calls[1][0].searchParams.get('oroya_verify')).toBe('new-1');
    expect(fetcher.mock.calls[1][1].headers).not.toHaveProperty('cookie');
  });
  it('rejects an incorrect immutable deployment immediately', async () => {
    const fetcher = vi.fn().mockResolvedValue(page('old')), wait = vi.fn();
    await expect(deploymentPage('https://build.example/', 'new', {}, { fetcher, wait })).rejects.toThrow('unexpected deployment commit');
    expect(fetcher).toHaveBeenCalledTimes(1); expect(wait).not.toHaveBeenCalled();
  });
  it('keeps propagation bounded and fails HTTP errors', async () => {
    const fetcher = vi.fn().mockImplementation(async () => page('old')), wait = vi.fn();
    await expect(deploymentPage('https://docs.example/', 'new', {}, { publicAlias: true, fetcher, wait })).rejects.toThrow('propagation wait');
    expect(fetcher).toHaveBeenCalledTimes(30); expect(wait).toHaveBeenCalledTimes(29);
    await expect(deploymentPage('https://docs.example/', 'new', {}, { publicAlias: true, fetcher: async () => new Response('', { status: 403 }) })).rejects.toThrow('HTTP 403');
  });
});
