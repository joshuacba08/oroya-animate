import { describe, expect, it } from 'vitest';
import {
    AnimationMixer,
    deserializeAnimationClip,
    type AnimationClip,
    type AnimationClock,
    serializeAnimationClip,
} from '../src/animation';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';

function clip(): AnimationClip {
    return {
        name: 'route',
        duration: 1,
        tracks: [{
            targetNodeName: 'target',
            property: 'position',
            times: new Float32Array([0, 1]),
            values: new Float32Array([0, 0, 0, 10, 0, 0]),
            interpolation: 'linear',
        }],
        events: [{ time: 0.5, name: 'middle' }],
    };
}

function subject(clock?: AnimationClock): { mixer: AnimationMixer; target: Node } {
    const scene = new Scene();
    const target = new Node('target');
    scene.add(target);
    return { mixer: new AnimationMixer(scene, clock), target };
}

describe('animation authoring controls', () => {
    it('seeks deterministically and pauses without losing the sampled pose', () => {
        const { mixer, target } = subject();
        mixer.play(clip(), { loop: false });
        mixer.seek(0.75);
        expect(target.transform.position.x).toBeCloseTo(7.5);
        mixer.pause();
        mixer.update(1);
        expect(target.transform.position.x).toBeCloseTo(7.5);
        expect(mixer.time).toBeCloseTo(0.75);
        mixer.resume();
        mixer.update(0.25);
        expect(target.transform.position.x).toBeCloseTo(10);
        expect(mixer.playing).toBe(false);
    });

    it('samples without mutating the scene or play-head', () => {
        const { mixer, target } = subject();
        mixer.play(clip());
        const sample = mixer.sampleAt(0.4);
        expect(sample[0]?.value).toMatchObject({ x: 4, y: 0, z: 0 });
        expect(target.transform.position.x).toBe(0);
        expect(mixer.time).toBe(0);
    });

    it('advances from an injected clock', () => {
        let now = 4;
        const { mixer, target } = subject({ now: () => now });
        mixer.play(clip(), { loop: false });
        mixer.tick();
        now = 4.25;
        mixer.tick();
        expect(target.transform.position.x).toBeCloseTo(2.5);
    });

    it('emits events once per crossing even across multiple loops in one step', () => {
        const { mixer } = subject();
        mixer.play(clip());
        let fired = 0;
        mixer.on('keyframe-event', () => { fired += 1; });
        mixer.update(2.6);
        expect(fired).toBe(3);
        expect(mixer.time).toBeCloseTo(0.6);
    });

    it('round-trips clips through the versioned JSON contract', () => {
        const restored = deserializeAnimationClip(serializeAnimationClip(clip()));
        expect(restored).toEqual(clip());
        expect(restored.tracks[0]?.times).toBeInstanceOf(Float32Array);
    });
});
