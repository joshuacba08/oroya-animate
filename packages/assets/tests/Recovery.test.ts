import { describe, expect, it } from 'vitest';
import { AssetManager } from '../src';

describe('asset failure and cancellation isolation', () => {
  it('evicts rejected requests so the next acquisition retries', async () => {
    const manager = new AssetManager(); let calls = 0;
    manager.registerLoader('test', async () => { if (++calls === 1) throw new Error('offline'); return 'ok'; });
    await expect(manager.load('/asset', 'test')).rejects.toThrow('offline');
    expect(manager.refCount('/asset')).toBe(0);
    await expect(manager.load('/asset', 'test')).resolves.toBe('ok');
    manager.clear();
  });
  it('never writes a retired response into a new acquisition of the same URL', async () => {
    const manager = new AssetManager(); const resolutions: Array<(value: string) => void> = [];
    manager.registerLoader('test', () => new Promise<string>((resolve) => resolutions.push(resolve)));
    const old = manager.load('/asset', 'test'); await Promise.resolve();
    const rejection = expect(old).rejects.toMatchObject({ name: 'AbortError' });
    manager.release('/asset');
    const current = manager.load('/asset', 'test'); await Promise.resolve();
    resolutions[0]('stale'); await rejection;
    expect(manager.get('/asset')).toBeUndefined();
    resolutions[1]('current'); await current;
    expect(manager.get('/asset')).toBe('current'); manager.clear();
  });
  it('retains shared acquisitions and rejects conflicting asset types', async () => {
    const manager = new AssetManager(); manager.registerLoader('test', async () => 'value');
    await Promise.all([manager.load('/shared', 'test'), manager.load('/shared', 'test')]);
    await expect(manager.load('/shared', 'json')).rejects.toThrow('different type');
    expect(manager.release('/shared')).toBe(false); expect(manager.get('/shared')).toBe('value');
    expect(manager.release('/shared')).toBe(true);
  });
});
