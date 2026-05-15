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

// ── Easing functions ──────────────────────────────────────────
//
// All easings take `t` in [0, 1] and return a re-mapped value in [0, 1].
// Penner / Robert Penner-style formulations, with quad and cubic
// variants. Use with `lerp(a, b, easeXxx(t))` to apply to a value.

/** No easing — identity. */
export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;

export const easeInQuad: Easing = (t) => t * t;
export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);
export const easeInOutQuad: Easing = (t) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInCubic: Easing = (t) => t * t * t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Easing = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Sine-based eases, gentlest curve. */
export const easeInSine: Easing = (t) => 1 - Math.cos((t * Math.PI) / 2);
export const easeOutSine: Easing = (t) => Math.sin((t * Math.PI) / 2);
export const easeInOutSine: Easing = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Elastic bounce-out for snappy "settle into place" feel. */
export const easeOutElastic: Easing = (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * Critically-damped spring integrator.
 *
 * Models a target-seeking spring as a second-order ODE solved with implicit
 * Euler — stable for any timestep. Use it for smooth, physics-like motion
 * toward a target value: cameras, UI follow, IK bones.
 *
 * @example
 * let pos = 0, vel = 0;
 * function tick(dt: number) {
 *   ({ value: pos, velocity: vel } = spring(pos, target, vel, 120, 14, dt));
 * }
 *
 * @param current   Current value.
 * @param target    Target value the spring is pulling toward.
 * @param velocity  Current velocity (carry between frames).
 * @param stiffness Spring constant (higher = snappier). Typical 100-300.
 * @param damping   Damping coefficient (higher = less oscillation). Typical 10-30.
 *                  Critical damping ≈ 2 * sqrt(stiffness).
 * @param dt        Timestep in seconds.
 */
export function spring(
    current: number,
    target: number,
    velocity: number,
    stiffness: number,
    damping: number,
    dt: number,
): { value: number; velocity: number } {
    const force = -stiffness * (current - target);
    const drag = -damping * velocity;
    const acceleration = force + drag;
    const newVelocity = velocity + acceleration * dt;
    const newValue = current + newVelocity * dt;
    return { value: newValue, velocity: newVelocity };
}
