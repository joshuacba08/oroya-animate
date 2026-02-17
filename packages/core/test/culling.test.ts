import { describe, it, expect } from 'vitest';
import { BoundingSphere, Frustum, Matrix4, Vector3, InstancedMesh, createBox, GeometryPrimitive } from '../src';
import { composeMatrix, Matrix4Identity } from '../src/math/Matrix4';

describe('Culling & Optimization', () => {

    describe('BoundingSphere', () => {
        it('should transform correctly with translation', () => {
            const sphere = new BoundingSphere({ x: 0, y: 0, z: 0 }, 1);
            const matrix = composeMatrix({ x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 });

            sphere.applyMatrix4(matrix);

            expect(sphere.center.x).toBeCloseTo(10);
            expect(sphere.center.y).toBeCloseTo(0);
            expect(sphere.center.z).toBeCloseTo(0);
            expect(sphere.radius).toBeCloseTo(1);
        });

        it('should transform correctly with uniform scale', () => {
            const sphere = new BoundingSphere({ x: 0, y: 0, z: 0 }, 1);
            const matrix = composeMatrix({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 2, y: 2, z: 2 });

            sphere.applyMatrix4(matrix);

            expect(sphere.center.x).toBeCloseTo(0);
            expect(sphere.radius).toBeCloseTo(2);
        });
    });

    describe('Frustum', () => {
        it('should detect sphere intersection', () => {
            // Identity matrix represents a box from -1 to 1 in normalized device coordinates (roughly)
            // But Frustum extraction depends on row-major/column-major and Z range (0..1 or -1..1).
            // THREE.js math (which we mirrored?) typically assumes -1..1 for Z in Projection? 
            // Actually, let's just test with a manual Frustum or Identity.
            // With Identity VP, planes are x+1, x-1, y+1, y-1, z+1, z-1 (normalized).

            const frustum = new Frustum();
            frustum.setFromProjectionMatrix(Matrix4Identity as unknown as Matrix4);

            const insideSphere = new BoundingSphere({ x: 0, y: 0, z: 0 }, 0.5);
            expect(frustum.intersectsSphere(insideSphere)).toBe(true);

            const outsideSphere = new BoundingSphere({ x: 5, y: 0, z: 0 }, 0.5);
            expect(frustum.intersectsSphere(outsideSphere)).toBe(false);
        });
    });

    describe('InstancedMesh.computeBoundingSphere', () => {
        it('should calculate bounding sphere enclosing all instances', () => {
            const box = createBox(1, 1, 1);
            // Box radius = sqrt(1+1+1)/2 = 0.866025

            const mesh = new InstancedMesh(box.definition, { color: { r: 1, g: 1, b: 1 } }, 2);

            // Instance 0 at 0,0,0
            const m0 = composeMatrix({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 });
            mesh.setMatrixAt(0, m0);

            // Instance 1 at 10,0,0
            const m1 = composeMatrix({ x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 });
            mesh.setMatrixAt(1, m1);

            const sphere = mesh.computeBoundingSphere();

            // Centroid should be (0+10)/2 = 5
            expect(sphere.center.x).toBeCloseTo(5);
            expect(sphere.center.y).toBeCloseTo(0);
            expect(sphere.center.z).toBeCloseTo(0);

            // Radius: dist(5,0) + localRadius(0.866) = 5.866
            // dist(5,10) + localRadius(0.866) = 5.866
            expect(sphere.radius).toBeCloseTo(5.866, 2);
        });

        it('should handle scaling of instances', () => {
            const box = createBox(1, 1, 1); // r ~ 0.866
            const mesh = new InstancedMesh(box.definition, { color: { r: 1, g: 1, b: 1 } }, 1);

            // Instance scaled by 2
            const m0 = composeMatrix({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 2, y: 2, z: 2 });
            mesh.setMatrixAt(0, m0);

            const sphere = mesh.computeBoundingSphere();

            expect(sphere.center.x).toBeCloseTo(0);
            expect(sphere.radius).toBeCloseTo(0.866025 * 2, 3);
        });
    });

});
