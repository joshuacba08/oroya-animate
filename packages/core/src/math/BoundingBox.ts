import type { GeometryDef } from '../components/Geometry';
import { GeometryPrimitive } from '../components/Geometry';
import type { Vec3 } from '../components/Transform';
import type { Matrix4 } from './Matrix4';

/**
 * Axis-Aligned Bounding Box (AABB).
 *
 * Represents a rectangular volume aligned to the world axes,
 * defined by its minimum and maximum corners.
 */
export interface AABB {
    min: Vec3;
    max: Vec3;
}

/**
 * Compute the local-space AABB for a given geometry definition.
 *
 * - **Box**: centered at origin, extends ±half in each axis.
 * - **Sphere**: a cube enclosing the sphere.
 * - **Path2D**: bounding box of all path control points.
 */
export function computeLocalAABB(def: GeometryDef): AABB {
    switch (def.type) {
        case GeometryPrimitive.Box: {
            const hw = def.width / 2;
            const hh = def.height / 2;
            const hd = def.depth / 2;
            return {
                min: { x: -hw, y: -hh, z: -hd },
                max: { x: hw, y: hh, z: hd },
            };
        }

        case GeometryPrimitive.Sphere: {
            const r = def.radius;
            return {
                min: { x: -r, y: -r, z: -r },
                max: { x: r, y: r, z: r },
            };
        }

        case GeometryPrimitive.Path2D: {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            for (const cmd of def.path) {
                for (let i = 0; i < cmd.args.length; i += 2) {
                    const x = cmd.args[i];
                    const y = cmd.args[i + 1];
                    if (x !== undefined && y !== undefined) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            // Fallback for empty paths
            if (!isFinite(minX)) {
                minX = minY = 0;
                maxX = maxY = 0;
            }

            return {
                min: { x: minX, y: minY, z: 0 },
                max: { x: maxX, y: maxY, z: 0 },
            };
        }

        case GeometryPrimitive.Text: {
            // Text AABB cannot be accurately computed without font metrics.
            // Return a zero-size box at the origin as a placeholder.
            return {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 0, z: 0 },
            };
        }
    }
}

/**
 * Transform a local-space AABB into world-space using a 4×4 matrix.
 *
 * Computes the AABB of the 8 transformed corner points.
 * The result is still axis-aligned, so it may be larger than the actual
 * oriented bounding box.
 */
export function transformAABB(aabb: AABB, matrix: Matrix4): AABB {
    const corners: Vec3[] = [
        { x: aabb.min.x, y: aabb.min.y, z: aabb.min.z },
        { x: aabb.max.x, y: aabb.min.y, z: aabb.min.z },
        { x: aabb.min.x, y: aabb.max.y, z: aabb.min.z },
        { x: aabb.max.x, y: aabb.max.y, z: aabb.min.z },
        { x: aabb.min.x, y: aabb.min.y, z: aabb.max.z },
        { x: aabb.max.x, y: aabb.min.y, z: aabb.max.z },
        { x: aabb.min.x, y: aabb.max.y, z: aabb.max.z },
        { x: aabb.max.x, y: aabb.max.y, z: aabb.max.z },
    ];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const c of corners) {
        // Column-major matrix multiply: M × [x, y, z, 1]
        const tx = matrix[0] * c.x + matrix[4] * c.y + matrix[8] * c.z + matrix[12];
        const ty = matrix[1] * c.x + matrix[5] * c.y + matrix[9] * c.z + matrix[13];
        const tz = matrix[2] * c.x + matrix[6] * c.y + matrix[10] * c.z + matrix[14];

        if (tx < minX) minX = tx;
        if (tx > maxX) maxX = tx;
        if (ty < minY) minY = ty;
        if (ty > maxY) maxY = ty;
        if (tz < minZ) minZ = tz;
        if (tz > maxZ) maxZ = tz;
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
    };
}

/**
 * Test whether a point lies inside an AABB (inclusive).
 */
export function pointInAABB(point: Vec3, aabb: AABB): boolean {
    return (
        point.x >= aabb.min.x && point.x <= aabb.max.x &&
        point.y >= aabb.min.y && point.y <= aabb.max.y &&
        point.z >= aabb.min.z && point.z <= aabb.max.z
    );
}
