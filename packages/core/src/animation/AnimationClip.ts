import type { KeyframeTrack } from './KeyframeTrack';

/**
 * A named event fired by the mixer when playback crosses a specific time
 * within a clip.
 *
 * Authoring use: place a `{ time: 0.4, name: 'footstep' }` on a walk cycle
 * and any listener registered via `AnimationMixer.on('keyframe-event', ...)`
 * will receive the event on the frame the play-head crosses it. Useful for
 * footsteps, attack hit-frames, dialogue triggers.
 *
 * Events are de-duplicated per loop iteration — they only fire once per
 * crossing, even if the mixer ticks past the time in a single large `dt`.
 */
export interface KeyframeEvent {
    /** Time within the clip (seconds) at which the event fires. */
    time: number;
    /** Event identifier used by listeners (`on('keyframe-event', ...)`). */
    name: string;
    /** Arbitrary payload forwarded to listeners. */
    data?: unknown;
}

/**
 * An animation clip is a collection of keyframe tracks that can be played together.
 * This is the engine-agnostic representation of an animation.
 */
export interface AnimationClip {
    /**
     * The name of the animation clip (e.g., "Walk", "Run", "Idle").
     */
    name: string;

    /**
     * The total duration of the animation in seconds.
     */
    duration: number;

    /**
     * The keyframe tracks that make up this animation.
     */
    tracks: KeyframeTrack[];

    /**
     * Optional discrete events emitted as the play-head crosses specific times.
     */
    events?: KeyframeEvent[];
}
