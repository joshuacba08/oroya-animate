import { EventEmitter } from '@joroya/core';

/**
 * Built-in asset kinds. Custom loaders extend this union via
 * `AssetManager.registerLoader`.
 */
export type AssetType = 'image' | 'audio' | 'json' | 'text' | 'binary';

/**
 * A request to preload a specific asset.
 */
export interface PreloadEntry {
    url: string;
    type: AssetType;
}

/**
 * Signature of a custom loader. Receives the URL and an `AbortSignal` for
 * mid-flight cancellation; returns whatever decoded representation the
 * application expects.
 */
export type AssetLoader<T> = (url: string, signal: AbortSignal) => Promise<T>;

interface CacheEntry<T = unknown> {
    type: string;
    promise: Promise<T>;
    value?: T;
    refCount: number;
    abort: AbortController;
}

/**
 * Public event map for the asset manager.
 *
 * `progress` fires after each item resolves (success or failure), giving a
 * `loaded / total` snapshot suitable for driving a progress bar. `loaded`
 * fires per item. `error` fires per failing item; the overall `preload()`
 * promise still resolves (with the failing items unloaded) so a single bad
 * URL doesn't crash the loader.
 */
export interface AssetEventMap {
    progress: { loaded: number; total: number; url: string };
    loaded: { url: string };
    error: { url: string; error: unknown };
}

/**
 * Centralized asset cache for an application.
 *
 * Three layers of value:
 * 1. **Deduplication** — concurrent requests for the same URL share one
 *    fetch / decode pass.
 * 2. **Ref-counting** — `get(url)` increments, `release(url)` decrements;
 *    when the count hits zero the entry is evicted, freeing the underlying
 *    object (`AudioBuffer`, `ImageBitmap`, etc.) for GC.
 * 3. **Extensibility** — `registerLoader` swaps in custom loaders for
 *    glTF / FBX / etc. so the same cache backs application-specific types.
 *
 * @public
 */
export class AssetManager {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly loaders = new Map<string, AssetLoader<unknown>>();
    private readonly emitter = new EventEmitter<AssetEventMap>();

    constructor() {
        this.loaders.set('image', this.loadImage);
        this.loaders.set('audio', this.loadAudio);
        this.loaders.set('json', this.loadJson);
        this.loaders.set('text', this.loadText);
        this.loaders.set('binary', this.loadBinary);
    }

    on<K extends keyof AssetEventMap>(type: K, handler: (e: AssetEventMap[K]) => void): void {
        this.emitter.on(type, handler);
    }

    off<K extends keyof AssetEventMap>(type: K, handler: (e: AssetEventMap[K]) => void): void {
        this.emitter.off(type, handler);
    }

    /** Register a custom loader. Returns the manager for chaining. */
    registerLoader<T>(type: string, loader: AssetLoader<T>): this {
        this.loaders.set(type, loader as AssetLoader<unknown>);
        return this;
    }

    /**
     * Preload a list of assets. The returned promise resolves after every
     * entry has either loaded or errored. Per-item failures emit `error`
     * events but do not reject the overall promise — apps decide what to
     * do based on `progress`.
     */
    async preload(entries: PreloadEntry[]): Promise<void> {
        const total = entries.length;
        let loaded = 0;
        await Promise.all(entries.map(async (entry) => {
            try {
                await this.load(entry.url, entry.type);
                this.emitter.emit('loaded', { url: entry.url });
            } catch (error) {
                this.emitter.emit('error', { url: entry.url, error });
            } finally {
                loaded++;
                this.emitter.emit('progress', { loaded, total, url: entry.url });
            }
        }));
    }

    /**
     * Acquire an asset, loading it if not cached. Increments the ref count
     * on each call — pair with `release(url)` when done.
     */
    async load<T = unknown>(url: string, type: AssetType | string = 'binary'): Promise<T> {
        let entry = this.cache.get(url);
        if (!entry) {
            const loader = this.loaders.get(type);
            if (!loader) {
                throw new Error(`No loader registered for asset type "${type}"`);
            }
            const abort = new AbortController();
            const promise = loader(url, abort.signal)
                .then((value) => {
                    const e = this.cache.get(url);
                    if (e) e.value = value;
                    return value;
                });
            entry = { type, promise, refCount: 0, abort };
            this.cache.set(url, entry);
        }
        entry.refCount++;
        return entry.promise as Promise<T>;
    }

    /**
     * Synchronous accessor for an already-loaded asset. Returns `undefined`
     * if the asset is missing or still loading — use `load()` first.
     * Does **not** change the ref count.
     */
    get<T = unknown>(url: string): T | undefined {
        return this.cache.get(url)?.value as T | undefined;
    }

    /**
     * Decrement the ref count. When it reaches zero, the entry is evicted
     * and (for cancellable in-flight loads) the underlying request is
     * aborted. Returns `true` if the entry was removed.
     */
    release(url: string): boolean {
        const entry = this.cache.get(url);
        if (!entry) return false;
        entry.refCount = Math.max(0, entry.refCount - 1);
        if (entry.refCount === 0) {
            entry.abort.abort();
            this.cache.delete(url);
            return true;
        }
        return false;
    }

    /** Current ref count for an asset, or 0 if uncached. */
    refCount(url: string): number {
        return this.cache.get(url)?.refCount ?? 0;
    }

    /** Forcibly evict every cached asset. */
    clear(): void {
        for (const entry of this.cache.values()) {
            entry.abort.abort();
        }
        this.cache.clear();
    }

    // ── Built-in loaders ──────────────────────────────────────

    private loadImage: AssetLoader<HTMLImageElement> = (url) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });

    private loadAudio: AssetLoader<AudioBuffer> = async (url, signal) => {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const buf = await res.arrayBuffer();
        // Use a transient AudioContext for decoding — the app's playback
        // pipeline (usually a renderer-owned context) can handle the buffer
        // afterwards regardless of which context decoded it.
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        try {
            return await ctx.decodeAudioData(buf);
        } finally {
            void ctx.close();
        }
    };

    private loadJson: AssetLoader<unknown> = async (url, signal) => {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.json();
    };

    private loadText: AssetLoader<string> = async (url, signal) => {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
    };

    private loadBinary: AssetLoader<ArrayBuffer> = async (url, signal) => {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.arrayBuffer();
    };
}
