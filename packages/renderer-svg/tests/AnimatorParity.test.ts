import { describe, expect, it } from 'vitest';
import {
    Animator,
    Camera,
    CameraType,
    createBox,
    Material,
    Node,
    Scene,
    type AnimationClip,
} from '@joroya/core';
import { renderToSVG } from '../src/renderSVG';

/**
 * Animator must drive `node.transform` regardless of backend. The SVG
 * renderer is engine-agnostic at the scene-graph level — its `renderToSVG`
 * call now ticks `scene.update(dt)` so a registered Animator advances
 * positions before the world-matrix pass.
 */
describe('Animator parity in SVG backend', () => {
    function makePositionClip(targetNode: string, duration: number): AnimationClip {
        return {
            name: 'slide',
            duration,
            tracks: [{
                targetNodeName: targetNode,
                property: 'position',
                times: new Float32Array([0, duration]),
                values: new Float32Array([0, 0, 0, 100, 0, 0]),
                interpolation: 'linear',
            }],
        };
    }

    it('renderToSVG advances Animator via scene.update', () => {
        const scene = new Scene();

        const camera = new Node('cam');
        camera.addComponent(new Camera({
            type: CameraType.Orthographic,
            left: -200, right: 200, top: -200, bottom: 200, near: 0, far: 100,
        }));
        scene.add(camera);

        const target = new Node('box');
        target.addComponent(createBox(10, 10, 10));
        target.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));
        scene.add(target);

        const host = new Node('animator-host');
        const animator = new Animator({
            animations: { slide: makePositionClip('box', 1.0) },
            autoplay: 'slide',
        });
        host.addComponent(animator);
        scene.add(host);
        animator.bindToScene(scene);

        // First render at t=0 — the box hasn't moved yet.
        renderToSVG(scene, { width: 400, height: 400, dt: 0 });
        expect(target.transform.position.x).toBeCloseTo(0, 5);

        // Advance half a second of clip time across one render.
        renderToSVG(scene, { width: 400, height: 400, dt: 0.5 });
        expect(target.transform.position.x).toBeCloseTo(50, 5);
    });
});
