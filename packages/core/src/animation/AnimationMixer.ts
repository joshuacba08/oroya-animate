import type { AnimationClip, KeyframeEvent } from './AnimationClip';
import type { KeyframeTrack } from './KeyframeTrack';
import type { Scene } from '../scene/Scene';
import type { Vec3, Quat } from '../components/Transform';
import { slerp } from '../math/Quaternion';
import { hermite, lerpVec3 } from '../math/Interpolation';
import { EventEmitter } from '../events/EventEmitter';

/**
 * Internal per-clip playback state. One entry per concurrently active clip.
 *
 * `weight` drives blending: when more than one entry is active the mixer
 * normalizes weights and blends their sampled values. `targetWeight` plus
 * `fadeDuration` implement cross-fading — the mixer ramps `weight` linearly
 * toward `targetWeight` over `fadeDuration` seconds and removes the entry
 * once `weight` reaches zero.
 */
interface ClipState {
    clip: AnimationClip;
    time: number;
    weight: number;
    targetWeight: number;
    fadeDuration: number;
    fadeElapsed: number;
    loop: boolean;
    speed: number;
    /** Time (in clip space) on the previous tick — used to detect event crossings. */
    lastEventTime: number;
    finished: boolean;
}

/** Monotonic time source used by `tick()`; injectable for deterministic runtimes and tests. */
export interface AnimationClock {
    now(): number;
}

export interface AnimationSampledValue {
    targetNodeName: string;
    property: KeyframeTrack['property'];
    value: Vec3 | Quat;
}

const defaultAnimationClock: AnimationClock = {
    now: () => (typeof performance === 'undefined' ? Date.now() : performance.now()) / 1000,
};

/**
 * Public event map for the mixer.
 *
 * - `keyframe-event` fires when the play-head of any active clip crosses a
 *   `KeyframeEvent` time.
 * - `finished` fires when a non-looping clip reaches its duration.
 */
export interface AnimationMixerEventMap {
    'keyframe-event': { clip: AnimationClip; event: KeyframeEvent };
    'finished': { clip: AnimationClip };
}

/**
 * Plays one or more `AnimationClip`s against a `Scene`, blending their
 * outputs into each target node's `Transform`.
 *
 * The mixer is intentionally engine-agnostic — it only reads/writes
 * `Vec3`/`Quat` on `Transform`. Renderers translate transforms to backend
 * objects as they would for any node mutation.
 */
export class AnimationMixer {
    private scene: Scene;
    private states: ClipState[] = [];
    private readonly emitter = new EventEmitter<AnimationMixerEventMap>();
    private readonly clock: AnimationClock;
    private lastClockTime: number | null = null;
    private paused = false;

    constructor(scene: Scene, clock: AnimationClock = defaultAnimationClock) {
        this.scene = scene;
        this.clock = clock;
    }

    /**
     * Start playing a clip, replacing any previously active clip.
     * Equivalent to `crossFade(clip, 0)`.
     */
    play(clip: AnimationClip, options: { loop?: boolean; speed?: number } = {}): void {
        this.validateClip(clip);
        this.validateSpeed(options.speed);
        this.states = [{
            clip,
            time: 0,
            weight: 1,
            targetWeight: 1,
            fadeDuration: 0,
            fadeElapsed: 0,
            loop: options.loop ?? true,
            speed: options.speed ?? 1,
            lastEventTime: 0,
            finished: false,
        }];
        this.paused = false;
        this.resetClock();
        this.applyBlendedState();
    }

    /**
     * Cross-fade from the current clip(s) to `clip` over `duration` seconds.
     *
     * Existing clips ramp from their current weight to 0; the new clip ramps
     * from 0 to 1. With `duration === 0` the swap is instant.
     */
    crossFade(clip: AnimationClip, duration: number, options: { loop?: boolean; speed?: number } = {}): void {
        this.validateClip(clip);
        this.validateSpeed(options.speed);
        if (!Number.isFinite(duration) || duration < 0) {
            throw new Error('AnimationMixer.crossFade() duration must be finite and non-negative.');
        }
        for (const s of this.states) {
            s.targetWeight = 0;
            s.fadeDuration = duration;
            s.fadeElapsed = 0;
        }
        this.states.push({
            clip,
            time: 0,
            weight: duration > 0 ? 0 : 1,
            targetWeight: 1,
            fadeDuration: duration,
            fadeElapsed: 0,
            loop: options.loop ?? true,
            speed: options.speed ?? 1,
            lastEventTime: 0,
            finished: false,
        });
        this.paused = false;
        this.resetClock();
    }

    /** Stop all clips and discard their state. */
    stop(): void {
        this.states = [];
        this.paused = false;
        this.resetClock();
    }

    /** Returns `true` if at least one clip is currently active. */
    get playing(): boolean {
        return !this.paused && this.states.some((state) => !state.finished && state.weight > 0);
    }

    /** Time of the most-recently-played clip (useful for single-clip cases). */
    get time(): number {
        return this.states.length > 0 ? this.states[this.states.length - 1].time : 0;
    }

    /** Pause without discarding clip state or the current sampled pose. */
    pause(): void {
        if (this.states.length === 0) return;
        this.paused = true;
        this.resetClock();
    }

    /** Continue from the exact paused play-head. */
    resume(): void {
        if (this.states.length === 0) return;
        this.paused = false;
        for (const state of this.states) state.finished = false;
        this.resetClock();
    }

    get isPaused(): boolean {
        return this.paused;
    }

    /** Seek and immediately apply the pose; scrubbing is event-free unless requested. */
    seek(time: number, options: { emitEvents?: boolean } = {}): void {
        const state = this.states[this.states.length - 1];
        if (!state) return;
        if (!Number.isFinite(time)) throw new Error('AnimationMixer.seek() time must be finite.');
        const previous = state.time;
        state.time = state.loop && state.clip.duration > 0
            ? Math.max(0, time) % state.clip.duration
            : Math.max(0, Math.min(time, state.clip.duration));
        state.finished = !state.loop && state.time >= state.clip.duration;
        if (options.emitEvents && state.time >= previous) {
            state.lastEventTime = previous;
            this.dispatchEvents(state);
        } else {
            state.lastEventTime = state.time;
        }
        this.applyBlendedState();
        this.resetClock();
    }

    /** Pure sampling that does not mutate mixer, scene, events, or playback state. */
    sampleAt(time: number, clip?: AnimationClip): AnimationSampledValue[] {
        const selected = clip ?? this.states[this.states.length - 1]?.clip;
        if (!selected) return [];
        this.validateClip(selected);
        if (!Number.isFinite(time)) throw new Error('AnimationMixer.sampleAt() time must be finite.');
        const sampleTime = Math.max(0, Math.min(time, selected.duration));
        return selected.tracks.flatMap((track) => {
            const value = this.interpolateTrack(track, sampleTime);
            return value ? [{ targetNodeName: track.targetNodeName, property: track.property, value }] : [];
        });
    }

    /** Advance using the injected monotonic clock. The first call establishes a baseline. */
    tick(): void {
        const current = this.clock.now();
        if (!Number.isFinite(current)) throw new Error('Animation clock returned a non-finite value.');
        if (this.lastClockTime === null) {
            this.lastClockTime = current;
            return;
        }
        const delta = Math.max(0, current - this.lastClockTime);
        this.lastClockTime = current;
        this.update(delta);
    }

    resetClock(): void {
        this.lastClockTime = null;
    }

    on<K extends keyof AnimationMixerEventMap>(
        type: K,
        handler: (e: AnimationMixerEventMap[K]) => void,
    ): void {
        this.emitter.on(type, handler);
    }

    off<K extends keyof AnimationMixerEventMap>(
        type: K,
        handler: (e: AnimationMixerEventMap[K]) => void,
    ): void {
        this.emitter.off(type, handler);
    }

    /**
     * Advance every active clip by `deltaTime` seconds, then write the
     * blended result to each affected node's transform.
     */
    update(deltaTime: number): void {
        if (this.states.length === 0 || this.paused) return;
        if (!Number.isFinite(deltaTime) || deltaTime < 0) {
            throw new Error('AnimationMixer.update() deltaTime must be finite and non-negative.');
        }

        // 1. Advance time and fade weights for each clip.
        for (const s of this.states) {
            if (s.finished) continue;
            this.advancePlayback(s, deltaTime * s.speed);
            this.advanceFade(s, deltaTime);
        }

        // 2. Drop fully faded-out clips (after dispatching their tail events).
        this.states = this.states.filter((s) => s.weight > 0);

        if (this.states.length === 0) return;

        this.applyBlendedState();
    }

    private applyBlendedState(): void {
        if (this.states.length === 0) return;

        // 3. Sample each track from each clip, blend by normalized weight.
        const totalWeight = this.states.reduce((sum, s) => sum + s.weight, 0);
        if (totalWeight <= 0) return;

        const accum = new Map<string, { property: KeyframeTrack['property']; value: Vec3 | Quat; weight: number }>();

        for (const s of this.states) {
            const w = s.weight / totalWeight;
            for (const track of s.clip.tracks) {
                const value = this.interpolateTrack(track, s.time);
                if (!value) continue;
                const key = `${track.targetNodeName}|${track.property}`;
                const existing = accum.get(key);
                if (!existing) {
                    accum.set(key, { property: track.property, value: this.scaleValue(value, w, track.property), weight: w });
                } else {
                    existing.value = this.addValue(existing.value, this.scaleValue(value, w, track.property), track.property);
                    existing.weight += w;
                }
            }
        }

        // 4. Write blended values to transforms.
        for (const [key, entry] of accum) {
            const [nodeName, property] = key.split('|');
            const node = this.scene.root.findNodeByName(nodeName);
            if (!node) continue;
            const value = this.normalizeBlended(entry.value, property as KeyframeTrack['property']);
            switch (property) {
                case 'position':
                    node.transform.position = value as Vec3;
                    break;
                case 'rotation':
                    node.transform.rotation = value as Quat;
                    break;
                case 'scale':
                    node.transform.scale = value as Vec3;
                    break;
            }
            node.transform.updateLocalMatrix();
        }
    }

    private validateClip(clip: AnimationClip): void {
        if (!Number.isFinite(clip.duration) || clip.duration <= 0) {
            throw new Error(`Animation clip "${clip.name}" must have a positive finite duration.`);
        }
        for (const track of clip.tracks) {
            if (track.times.length === 0) {
                throw new Error(`Animation track "${track.targetNodeName}.${track.property}" has no keyframes.`);
            }
        }
    }

    private validateSpeed(speed: number | undefined): void {
        if (speed !== undefined && (!Number.isFinite(speed) || speed < 0)) {
            throw new Error('Animation playback speed must be finite and non-negative.');
        }
    }

    private advancePlayback(s: ClipState, amount: number): void {
        if (amount <= 0) return;
        if (!s.loop) {
            s.time = Math.min(s.time + amount, s.clip.duration);
            this.dispatchEvents(s);
            if (s.time >= s.clip.duration && !s.finished) {
                s.finished = true;
                this.emitter.emit('finished', { clip: s.clip });
            }
            return;
        }

        let remaining = amount;
        while (remaining > 0) {
            const untilEnd = s.clip.duration - s.time;
            const step = Math.min(remaining, untilEnd);
            s.time += step;
            this.dispatchEvents(s);
            remaining -= step;
            if (s.time >= s.clip.duration) {
                s.time = 0;
                s.lastEventTime = 0;
            }
        }
    }

    private advanceFade(s: ClipState, dt: number): void {
        if (s.weight === s.targetWeight) return;
        if (s.fadeDuration <= 0) {
            s.weight = s.targetWeight;
            return;
        }
        s.fadeElapsed += dt;
        const alpha = Math.min(s.fadeElapsed / s.fadeDuration, 1);
        const start = s.targetWeight === 0 ? 1 : 0;
        s.weight = start + (s.targetWeight - start) * alpha;
    }

    private dispatchEvents(s: ClipState): void {
        if (!s.clip.events || s.clip.events.length === 0) return;
        const from = s.lastEventTime;
        const to = s.time;
        // Within the clip's duration the play-head moves forward monotonically
        // between loop wraps, so a half-open (from, to] window is the natural
        // emission range.
        for (const ev of s.clip.events) {
            if (ev.time > from && ev.time <= to) {
                this.emitter.emit('keyframe-event', { clip: s.clip, event: ev });
            }
        }
        s.lastEventTime = to;
    }

    private scaleValue(value: Vec3 | Quat, w: number, property: KeyframeTrack['property']): Vec3 | Quat {
        if (property === 'rotation') {
            // Quaternion blending is non-trivial; for low blend counts we use
            // weighted nlerp on the accumulator and renormalize at the end.
            const q = value as Quat;
            return { x: q.x * w, y: q.y * w, z: q.z * w, w: q.w * w };
        }
        const v = value as Vec3;
        return { x: v.x * w, y: v.y * w, z: v.z * w };
    }

    private addValue(a: Vec3 | Quat, b: Vec3 | Quat, property: KeyframeTrack['property']): Vec3 | Quat {
        if (property === 'rotation') {
            const qa = a as Quat;
            const qb = b as Quat;
            // Take the shortest-path hemisphere to avoid quaternion sign flips
            // collapsing the blended rotation toward identity.
            const dot = qa.x * qb.x + qa.y * qb.y + qa.z * qb.z + qa.w * qb.w;
            const s = dot < 0 ? -1 : 1;
            return {
                x: qa.x + qb.x * s,
                y: qa.y + qb.y * s,
                z: qa.z + qb.z * s,
                w: qa.w + qb.w * s,
            };
        }
        const va = a as Vec3;
        const vb = b as Vec3;
        return { x: va.x + vb.x, y: va.y + vb.y, z: va.z + vb.z };
    }

    private normalizeBlended(value: Vec3 | Quat, property: KeyframeTrack['property']): Vec3 | Quat {
        if (property === 'rotation') {
            const q = value as Quat;
            const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
            return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
        }
        return value;
    }

    /**
     * Interpolate a track's value at the given time.
     */
    private interpolateTrack(track: KeyframeTrack, time: number): Vec3 | Quat | null {
        const { times, values, interpolation, property } = track;

        // Find the keyframe indices to interpolate between
        let i1 = 0;
        for (let i = 0; i < times.length - 1; i++) {
            if (time >= times[i] && time < times[i + 1]) {
                i1 = i;
                break;
            }
        }

        const i2 = Math.min(i1 + 1, times.length - 1);
        const t1 = times[i1];
        const t2 = times[i2];

        // If we're at or past the last keyframe, return the last value
        if (time >= times[times.length - 1]) {
            return this.extractValue(values, times.length - 1, property, interpolation);
        }

        // Calculate interpolation factor
        const alpha = t2 === t1 ? 0 : (time - t1) / (t2 - t1);

        switch (interpolation) {
            case 'step':
                return this.extractValue(values, i1, property, interpolation);

            case 'linear': {
                const v1 = this.extractValue(values, i1, property, interpolation);
                const v2 = this.extractValue(values, i2, property, interpolation);
                if (!v1 || !v2) return null;
                return this.lerp(v1, v2, alpha, property);
            }

            case 'cubicspline': {
                const stride = property === 'rotation' ? 4 : 3;
                const offset1 = i1 * 3 * stride;
                const offset2 = i2 * 3 * stride;

                const p0 = this.extractValueAtOffset(values, offset1 + stride, property);
                const m0 = this.extractValueAtOffset(values, offset1 + 2 * stride, property);
                const p1 = this.extractValueAtOffset(values, offset2 + stride, property);
                const m1 = this.extractValueAtOffset(values, offset2, property);

                if (!p0 || !m0 || !p1 || !m1) {
                    const v1 = this.extractValue(values, i1, property, 'linear');
                    const v2 = this.extractValue(values, i2, property, 'linear');
                    if (!v1 || !v2) return null;
                    return this.lerp(v1, v2, alpha, property);
                }

                if (property === 'rotation') {
                    return slerp(p0 as Quat, p1 as Quat, alpha);
                } else {
                    const td = t2 - t1;
                    return hermite(
                        alpha,
                        p0 as Vec3,
                        { x: m0.x * td, y: m0.y * td, z: m0.z * td },
                        p1 as Vec3,
                        { x: m1.x * td, y: m1.y * td, z: m1.z * td },
                    );
                }
            }

            default:
                return this.extractValue(values, i1, property, interpolation);
        }
    }

    private extractValue(
        values: Float32Array,
        index: number,
        property: string,
        interpolation: string,
    ): Vec3 | Quat | null {
        const stride = property === 'rotation' ? 4 : 3;
        const offset = interpolation === 'cubicspline'
            ? index * 3 * stride + stride
            : index * stride;
        return this.extractValueAtOffset(values, offset, property);
    }

    private extractValueAtOffset(
        values: Float32Array,
        offset: number,
        property: string,
    ): Vec3 | Quat | null {
        if (offset < 0 || offset >= values.length) return null;
        if (property === 'rotation') {
            return {
                x: values[offset],
                y: values[offset + 1],
                z: values[offset + 2],
                w: values[offset + 3],
            };
        }
        return {
            x: values[offset],
            y: values[offset + 1],
            z: values[offset + 2],
        };
    }

    private lerp(v1: Vec3 | Quat, v2: Vec3 | Quat, alpha: number, property: string): Vec3 | Quat {
        if (property === 'rotation') {
            return slerp(v1 as Quat, v2 as Quat, alpha);
        }
        return lerpVec3(v1 as Vec3, v2 as Vec3, alpha);
    }
}
