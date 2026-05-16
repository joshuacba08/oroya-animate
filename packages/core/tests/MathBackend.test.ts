import { afterEach, describe, expect, it } from 'vitest';
import { getMathBackend, registerMathBackend, type MathBackend } from '../src/math/MathBackend';
import { Matrix4Identity, type Matrix4 } from '../src/math/Matrix4';

describe('MathBackend registry', () => {
    afterEach(() => registerMathBackend(null));

    it('returns the JS backend by default', () => {
        expect(getMathBackend().name).toBe('js');
    });

    it('multiplies identity matrices to identity', () => {
        const a = [...Matrix4Identity] as Matrix4;
        const b = [...Matrix4Identity] as Matrix4;
        const out = [...Matrix4Identity] as Matrix4;
        getMathBackend().multiplyMatrices(a, b, out);
        expect(out).toEqual(Matrix4Identity);
    });

    it('register / restore round trip', () => {
        const fake: MathBackend = {
            name: 'fake-wasm',
            multiplyMatrices: (_a, _b, out) => {
                for (let i = 0; i < 16; i++) out[i] = -1;
                return out;
            },
        };
        registerMathBackend(fake);
        expect(getMathBackend().name).toBe('fake-wasm');

        const out = [...Matrix4Identity] as Matrix4;
        getMathBackend().multiplyMatrices(
            [...Matrix4Identity] as Matrix4,
            [...Matrix4Identity] as Matrix4,
            out,
        );
        expect(out.every((v) => v === -1)).toBe(true);

        registerMathBackend(null);
        expect(getMathBackend().name).toBe('js');
    });
});
