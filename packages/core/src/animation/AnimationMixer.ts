import type { AnimationClip } from './AnimationClip';
import type { KeyframeTrack } from './KeyframeTrack';
import type { Scene } from '../scene/Scene';
import type { Vec3, Quat } from '../components/Transform';
import { slerp } from '../math/Quaternion';
import { hermite, lerpVec3 } from '../math/Interpolation';

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
            return this.extractValue(values, times.length - 1, property, interpolation);
        }

        // Calculate interpolation factor
        const alpha = t2 === t1 ? 0 : (time - t1) / (t2 - t1);

        // Perform interpolation based on mode
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
                // glTF CUBICSPLINE format: [in-tangent, value, out-tangent] for each keyframe
                // Extract values and tangents
                const stride = property === 'rotation' ? 4 : 3;
                const offset1 = i1 * 3 * stride; // 3 values per keyframe (in, value, out)
                const offset2 = i2 * 3 * stride;

                // Extract p0 (value at i1) and m0 (out-tangent at i1)
                const p0 = this.extractValueAtOffset(values, offset1 + stride, property);
                const m0 = this.extractValueAtOffset(values, offset1 + 2 * stride, property);

                // Extract p1 (value at i2) and m1 (in-tangent at i2)
                const p1 = this.extractValueAtOffset(values, offset2 + stride, property);
                const m1 = this.extractValueAtOffset(values, offset2, property);

                if (!p0 || !m0 || !p1 || !m1) {
                    // Fallback to linear if cubic spline data is malformed
                    const v1 = this.extractValue(values, i1, property, 'linear');
                    const v2 = this.extractValue(values, i2, property, 'linear');
                    if (!v1 || !v2) return null;
                    return this.lerp(v1, v2, alpha, property);
                }

                // Apply Hermite interpolation
                if (property === 'rotation') {
                    // For quaternions, we still use SLERP (cubic spline for quaternions is complex)
                    return slerp(p0 as Quat, p1 as Quat, alpha);
                } else {
                    // For position/scale, use Hermite spline
                    const td = t2 - t1; // Time delta
                    return hermite(
                        alpha,
                        p0 as Vec3,
                        { x: m0.x * td, y: m0.y * td, z: m0.z * td }, // Scale tangent by time delta
                        p1 as Vec3,
                        { x: m1.x * td, y: m1.y * td, z: m1.z * td }
                    );
                }
            }

            default:
                return this.extractValue(values, i1, property, interpolation);
        }
    }

    /**
     * Extract a single value (Vec3 or Quat) from the flat values array.
     * For CUBICSPLINE, the index points to the middle value (not in-tangent).
     */
    private extractValue(
        values: Float32Array,
        index: number,
        property: string,
        interpolation: string
    ): Vec3 | Quat | null {
        const stride = property === 'rotation' ? 4 : 3;
        let offset: number;

        if (interpolation === 'cubicspline') {
            // CUBICSPLINE: [in-tangent, value, out-tangent] per keyframe
            offset = index * 3 * stride + stride; // Point to the middle (value)
        } else {
            // LINEAR or STEP: just the value
            offset = index * stride;
        }

        return this.extractValueAtOffset(values, offset, property);
    }

    /**
     * Extract a value at a specific offset in the values array.
     */
    private extractValueAtOffset(
        values: Float32Array,
        offset: number,
        property: string
    ): Vec3 | Quat | null {
        if (offset < 0 || offset >= values.length) {
            return null;
        }

        if (property === 'rotation') {
            return {
                x: values[offset],
                y: values[offset + 1],
                z: values[offset + 2],
                w: values[offset + 3],
            };
        } else {
            return {
                x: values[offset],
                y: values[offset + 1],
                z: values[offset + 2],
            };
        }
    }

    /**
     * Interpolation between two values.
     * Uses SLERP for quaternions, linear for Vec3.
     */
    private lerp(v1: Vec3 | Quat, v2: Vec3 | Quat, alpha: number, property: string): Vec3 | Quat {
        if (property === 'rotation') {
            // Use proper spherical linear interpolation for quaternions
            return slerp(v1 as Quat, v2 as Quat, alpha);
        } else {
            // Linear interpolation for position and scale
            return lerpVec3(v1 as Vec3, v2 as Vec3, alpha);
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
