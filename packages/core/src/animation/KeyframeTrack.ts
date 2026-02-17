/**
 * Interpolation modes for keyframe animation.
 */
export type InterpolationMode = 'linear' | 'step' | 'cubicspline';

/**
 * A keyframe track defines animation data for a single property of a node.
 * This is engine-agnostic and can be translated to Three.js AnimationClip or other backends.
 */
export interface KeyframeTrack {
    /**
     * The name of the target node to animate.
     * This should match the node's name in the scene graph.
     */
    targetNodeName: string;

    /**
     * The property to animate (position, rotation, or scale).
     */
    property: 'position' | 'rotation' | 'scale';

    /**
     * Array of time values (in seconds) for each keyframe.
     */
    times: Float32Array;

    /**
     * Array of values for each keyframe.
     * - For position/scale: [x, y, z, x, y, z, ...]
     * - For rotation: [x, y, z, w, x, y, z, w, ...] (quaternions)
     */
    values: Float32Array;

    /**
     * Interpolation mode between keyframes.
     */
    interpolation: InterpolationMode;
}
