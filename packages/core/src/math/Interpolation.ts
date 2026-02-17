import type { Vec3 } from '../components/Transform';

/**
 * Interpolation utilities for animation.
 */

/**
 * Cubic Hermite spline interpolation for a single scalar value.
 * 
 * Used in glTF animations with 'CUBICSPLINE' interpolation mode.
 * 
 * @param t Interpolation parameter [0, 1]
 * @param p0 Start value
 * @param m0 Start tangent (out-tangent from previous keyframe)
 * @param p1 End value
 * @param m1 End tangent (in-tangent to next keyframe)
 * @returns Interpolated value
 */
export function cubicSpline(
    t: number,
    p0: number,
    m0: number,
    p1: number,
    m1: number
): number {
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;  // (2t³ - 3t² + 1)
    const h10 = t3 - 2 * t2 + t;       // (t³ - 2t² + t)
    const h01 = -2 * t3 + 3 * t2;      // (-2t³ + 3t²)
    const h11 = t3 - t2;                // (t³ - t²)

    return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
}

/**
 * Cubic Hermite spline interpolation for Vec3.
 * 
 * @param t Interpolation parameter [0, 1]
 * @param p0 Start position
 * @param m0 Start tangent
 * @param p1 End position
 * @param m1 End tangent
 * @returns Interpolated position
 */
export function hermite(
    t: number,
    p0: Vec3,
    m0: Vec3,
    p1: Vec3,
    m1: Vec3
): Vec3 {
    return {
        x: cubicSpline(t, p0.x, m0.x, p1.x, m1.x),
        y: cubicSpline(t, p0.y, m0.y, p1.y, m1.y),
        z: cubicSpline(t, p0.z, m0.z, p1.z, m1.z),
    };
}

/**
 * Linear interpolation between two scalar values.
 * 
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor [0, 1]
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Linear interpolation between two Vec3 values.
 * 
 * @param v1 Start vector
 * @param v2 End vector
 * @param t Interpolation factor [0, 1]
 * @returns Interpolated vector
 */
export function lerpVec3(v1: Vec3, v2: Vec3, t: number): Vec3 {
    return {
        x: lerp(v1.x, v2.x, t),
        y: lerp(v1.y, v2.y, t),
        z: lerp(v1.z, v2.z, t),
    };
}
