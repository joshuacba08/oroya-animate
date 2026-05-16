import type { Vec3, Quat } from '../components/Transform';
import * as V from './Vector3';

/**
 * Result of a 2-bone IK solve. Apply the rotations to the corresponding
 * bones to make the chain reach the target — `rootRotation` to the
 * shoulder/hip, `midRotation` to the elbow/knee.
 */
export interface IK2BoneResult {
    /** New world-space rotation for the root bone (shoulder / hip). */
    rootRotation: Quat;
    /** New world-space rotation for the mid bone (elbow / knee). */
    midRotation: Quat;
    /** `true` if the chain could reach the target; `false` if fully extended. */
    reached: boolean;
}

/**
 * Analytical 2-bone IK solver (law of cosines).
 *
 * Given a chain `root → mid → end` with fixed segment lengths `l1` and
 * `l2`, computes the rotations that place `end` at `target` (or as close
 * as possible if `target` is outside the reach of `l1 + l2`).
 *
 * **Pole vector**: optional `pole` argument specifies the preferred plane
 * for the chain. The mid bone rotates around the root→target axis so that
 * its bend direction aligns with `pole`. Without a pole, the mid joint
 * bends in the +X direction (an arbitrary but stable default).
 *
 * This is the classic two-bone analytical solve used for arms, legs, and
 * tentacles. It runs in O(1) per call — no iteration. For chains longer
 * than 2 bones, use CCD or FABRIK (out of scope here).
 *
 * @param rootPos World-space position of the root joint.
 * @param midPos World-space position of the mid joint (current).
 * @param endPos World-space position of the end effector (current).
 * @param target World-space position to reach toward.
 * @param pole Optional world-space hint for the bend plane.
 */
/** @experimental — argument order may be reworked when multi-bone IK lands. */
export function solve2BoneIK(
    rootPos: Vec3,
    midPos: Vec3,
    endPos: Vec3,
    target: Vec3,
    pole?: Vec3,
): IK2BoneResult {
    const l1 = V.distanceTo(rootPos, midPos);
    const l2 = V.distanceTo(midPos, endPos);

    // Direction from root to target — the chain's primary axis after the solve.
    const toTarget = V.sub(target, rootPos);
    const distance = V.length(toTarget);
    if (distance < 1e-6) {
        // Target == root: degenerate. Return identity rotations.
        return { rootRotation: { x: 0, y: 0, z: 0, w: 1 }, midRotation: { x: 0, y: 0, z: 0, w: 1 }, reached: false };
    }
    const toTargetN = V.multiplyScalar(toTarget, 1 / distance);

    // Reachability: clamp distance to [|l1-l2|, l1+l2]. Outside this range,
    // either the target is too far (fully extended) or too close (fully folded).
    const reach = l1 + l2;
    const reachable = distance < reach && distance > Math.abs(l1 - l2);
    const clamped = Math.min(Math.max(distance, Math.abs(l1 - l2) + 1e-6), reach - 1e-6);

    // Law of cosines: angle at the root between (root→target) and (root→mid).
    //   l2² = l1² + clamped² - 2·l1·clamped·cos(rootAngle)
    //   cos(rootAngle) = (l1² + clamped² - l2²) / (2·l1·clamped)
    const cosRoot = (l1 * l1 + clamped * clamped - l2 * l2) / (2 * l1 * clamped);
    const rootAngle = Math.acos(Math.max(-1, Math.min(1, cosRoot)));

    // Law of cosines: angle at the mid joint (the "bend" angle).
    //   clamped² = l1² + l2² - 2·l1·l2·cos(midAngle)
    const cosMid = (l1 * l1 + l2 * l2 - clamped * clamped) / (2 * l1 * l2);
    const midAngleInterior = Math.acos(Math.max(-1, Math.min(1, cosMid)));
    // Convert interior angle to rotation amount: a fully-extended chain has
    // midAngleInterior = π (straight); we want bend = 0 in that case.
    const midBendAngle = Math.PI - midAngleInterior;

    // Build the bend plane. Bend axis = toTarget × pole (perpendicular to both).
    // If no pole supplied, derive a stable one by picking the axis least
    // aligned with toTarget.
    const poleDir = pole ? V.normalize(V.sub(pole, rootPos)) : pickStablePole(toTargetN);
    const bendAxis = V.normalize(V.cross(toTargetN, poleDir));

    // Root bone rotation: rotate (1,0,0) (default forward) onto direction
    // root→mid. That mid-direction is `toTargetN` rotated by `rootAngle`
    // around `bendAxis`.
    const rootToMidDir = rotateVectorByAxisAngle(toTargetN, bendAxis, -rootAngle);
    const rootRotation = quatFromVectors({ x: 1, y: 0, z: 0 }, rootToMidDir);

    // Mid bone rotation: bend by `midBendAngle` around the local equivalent
    // of bendAxis. Expressed here in world space — caller responsible for
    // converting to local space if their bones live under a parent.
    const midRotation = quatFromAxisAngle(bendAxis, midBendAngle);

    return { rootRotation, midRotation, reached: reachable };
}

/**
 * Helper: pick a pole direction that's well-conditioned for an arbitrary
 * target axis. We pick whichever world axis is least parallel to
 * `targetAxis` and offset it slightly, so `cross(targetAxis, pole)` is
 * never degenerate.
 */
function pickStablePole(targetAxis: Vec3): Vec3 {
    // Use the world Y axis unless the target is nearly vertical, in which
    // case fall back to X.
    if (Math.abs(targetAxis.y) < 0.95) return { x: 0, y: 1, z: 0 };
    return { x: 1, y: 0, z: 0 };
}

/**
 * Rotate `v` by `angle` radians around `axis` (Rodrigues' formula).
 */
function rotateVectorByAxisAngle(v: Vec3, axis: Vec3, angle: number): Vec3 {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const k = axis;
    const dot = V.dot(k, v);
    return {
        x: v.x * cosA + (k.y * v.z - k.z * v.y) * sinA + k.x * dot * (1 - cosA),
        y: v.y * cosA + (k.z * v.x - k.x * v.z) * sinA + k.y * dot * (1 - cosA),
        z: v.z * cosA + (k.x * v.y - k.y * v.x) * sinA + k.z * dot * (1 - cosA),
    };
}

/**
 * Quaternion that rotates `from` onto `to` (both should be unit vectors).
 */
function quatFromVectors(from: Vec3, to: Vec3): Quat {
    const f = V.normalize(from);
    const t = V.normalize(to);
    const d = V.dot(f, t);
    if (d > 0.999999) return { x: 0, y: 0, z: 0, w: 1 };
    if (d < -0.999999) {
        // 180° rotation around any axis perpendicular to `from`.
        const axis = Math.abs(f.x) < 0.9 ? V.cross({ x: 1, y: 0, z: 0 }, f) : V.cross({ x: 0, y: 1, z: 0 }, f);
        const a = V.normalize(axis);
        return { x: a.x, y: a.y, z: a.z, w: 0 };
    }
    const c = V.cross(f, t);
    const w = 1 + d;
    const len = Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z + w * w);
    return { x: c.x / len, y: c.y / len, z: c.z / len, w: w / len };
}

/**
 * Quaternion from axis-angle (angle in radians, axis normalized).
 */
function quatFromAxisAngle(axis: Vec3, angle: number): Quat {
    const half = angle / 2;
    const s = Math.sin(half);
    return { x: axis.x * s, y: axis.y * s, z: axis.z * s, w: Math.cos(half) };
}
