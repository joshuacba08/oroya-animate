import { Component, ComponentType } from './Component';
import {
    AnimationMixer,
    type AnimationClock,
    type AnimationMixerEventMap,
    type AnimationSampledValue,
} from '../animation/AnimationMixer';
import type { AnimationClip } from '../animation/AnimationClip';
import type { Scene } from '../scene/Scene';

/**
 * Declarative state of an `Animator` component.
 *
 * `animations` is keyed by clip name so consumers can `play('walk')` without
 * juggling clip object references. The `AnimationClip` type comes from
 * `@joroya/core`'s animation module — same shape glTF imports use.
 */
export interface AnimatorDef {
    /** Whether the animator is currently playing (read-only mirror of mixer state). */
    playing?: boolean;
    /** Whether the currently active clip should loop. */
    loop?: boolean;
    /** Playback speed multiplier (1 = real-time). */
    timeScale?: number;
    /** Name of the currently active clip, or empty string. */
    currentAnimation?: string;
    /** Clip library, keyed by name. */
    animations?: Record<string, AnimationClip>;
    /** If set, `play()` this clip name on mount. */
    autoplay?: string;
}

/**
 * Scene-graph component that drives keyframe animation on its host scene.
 *
 * The component owns a lazily-instantiated `AnimationMixer` that mutates
 * `node.transform` on target nodes each frame. Wire it by adding the
 * component to *any* node (commonly the camera or scene root) and feeding
 * it a `Scene` via `bindToScene(scene)` — the renderer / runtime is
 * expected to call this once after mount.
 *
 * `onUpdate(dt)` is called by `Scene.update(dt)` each frame, so the
 * Three.js renderer (or any backend) just needs to invoke `scene.update`.
 */
export class Animator extends Component {
    readonly type = ComponentType.Animator;

    definition: Required<Omit<AnimatorDef, 'autoplay'>> & { autoplay?: string };

    private mixer: AnimationMixer | null = null;
    private pendingAutoplay: string | undefined;

    constructor(definition: AnimatorDef = {}) {
        super();
        this.definition = {
            playing: false,
            loop: true,
            timeScale: 1.0,
            currentAnimation: '',
            animations: {},
            ...definition,
        };
        this.pendingAutoplay = definition.autoplay;
    }

    /**
     * Attach the Animator to a `Scene`. The renderer / runtime calls this
     * once after `renderer.mount(scene)` so the mixer can resolve target
     * nodes by name.
     */
    bindToScene(scene: Scene, clock?: AnimationClock): void {
        if (this.mixer) return;
        this.mixer = new AnimationMixer(scene, clock);
        if (this.pendingAutoplay && this.definition.animations[this.pendingAutoplay]) {
            this.play(this.pendingAutoplay);
            this.pendingAutoplay = undefined;
        }
    }

    /** Register or replace a clip in the library. */
    addClip(clip: AnimationClip): void {
        this.definition.animations[clip.name] = clip;
    }

    /**
     * Play a clip by name, replacing whatever is currently active.
     * No-op if `bindToScene` hasn't been called or the name is unknown.
     */
    play(name: string, options: { loop?: boolean; speed?: number } = {}): void {
        const clip = this.definition.animations[name];
        if (!clip || !this.mixer) {
            this.pendingAutoplay = name;
            return;
        }
        this.mixer.play(clip, {
            loop: options.loop ?? this.definition.loop,
            speed: options.speed ?? this.definition.timeScale,
        });
        this.definition.currentAnimation = name;
        this.definition.playing = true;
    }

    /**
     * Cross-fade from the current clip to a new clip over `duration` seconds.
     * Renderers see smooth interpolated transforms during the fade.
     */
    crossFade(name: string, duration: number, options: { loop?: boolean; speed?: number } = {}): void {
        const clip = this.definition.animations[name];
        if (!clip || !this.mixer) return;
        this.mixer.crossFade(clip, duration, {
            loop: options.loop ?? this.definition.loop,
            speed: options.speed ?? this.definition.timeScale,
        });
        this.definition.currentAnimation = name;
        this.definition.playing = true;
    }

    /** Stop the active clip and clear mixer state. */
    stop(): void {
        if (this.mixer) this.mixer.stop();
        this.definition.playing = false;
        this.definition.currentAnimation = '';
    }

    /** Pause without losing the current clip or pose. */
    pause(): void {
        this.mixer?.pause();
        this.definition.playing = false;
    }

    /** Resume the paused clip from the same play-head. */
    resume(): void {
        this.mixer?.resume();
        this.definition.playing = this.mixer?.playing ?? false;
    }

    /** Seek in seconds and apply the sampled pose immediately. */
    seek(time: number, options: { emitEvents?: boolean } = {}): void {
        this.mixer?.seek(time, options);
        this.definition.playing = this.mixer?.playing ?? false;
    }

    /** Pure deterministic sampling for authoring and export pipelines. */
    sampleAt(time: number, animationName = this.definition.currentAnimation): AnimationSampledValue[] {
        const clip = this.definition.animations[animationName];
        return clip && this.mixer ? this.mixer.sampleAt(time, clip) : [];
    }

    /** Advance from the clock supplied to `bindToScene`. */
    tick(): void {
        this.mixer?.tick();
        this.definition.playing = this.mixer?.playing ?? false;
    }

    /** Subscribe to mixer events (`keyframe-event`, `finished`). */
    on<K extends keyof AnimationMixerEventMap>(
        type: K,
        handler: (e: AnimationMixerEventMap[K]) => void,
    ): void {
        if (!this.mixer) {
            throw new Error('Animator.on() requires bindToScene() to be called first.');
        }
        this.mixer.on(type, handler);
    }

    /** Direct access to the mixer once bound, for advanced control. */
    get currentMixer(): AnimationMixer | null {
        return this.mixer;
    }

    onUpdate(dt: number): void {
        if (this.mixer) {
            this.mixer.update(dt);
            this.definition.playing = this.mixer.playing;
        }
    }
}
