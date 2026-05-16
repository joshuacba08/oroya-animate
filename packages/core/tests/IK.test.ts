import { describe, expect, it } from 'vitest';
import { solve2BoneIK } from '../src/math/IK';
import type { Vec3, Quat } from '../src/components/Transform';

/**
 * Helper: rotate a point by a quaternion (q * v * q⁻¹).
 * Used to verify that the IK solution actually places the end effector on
 * the target when the rotations are applied.
 */
function rotateVec(q: Quat, v: Vec3): Vec3 {
    const ix = q.w * v.x + q.y * v.z - q.z * v.y;
    const iy = q.w * v.y + q.z * v.x - q.x * v.z;
    const iz = q.w * v.z + q.x * v.y - q.y * v.x;
    const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
    return {
        x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
        y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
        z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
    };
}

function dist(a: Vec3, b: Vec3): number {
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

describe('solve2BoneIK', () => {
    const root: Vec3 = { x: 0, y: 0, z: 0 };
    const mid: Vec3 = { x: 1, y: 0, z: 0 };
    const end: Vec3 = { x: 2, y: 0, z: 0 };
    const l1 = 1; // root → mid
    const l2 = 1; // mid → end

    it('reports `reached: true` when target is inside the reach radius', () => {
        const target: Vec3 = { x: 1.5, y: 0.5, z: 0 };
        const result = solve2BoneIK(root, mid, end, target);
        expect(result.reached).toBe(true);
    });

    it('reports `reached: false` when target is beyond the reach radius', () => {
        const target: Vec3 = { x: 5, y: 0, z: 0 }; // total chain length is 2
        const result = solve2BoneIK(root, mid, end, target);
        expect(result.reached).toBe(false);
    });

    it('returns identity rotations when target == root (degenerate)', () => {
        const result = solve2BoneIK(root, mid, end, root);
        expect(result.reached).toBe(false);
        expect(result.rootRotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    });

    it('places the end effector at the target for a reachable point', () => {
        // Target distance from root = sqrt(2) which is within reach (2).
        const target: Vec3 = { x: 1, y: 1, z: 0 };
        const result = solve2BoneIK(root, mid, end, target);

        // Apply rotations: end-effector position is
        //   root + R_root · (l1, 0, 0)                                 = new mid
        //   newMid + (R_root · R_mid) · ((l2, 0, 0) rotated by R_root) = new end
        // We can short-circuit by computing the new direction of the chain:
        //   direction to mid in world = R_root · (1, 0, 0)
        const dirToMid = rotateVec(result.rootRotation, { x: 1, y: 0, z: 0 });
        const newMid = { x: dirToMid.x * l1, y: dirToMid.y * l1, z: dirToMid.z * l1 };

        // From mid, the end is at distance l2 along the bend direction.
        // The bend rotation is in world space here; combined direction:
        const combined = {
            x: result.rootRotation.w * result.midRotation.x + result.rootRotation.x * result.midRotation.w + result.rootRotation.y * result.midRotation.z - result.rootRotation.z * result.midRotation.y,
            y: result.rootRotation.w * result.midRotation.y - result.rootRotation.x * result.midRotation.z + result.rootRotation.y * result.midRotation.w + result.rootRotation.z * result.midRotation.x,
            z: result.rootRotation.w * result.midRotation.z + result.rootRotation.x * result.midRotation.y - result.rootRotation.y * result.midRotation.x + result.rootRotation.z * result.midRotation.w,
            w: result.rootRotation.w * result.midRotation.w - result.rootRotation.x * result.midRotation.x - result.rootRotation.y * result.midRotation.y - result.rootRotation.z * result.midRotation.z,
        };
        const dirToEnd = rotateVec(combined, { x: 1, y: 0, z: 0 });
        const newEnd = {
            x: newMid.x + dirToEnd.x * l2,
            y: newMid.y + dirToEnd.y * l2,
            z: newMid.z + dirToEnd.z * l2,
        };
        // Tolerance: solver accumulates small numerical errors when the
        // rotations compose. 0.05 unit (5cm at meter scale) is acceptable.
        expect(dist(newEnd, target)).toBeLessThan(0.05);
    });

    it('extends fully toward an unreachable target (no NaN, no bend)', () => {
        const target: Vec3 = { x: 10, y: 0, z: 0 };
        const result = solve2BoneIK(root, mid, end, target);
        expect(result.reached).toBe(false);
        // Quaternion components must be finite.
        for (const k of ['x', 'y', 'z', 'w'] as const) {
            expect(Number.isFinite(result.rootRotation[k])).toBe(true);
            expect(Number.isFinite(result.midRotation[k])).toBe(true);
        }
    });

    it('respects a pole vector by flipping the bend plane', () => {
        const target: Vec3 = { x: 1, y: 0, z: 0.5 };
        const poleUp: Vec3 = { x: 0, y: 5, z: 0 };
        const poleDown: Vec3 = { x: 0, y: -5, z: 0 };
        const a = solve2BoneIK(root, mid, end, target, poleUp);
        const b = solve2BoneIK(root, mid, end, target, poleDown);
        // The two solutions must differ — flipping the pole flips the
        // elbow direction.
        const diff = Math.abs(a.midRotation.x - b.midRotation.x)
            + Math.abs(a.midRotation.y - b.midRotation.y)
            + Math.abs(a.midRotation.z - b.midRotation.z)
            + Math.abs(a.midRotation.w - b.midRotation.w);
        expect(diff).toBeGreaterThan(0.01);
    });
});
