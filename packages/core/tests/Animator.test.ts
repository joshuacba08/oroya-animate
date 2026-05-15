import { beforeEach, describe, expect, it } from 'vitest';
import { Animator } from '../src/components/Animator';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';
import type { AnimationClip } from '../src/animation/AnimationClip';

/** Builds a simple position-only clip moving `targetNode` from y=0 to y=1 over `duration` seconds. */
function makeYClip(name: string, targetNode: string, duration: number): AnimationClip {
    return {
        name,
        duration,
        tracks: [{
            targetNodeName: targetNode,
            property: 'position',
            times: new Float32Array([0, duration]),
            values: new Float32Array([0, 0, 0, 0, 1, 0]),
            interpolation: 'linear',
        }],
    };
}

describe('Animator', () => {
    let scene: Scene;
    let target: Node;
    let host: Node;
    let animator: Animator;

    beforeEach(() => {
        scene = new Scene();
        target = new Node('target');
        host = new Node('host');
        scene.add(target);
        scene.add(host);
        animator = new Animator({
            animations: {
                walk: makeYClip('walk', 'target', 1.0),
                run: makeYClip('run', 'target', 0.5),
            },
        });
        host.addComponent(animator);
        animator.bindToScene(scene);
    });

    it('play() activates a clip and onUpdate moves the target', () => {
        animator.play('walk');
        animator.onUpdate(0.5);
        // At t=0.5 of a 1s linear 0→1 track, y should be ≈0.5
        expect(target.transform.position.y).toBeCloseTo(0.5, 2);
        expect(animator.definition.currentAnimation).toBe('walk');
        expect(animator.definition.playing).toBe(true);
    });

    it('stop() halts playback and clears state', () => {
        animator.play('walk');
        animator.stop();
        expect(animator.definition.playing).toBe(false);
        expect(animator.definition.currentAnimation).toBe('');
        // After stop, ticking should not advance the target
        const before = target.transform.position.y;
        animator.onUpdate(0.5);
        expect(target.transform.position.y).toBe(before);
    });

    it('crossFade() blends between clips over the requested duration', () => {
        animator.play('walk');
        animator.onUpdate(0.5); // walk reached y=0.5
        animator.crossFade('run', 0.2);
        // After half of the fade, run should be ~0.5 weight; output is a mix.
        animator.onUpdate(0.1);
        expect(animator.definition.currentAnimation).toBe('run');
        // After fade fully completes, only `run` is active.
        animator.onUpdate(0.2);
        expect(animator.currentMixer?.playing).toBe(true);
    });

    it('addClip() registers a new clip at runtime', () => {
        const extra = makeYClip('jump', 'target', 0.3);
        animator.addClip(extra);
        animator.play('jump');
        animator.onUpdate(0.15);
        expect(target.transform.position.y).toBeCloseTo(0.5, 1);
    });

    it('autoplay starts playback once bound to a scene', () => {
        const node = new Node('host2');
        const autoAnimator = new Animator({
            animations: { idle: makeYClip('idle', 'target', 1.0) },
            autoplay: 'idle',
        });
        node.addComponent(autoAnimator);
        autoAnimator.bindToScene(scene);
        expect(autoAnimator.definition.currentAnimation).toBe('idle');
        expect(autoAnimator.definition.playing).toBe(true);
    });

    it('dispatches keyframe events as the play-head crosses event times', () => {
        const clipWithEvent: AnimationClip = {
            ...makeYClip('walk-with-event', 'target', 1.0),
            events: [{ time: 0.5, name: 'footstep', data: { foot: 'left' } }],
        };
        animator.addClip(clipWithEvent);
        animator.play('walk-with-event');

        const fired: string[] = [];
        animator.on('keyframe-event', (e) => fired.push(e.event.name));

        animator.onUpdate(0.3); // hasn't crossed 0.5 yet
        expect(fired).toEqual([]);
        animator.onUpdate(0.3); // now at 0.6 — crossed
        expect(fired).toEqual(['footstep']);
    });

    it('emits a `finished` event for non-looping clips', () => {
        animator.play('walk', { loop: false });
        let finished = false;
        animator.on('finished', () => { finished = true; });
        animator.onUpdate(1.5);
        expect(finished).toBe(true);
    });
});
