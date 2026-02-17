import type { KeyframeTrack } from './KeyframeTrack';

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
}
