import type { AnimationClip, KeyframeEvent } from './AnimationClip';
import type { InterpolationMode, KeyframeTrack } from './KeyframeTrack';

export interface SerializedKeyframeTrack {
    targetNodeName: string;
    property: KeyframeTrack['property'];
    times: number[];
    values: number[];
    interpolation: InterpolationMode;
}

export interface SerializedAnimationClip {
    schemaVersion: 1;
    name: string;
    duration: number;
    tracks: SerializedKeyframeTrack[];
    events?: KeyframeEvent[];
}

/** Convert typed arrays into a JSON-safe, versioned authoring contract. */
export function serializeAnimationClip(clip: AnimationClip): SerializedAnimationClip {
    return {
        schemaVersion: 1,
        name: clip.name,
        duration: clip.duration,
        tracks: clip.tracks.map((track) => ({
            targetNodeName: track.targetNodeName,
            property: track.property,
            times: Array.from(track.times),
            values: Array.from(track.values),
            interpolation: track.interpolation,
        })),
        ...(clip.events ? { events: structuredClone(clip.events) } : {}),
    };
}

/** Restore fresh `Float32Array` instances and reject malformed persisted clips. */
export function deserializeAnimationClip(serialized: SerializedAnimationClip): AnimationClip {
    if (serialized.schemaVersion !== 1) {
        throw new Error(`Unsupported animation clip schema version: ${String(serialized.schemaVersion)}`);
    }
    if (!Number.isFinite(serialized.duration) || serialized.duration <= 0) {
        throw new Error('Serialized animation clip duration must be positive and finite.');
    }
    return {
        name: serialized.name,
        duration: serialized.duration,
        tracks: serialized.tracks.map((track) => {
            const stride = track.property === 'rotation' ? 4 : 3;
            const factor = track.interpolation === 'cubicspline' ? 3 : 1;
            if (track.times.length === 0 || track.values.length !== track.times.length * stride * factor) {
                throw new Error(
                    `Invalid values length for ${track.targetNodeName}.${track.property}: expected ${track.times.length * stride * factor}.`,
                );
            }
            return {
                targetNodeName: track.targetNodeName,
                property: track.property,
                times: new Float32Array(track.times),
                values: new Float32Array(track.values),
                interpolation: track.interpolation,
            };
        }),
        ...(serialized.events ? { events: structuredClone(serialized.events) } : {}),
    };
}
