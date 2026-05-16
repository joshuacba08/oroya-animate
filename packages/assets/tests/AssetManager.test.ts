import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetManager } from '../src/AssetManager';

describe('AssetManager — custom loaders', () => {
    let manager: AssetManager;

    beforeEach(() => {
        manager = new AssetManager();
    });

    afterEach(() => manager.clear());

    it('uses a custom loader registered via registerLoader', async () => {
        const loader = vi.fn(async () => ({ value: 42 }));
        manager.registerLoader('custom', loader);
        const result = await manager.load<{ value: number }>('/x', 'custom');
        expect(result).toEqual({ value: 42 });
        expect(loader).toHaveBeenCalledOnce();
    });

    it('deduplicates concurrent loads for the same URL', async () => {
        const loader = vi.fn(async () => ({ id: 1 }));
        manager.registerLoader('custom', loader);
        const [a, b, c] = await Promise.all([
            manager.load('/dup', 'custom'),
            manager.load('/dup', 'custom'),
            manager.load('/dup', 'custom'),
        ]);
        expect(a).toBe(b);
        expect(b).toBe(c);
        expect(loader).toHaveBeenCalledOnce();
    });

    it('ref counts increments per load and decrements per release', async () => {
        manager.registerLoader('custom', async () => 'asset');
        await manager.load('/r', 'custom');
        await manager.load('/r', 'custom');
        await manager.load('/r', 'custom');
        expect(manager.refCount('/r')).toBe(3);
        expect(manager.release('/r')).toBe(false);
        expect(manager.release('/r')).toBe(false);
        expect(manager.refCount('/r')).toBe(1);
        expect(manager.release('/r')).toBe(true);
        expect(manager.refCount('/r')).toBe(0);
        expect(manager.get('/r')).toBeUndefined();
    });

    it('get() returns the cached value after load resolves', async () => {
        manager.registerLoader('custom', async () => 'hello');
        await manager.load('/g', 'custom');
        expect(manager.get('/g')).toBe('hello');
    });

    it('throws when no loader is registered for the type', async () => {
        await expect(manager.load('/missing', 'unknown')).rejects.toThrow(/No loader registered/);
    });

    it('clear() evicts everything', async () => {
        manager.registerLoader('custom', async () => 'x');
        await manager.load('/a', 'custom');
        await manager.load('/b', 'custom');
        manager.clear();
        expect(manager.refCount('/a')).toBe(0);
        expect(manager.refCount('/b')).toBe(0);
    });
});

describe('AssetManager — preload progress', () => {
    it('emits progress / loaded events in order', async () => {
        const manager = new AssetManager();
        manager.registerLoader('custom', async (url) => `loaded:${url}`);

        const progress: Array<{ loaded: number; total: number; url: string }> = [];
        const loaded: string[] = [];
        manager.on('progress', (e) => progress.push(e));
        manager.on('loaded', (e) => loaded.push(e.url));

        await manager.preload([
            { url: '/a', type: 'custom' as 'binary' },
            { url: '/b', type: 'custom' as 'binary' },
        ]);

        // Both URLs resolved.
        expect(loaded.sort()).toEqual(['/a', '/b']);
        // Two progress events, both reporting total=2.
        expect(progress).toHaveLength(2);
        expect(progress.every((p) => p.total === 2)).toBe(true);
        expect(progress[progress.length - 1].loaded).toBe(2);
    });

    it('emits `error` for failing items but does not reject the overall preload', async () => {
        const manager = new AssetManager();
        manager.registerLoader('custom', async (url) => {
            if (url === '/bad') throw new Error('nope');
            return 'ok';
        });

        const errors: Array<{ url: string }> = [];
        manager.on('error', (e) => errors.push({ url: e.url }));

        await expect(manager.preload([
            { url: '/good', type: 'custom' as 'binary' },
            { url: '/bad', type: 'custom' as 'binary' },
        ])).resolves.toBeUndefined();

        expect(errors).toEqual([{ url: '/bad' }]);
        expect(manager.get('/good')).toBe('ok');
    });
});
