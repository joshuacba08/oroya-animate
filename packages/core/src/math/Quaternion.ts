import type { Quat } from '../components/Transform';

/**
 * Quaternion utility functions for 3D rotations.
 * 
 * Quaternions represent rotations in 3D space and avoid gimbal lock.
 * Format: { x, y, z, w } where w is the scalar component.
 */

/**
 * Compute the dot product of two quaternions.
 * Used to determine the angle between rotations.
 */
export function dot(q1: Quat, q2: Quat): number {
    return q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
}

/**
 * Normalize a quaternion to unit length.
 * Required for valid rotation quaternions.
 */
export function normalize(q: Quat): Quat {
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);

    if (len === 0) {
        return { x: 0, y: 0, z: 0, w: 1 }; // Identity quaternion
    }

    const invLen = 1 / len;
    return {
        x: q.x * invLen,
        y: q.y * invLen,
        z: q.z * invLen,
        w: q.w * invLen,
    };
}

/**
 * Spherical linear interpolation (SLERP) between two quaternions.
 * 
 * Provides smooth, constant-velocity rotation interpolation.
 * Automatically takes the shortest path between rotations.
 * 
 * @param q1 Start quaternion
 * @param q2 End quaternion
 * @param t Interpolation factor [0, 1]
 * @returns Interpolated quaternion
 */
export function slerp(q1: Quat, q2: Quat, t: number): Quat {
    // Compute dot product
    let dotProduct = dot(q1, q2);

    // If the dot product is negative, negate q2 to take the shorter path
    let q2Adjusted = q2;
    if (dotProduct < 0) {
        q2Adjusted = { x: -q2.x, y: -q2.y, z: -q2.z, w: -q2.w };
        dotProduct = -dotProduct;
    }

    // Clamp dot product to avoid numerical errors with acos
    dotProduct = Math.min(Math.max(dotProduct, -1), 1);

    // If quaternions are very close, use linear interpolation to avoid division by zero
    const threshold = 0.9995;
    if (dotProduct > threshold) {
        // Linear interpolation
        const result = {
            x: q1.x + t * (q2Adjusted.x - q1.x),
            y: q1.y + t * (q2Adjusted.y - q1.y),
            z: q1.z + t * (q2Adjusted.z - q1.z),
            w: q1.w + t * (q2Adjusted.w - q1.w),
        };
        return normalize(result);
    }

    // Perform spherical linear interpolation
    const theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);
    const weight1 = Math.sin((1 - t) * theta) / sinTheta;
    const weight2 = Math.sin(t * theta) / sinTheta;

    return {
        x: weight1 * q1.x + weight2 * q2Adjusted.x,
        y: weight1 * q1.y + weight2 * q2Adjusted.y,
        z: weight1 * q1.z + weight2 * q2Adjusted.z,
        w: weight1 * q1.w + weight2 * q2Adjusted.w,
    };
}

/**
 * Compute the conjugate of a quaternion.
 * For unit quaternions, this is equivalent to the inverse.
 * 
 * @param q Input quaternion
 * @returns Conjugate quaternion
 */
export function conjugate(q: Quat): Quat {
    return {
        x: -q.x,
        y: -q.y,
        z: -q.z,
        w: q.w,
    };
}
