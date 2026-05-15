import { describe, expect, it } from 'vitest';
import {
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInSine,
    easeOutSine,
    easeOutElastic,
    linear,
    spring,
} from '../src/math/Interpolation';

describe('Easing functions', () => {
    it('all eases pass through (0,0) and (1,1)', () => {
        const eases = [
            linear, easeInQuad, easeOutQuad, easeInOutQuad,
            easeInCubic, easeOutCubic, easeInOutCubic,
            easeInSine, easeOutSine, easeOutElastic,
        ];
        for (const e of eases) {
            expect(e(0)).toBeCloseTo(0, 5);
            expect(e(1)).toBeCloseTo(1, 5);
        }
    });

    it('easeInQuad is below identity in (0,1) — slow start', () => {
        expect(easeInQuad(0.5)).toBeLessThan(0.5);
    });

    it('easeOutQuad is above identity in (0,1) — fast start', () => {
        expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
    });

    it('easeInOutQuad is symmetric around t=0.5', () => {
        expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 5);
        expect(easeInOutQuad(0.25) + easeInOutQuad(0.75)).toBeCloseTo(1, 5);
    });

    it('cubic variants are even more pronounced than quad', () => {
        expect(easeInCubic(0.5)).toBeLessThan(easeInQuad(0.5));
        expect(easeOutCubic(0.5)).toBeGreaterThan(easeOutQuad(0.5));
    });
});

describe('spring()', () => {
    it('reaches the target asymptotically with reasonable parameters', () => {
        let v = 0;
        let vel = 0;
        for (let i = 0; i < 200; i++) {
            ({ value: v, velocity: vel } = spring(v, 10, vel, 150, 20, 0.016));
        }
        expect(v).toBeCloseTo(10, 1);
        expect(Math.abs(vel)).toBeLessThan(0.1);
    });

    it('overshoots with low damping (under-damped spring)', () => {
        let v = 0;
        let vel = 0;
        let maxValue = 0;
        for (let i = 0; i < 200; i++) {
            ({ value: v, velocity: vel } = spring(v, 1, vel, 200, 2, 0.016));
            if (v > maxValue) maxValue = v;
        }
        expect(maxValue).toBeGreaterThan(1);
    });

    it('does not overshoot with critical damping', () => {
        let v = 0;
        let vel = 0;
        let maxValue = 0;
        const stiffness = 100;
        const damping = 2 * Math.sqrt(stiffness); // critical damping
        for (let i = 0; i < 300; i++) {
            ({ value: v, velocity: vel } = spring(v, 1, vel, stiffness, damping, 0.016));
            if (v > maxValue) maxValue = v;
        }
        expect(maxValue).toBeLessThanOrEqual(1.05); // small numerical tolerance for implicit Euler
    });
});
