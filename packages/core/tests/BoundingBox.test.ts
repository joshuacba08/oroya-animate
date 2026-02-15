import { describe, it, expect } from 'vitest';
import { computeLocalAABB, transformAABB, pointInAABB } from '../src/math/BoundingBox';
import { GeometryPrimitive } from '../src/components/Geometry';
import { Matrix4Identity } from '../src/math/Matrix4';
import type { Matrix4 } from '../src/math/Matrix4';

describe('BoundingBox', () => {
    describe('computeLocalAABB', () => {
        it('should compute AABB for a Box centered at origin', () => {
            const aabb = computeLocalAABB({
                type: GeometryPrimitive.Box,
                width: 2,
                height: 4,
                depth: 6,
            });

            expect(aabb.min).toEqual({ x: -1, y: -2, z: -3 });
            expect(aabb.max).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('should compute AABB for a Sphere as enclosing cube', () => {
            const aabb = computeLocalAABB({
                type: GeometryPrimitive.Sphere,
                radius: 3,
                widthSegments: 16,
                heightSegments: 16,
            });

            expect(aabb.min).toEqual({ x: -3, y: -3, z: -3 });
            expect(aabb.max).toEqual({ x: 3, y: 3, z: 3 });
        });

        it('should compute AABB for a Path2D from control points', () => {
            const aabb = computeLocalAABB({
                type: GeometryPrimitive.Path2D,
                path: [
                    { command: 'M', args: [10, 20] },
                    { command: 'L', args: [50, 80] },
                    { command: 'L', args: [5, 60] },
                    { command: 'Z', args: [] },
                ],
            });

            expect(aabb.min).toEqual({ x: 5, y: 20, z: 0 });
            expect(aabb.max).toEqual({ x: 50, y: 80, z: 0 });
        });

        it('should return zero AABB for empty Path2D', () => {
            const aabb = computeLocalAABB({
                type: GeometryPrimitive.Path2D,
                path: [],
            });

            expect(aabb.min).toEqual({ x: 0, y: 0, z: 0 });
            expect(aabb.max).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('transformAABB', () => {
        it('should return the same AABB with identity matrix', () => {
            const aabb = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
            const result = transformAABB(aabb, [...Matrix4Identity] as Matrix4);

            expect(result.min.x).toBeCloseTo(-1);
            expect(result.min.y).toBeCloseTo(-1);
            expect(result.min.z).toBeCloseTo(-1);
            expect(result.max.x).toBeCloseTo(1);
            expect(result.max.y).toBeCloseTo(1);
            expect(result.max.z).toBeCloseTo(1);
        });

        it('should translate AABB correctly', () => {
            const aabb = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
            // Translation matrix: move +5 in X, +3 in Y, +2 in Z
            const translationMatrix: Matrix4 = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                5, 3, 2, 1,
            ];
            const result = transformAABB(aabb, translationMatrix);

            expect(result.min.x).toBeCloseTo(4);
            expect(result.min.y).toBeCloseTo(2);
            expect(result.min.z).toBeCloseTo(1);
            expect(result.max.x).toBeCloseTo(6);
            expect(result.max.y).toBeCloseTo(4);
            expect(result.max.z).toBeCloseTo(3);
        });
    });

    describe('pointInAABB', () => {
        const aabb = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        it('should return true for a point inside', () => {
            expect(pointInAABB({ x: 0, y: 0, z: 0 }, aabb)).toBe(true);
        });

        it('should return true for a point on the boundary', () => {
            expect(pointInAABB({ x: 1, y: 1, z: 1 }, aabb)).toBe(true);
        });

        it('should return false for a point outside', () => {
            expect(pointInAABB({ x: 2, y: 0, z: 0 }, aabb)).toBe(false);
        });
    });
});
