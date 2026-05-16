/**
 * JSON replacer/reviver pair that round-trips the typed arrays used across
 * the scene graph (`AnimationClip.tracks.{times,values}`,
 * `BufferGeometryDef.{positions,normals,uvs,indices}`,
 * `InstancedMeshComponent.{instanceMatrix,instanceColor}`).
 *
 * Encoding format:
 * ```
 * { __typedArray: 'Float32' | 'Uint8' | 'Uint16' | 'Uint32', base64: string }
 * ```
 *
 * Base64 is the standard glTF convention for embedded binary payloads, so the
 * format stays compatible with external tooling. Encoding is synchronous to
 * keep `JSON.stringify` usable; arrays larger than ~10 MB should consider an
 * external buffer reference instead.
 */

const SUPPORTED = {
    Float32: Float32Array,
    Uint8: Uint8Array,
    Uint16: Uint16Array,
    Uint32: Uint32Array,
} as const;

type SupportedName = keyof typeof SUPPORTED;
/**
 * Accept any backing buffer flavor (`ArrayBuffer` or `SharedArrayBuffer`)
 * — TypeScript 5+ parameterizes typed arrays over `ArrayBufferLike`, and the
 * round-trip is byte-identical regardless of which the source array used.
 */
type AnyTypedArray = Float32Array | Uint8Array | Uint16Array | Uint32Array;

interface EncodedTypedArray {
    __typedArray: SupportedName;
    base64: string;
}

function isEncoded(v: unknown): v is EncodedTypedArray {
    return (
        typeof v === 'object' &&
        v !== null &&
        '__typedArray' in v &&
        'base64' in v &&
        typeof (v as EncodedTypedArray).__typedArray === 'string'
    );
}

function nameOf(arr: AnyTypedArray): SupportedName | null {
    if (arr instanceof Float32Array) return 'Float32';
    if (arr instanceof Uint8Array) return 'Uint8';
    if (arr instanceof Uint16Array) return 'Uint16';
    if (arr instanceof Uint32Array) return 'Uint32';
    return null;
}

/**
 * Base64-encode the **underlying bytes** of a typed array.
 *
 * Reading `.buffer` directly would include any byte offset; viewing the
 * typed array as a `Uint8Array` at the same offset/length is the canonical
 * way to get exactly the bytes the array represents.
 */
function bytesToBase64(arr: AnyTypedArray): string {
    const bytes = new Uint8Array(arr.buffer as ArrayBuffer, arr.byteOffset, arr.byteLength);
    // For arrays up to ~1MB this is well under the apply() arg-limit on
    // every modern engine and is the fastest sync path.
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(
            null,
            Array.from(bytes.subarray(i, i + chunkSize)),
        );
    }
    return btoaSafe(binary);
}

function base64ToBytes(b64: string): Uint8Array {
    const binary = atobSafe(b64);
    const len = binary.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
    return out;
}

/** `btoa` polyfill for Node test environments without DOM globals. */
function btoaSafe(s: string): string {
    if (typeof btoa !== 'undefined') return btoa(s);
    // Node — use Buffer via globalThis to avoid pulling `@types/node` into core.
    const g = globalThis as unknown as { Buffer?: { from(s: string, enc: string): { toString(enc: string): string } } };
    if (g.Buffer) return g.Buffer.from(s, 'binary').toString('base64');
    throw new Error('No base64 encoder available in this environment.');
}

function atobSafe(s: string): string {
    if (typeof atob !== 'undefined') return atob(s);
    const g = globalThis as unknown as { Buffer?: { from(s: string, enc: string): { toString(enc: string): string } } };
    if (g.Buffer) return g.Buffer.from(s, 'base64').toString('binary');
    throw new Error('No base64 decoder available in this environment.');
}

/**
 * `JSON.stringify` replacer that swaps typed arrays for their encoded form.
 * Compose with other replacers via wrapping if needed.
 */
export const typedArrayReplacer = (_key: string, value: unknown): unknown => {
    if (
        value instanceof Float32Array ||
        value instanceof Uint8Array ||
        value instanceof Uint16Array ||
        value instanceof Uint32Array
    ) {
        const name = nameOf(value);
        if (!name) return value;
        return { __typedArray: name, base64: bytesToBase64(value) } satisfies EncodedTypedArray;
    }
    return value;
};

/**
 * `JSON.parse` reviver that materializes encoded typed arrays.
 */
export const typedArrayReviver = (_key: string, value: unknown): unknown => {
    if (!isEncoded(value)) return value;
    const Ctor = SUPPORTED[value.__typedArray];
    if (!Ctor) return value;
    const bytes = base64ToBytes(value.base64);
    // Construct over the same buffer so we avoid copying. Use byteOffset/length
    // explicitly — the bytes returned from base64ToBytes are tightly packed.
    return new Ctor(
        bytes.buffer as ArrayBuffer,
        bytes.byteOffset,
        bytes.byteLength / Ctor.BYTES_PER_ELEMENT,
    );
};
