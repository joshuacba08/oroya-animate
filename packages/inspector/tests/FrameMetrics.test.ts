import { describe, expect, it } from 'vitest';
import { FrameMetrics } from '../src/FrameMetrics';
import { collectSceneStats } from '../src/SceneStats';
import { Scene } from '@joroya/core';
import { Node } from '@joroya/core';
import { Material, createBox } from '@joroya/core';

describe('FrameMetrics', () => {
    it('returns 0 fps before any samples are recorded', () => {
        const m = new FrameMetrics();
        expect(m.fps()).toBe(0);
        expect(m.avgFrameTimeMs()).toBe(0);
    });

    it('computes correct average for steady 60 Hz samples', () => {
        const m = new FrameMetrics(10);
        for (let i = 0; i < 10; i++) m.record(1 / 60);
        expect(m.fps()).toBeCloseTo(60, 0);
        expect(m.avgFrameTimeMs()).toBeCloseTo(16.667, 1);
    });

    it('reports max frame time over the window', () => {
        const m = new FrameMetrics(5);
        m.record(0.016);
        m.record(0.016);
        m.record(0.080); // 80ms hitch
        m.record(0.016);
        m.record(0.016);
        expect(m.maxFrameTimeMs()).toBeCloseTo(80, 0);
    });

    it('rolling window evicts old samples', () => {
        const m = new FrameMetrics(3);
        m.record(0.1);
        m.record(0.01);
        m.record(0.01);
        m.record(0.01); // overwrites the 0.1 hitch
        // Average is now 0.01, NOT (0.1+0.01+0.01)/3
        expect(m.avgFrameTimeMs()).toBeCloseTo(10, 1);
    });
});

describe('collectSceneStats', () => {
    it('counts nodes and components correctly', () => {
        const scene = new Scene();
        const a = new Node('a');
        a.addComponent(createBox(1, 1, 1));
        a.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
        scene.add(a);

        const b = new Node('b');
        scene.add(b);

        const stats = collectSceneStats(scene);
        // root + a + b = 3 nodes; each has Transform → 3 transforms + box geo + material = 5 comps
        expect(stats.nodeCount).toBe(3);
        expect(stats.componentCount).toBe(5);
        expect(stats.perComponent.Transform).toBe(3);
        expect(stats.perComponent.Geometry).toBe(1);
        expect(stats.perComponent.Material).toBe(1);
    });
});
