import type { AnimationClip } from './AnimationClip';
import type { KeyframeTrack } from './KeyframeTrack';
import type { Scene } from '../scene/Scene';
import type { Vec3, Quat } from '../components/Transform';

/**
 * The AnimationMixer is responsible for playing animation clips on a scene.
 * It updates node transforms based on keyframe data.
 */
export class AnimationMixer {
    private scene: Scene;
    private activeClip: AnimationClip | null = null;
    private currentTime: number = 0;
    private isPlaying: boolean = false;
    private loop: boolean = true;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Start playing an animation clip.
     * @param clip The animation clip to play.
     * @param loop Whether to loop the animation (default: true).
     */
    play(clip: AnimationClip, loop: boolean = true): void {
        this.activeClip = clip;
        this.currentTime = 0;
        this.isPlaying = true;
        this.loop = loop;
    }

    /**
     * Stop the currently playing animation.
     */
    stop(): void {
        this.isPlaying = false;
        this.activeClip = null;
        this.currentTime = 0;
    }

    /**
     * Pause the animation without resetting the time.
     */
    pause(): void {
        this.isPlaying = false;
    }

    /**
     * Resume a paused animation.
     */
    resume(): void {
        if (this.activeClip) {
            this.isPlaying = true;
        }
    }

    /**
     * Update the animation state and apply transforms to the scene.
     * Call this every frame with the delta time since the last frame.
     * @param deltaTime Time elapsed since last update (in seconds).
     */
    update(deltaTime: number): void {
        if (!this.isPlaying || !this.activeClip) {
            return;
        }

        this.currentTime += deltaTime;

        // Handle looping
        if (this.currentTime > this.activeClip.duration) {
            if (this.loop) {
                this.currentTime = this.currentTime % this.activeClip.duration;
            } else {
                this.currentTime = this.activeClip.duration;
                this.isPlaying = false;
            }
        }

        // Apply all tracks
        for (const track of this.activeClip.tracks) {
            this.applyTrack(track);
        }
    }

    /**
     * Apply a single keyframe track to its target node.
     */
    private applyTrack(track: KeyframeTrack): void {
        const node = this.scene.root.findNodeByName(track.targetNodeName);
        if (!node) {
            return;
        }

        const value = this.interpolateTrack(track, this.currentTime);
        if (!value) {
            return;
        }

        // Apply the interpolated value to the node's transform
        switch (track.property) {
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
            return this.extractValue(values, times.length - 1, property);
        }

        // Calculate interpolation factor
        const alpha = t2 === t1 ? 0 : (time - t1) / (t2 - t1);

        const v1 = this.extractValue(values, i1, property);
        const v2 = this.extractValue(values, i2, property);

        if (!v1 || !v2) {
            return null;
        }

        // Perform interpolation based on mode
        switch (interpolation) {
            case 'step':
                return v1;
            case 'linear':
                return this.lerp(v1, v2, alpha, property);
            case 'cubicspline':
                // TODO: Implement cubic spline interpolation
                return this.lerp(v1, v2, alpha, property);
            default:
                return v1;
        }
    }

    /**
     * Extract a single value (Vec3 or Quat) from the flat values array.
     */
    private extractValue(values: Float32Array, index: number, property: string): Vec3 | Quat | null {
        if (property === 'rotation') {
            const offset = index * 4;
            return {
                x: values[offset],
                y: values[offset + 1],
                z: values[offset + 2],
                w: values[offset + 3],
            };
        } else {
            const offset = index * 3;
            return {
                x: values[offset],
                y: values[offset + 1],
                z: values[offset + 2],
            };
        }
    }

    /**
     * Linear interpolation between two values.
     */
    private lerp(v1: Vec3 | Quat, v2: Vec3 | Quat, alpha: number, property: string): Vec3 | Quat {
        if (property === 'rotation') {
            // Quaternion slerp (simplified linear interpolation for now)
            const q1 = v1 as Quat;
            const q2 = v2 as Quat;
            return {
                x: q1.x + (q2.x - q1.x) * alpha,
                y: q1.y + (q2.y - q1.y) * alpha,
                z: q1.z + (q2.z - q1.z) * alpha,
                w: q1.w + (q2.w - q1.w) * alpha,
            };
        } else {
            const p1 = v1 as Vec3;
            const p2 = v2 as Vec3;
            return {
                x: p1.x + (p2.x - p1.x) * alpha,
                y: p1.y + (p2.y - p1.y) * alpha,
                z: p1.z + (p2.z - p1.z) * alpha,
            };
        }
    }

    /**
     * Get the current playback time.
     */
    get time(): number {
        return this.currentTime;
    }

    /**
     * Check if an animation is currently playing.
     */
    get playing(): boolean {
        return this.isPlaying;
    }
}
