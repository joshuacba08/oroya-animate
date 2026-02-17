import { Node } from './Node';
import { Geometry, GeometryDef, GeometryPrimitive, BoxGeometryDef, SphereGeometryDef, CylinderGeometryDef, ConeGeometryDef, PlaneGeometryDef } from '../components/Geometry';
import { Material, MaterialDef } from '../components/Material';
import { InstancedMeshComponent } from '../components/InstancedMeshComponent';
import { Matrix4 } from '../math/Matrix4';
import { BoundingSphere } from '../math/BoundingSphere';
import { Vec3 } from '../components/Transform';
import { ColorRGB } from '../components/Material';
import { ComponentType } from '../components/Component';

/**
 * A specialized Node that represents multiple instances of the same geometry and material.
 * This is a high-level wrapper around the InstancedMeshComponent.
 */
export class InstancedMesh extends Node {
    readonly instancedMeshComponent: InstancedMeshComponent;

    constructor(
        geometry: GeometryDef | Geometry,
        material: MaterialDef | Material,
        count: number,
        useColors: boolean = false
    ) {
        super('InstancedMesh');

        // Add Geometry Component
        if (geometry instanceof Geometry) {
            this.addComponent(geometry);
        } else {
            this.addComponent(new Geometry(geometry));
        }

        // Add Material Component
        if (material instanceof Material) {
            this.addComponent(material);
        } else {
            this.addComponent(new Material(material));
        }

        // Add InstancedMesh Component
        this.instancedMeshComponent = new InstancedMeshComponent(count, useColors);
        this.addComponent(this.instancedMeshComponent);
    }

    /**
     * Sets the local transformation matrix for a specific instance.
     * @param index The index of the instance.
     * @param matrix The 4x4 matrix.
     */
    setMatrixAt(index: number, matrix: Matrix4): void {
        this.instancedMeshComponent.setMatrixAt(index, matrix);
    }

    /**
     * Gets the local transformation matrix for a specific instance.
     * @param index The index of the instance.
     * @param target Optional target matrix to copy into.
     */
    getMatrixAt(index: number, target?: Matrix4): Matrix4 {
        return this.instancedMeshComponent.getMatrixAt(index, target);
    }

    /**
     * Sets the color for a specific instance.
     * @param index The index of the instance.
     * @param color The RGB color.
     */
    setColorAt(index: number, color: ColorRGB): void {
        this.instancedMeshComponent.setColorAt(index, color);
    }

    /**
     * Updates the dirty flags to trigger a re-upload to the GPU.
     * Call this after modifying matrices or colors if manual control is needed (though setters handle it).
     */
    instanceMatrixNeedsUpdate(): void {
        this.instancedMeshComponent.matricesDirty = true;
    }

    instanceColorNeedsUpdate(): void {
        this.instancedMeshComponent.colorsDirty = true;
    }

    /**
     * Computes the bounding sphere of the instanced mesh (containing all instances).
     * This is an approximation.
     */
    computeBoundingSphere(): BoundingSphere {
        const geometry = this.getComponent<Geometry>(ComponentType.Geometry);
        if (!geometry) return new BoundingSphere();

        const baseRadius = getGeometryRadius(geometry.definition);

        // 1. Calculate Centroid
        const centroid: Vec3 = { x: 0, y: 0, z: 0 };
        const count = this.instancedMeshComponent.count;
        const rawData = this.instancedMeshComponent.instanceMatrix;

        for (let i = 0; i < count; i++) {
            const offset = i * 16;
            centroid.x += rawData[offset + 12];
            centroid.y += rawData[offset + 13];
            centroid.z += rawData[offset + 14];
        }

        if (count > 0) {
            centroid.x /= count;
            centroid.y /= count;
            centroid.z /= count;
        }

        // 2. Calculate Radius
        let maxRadius = 0;

        for (let i = 0; i < count; i++) {
            const offset = i * 16;
            const x = rawData[offset + 12];
            const y = rawData[offset + 13];
            const z = rawData[offset + 14];

            // Extract max scale from basis vectors (columns 0,1,2; 4,5,6; 8,9,10)
            const sx = Math.sqrt(rawData[offset] * rawData[offset] + rawData[offset + 1] * rawData[offset + 1] + rawData[offset + 2] * rawData[offset + 2]);
            const sy = Math.sqrt(rawData[offset + 4] * rawData[offset + 4] + rawData[offset + 5] * rawData[offset + 5] + rawData[offset + 6] * rawData[offset + 6]);
            const sz = Math.sqrt(rawData[offset + 8] * rawData[offset + 8] + rawData[offset + 9] * rawData[offset + 9] + rawData[offset + 10] * rawData[offset + 10]);

            const maxScale = Math.max(sx, sy, sz);
            const instanceRadius = baseRadius * maxScale;

            const dx = x - centroid.x;
            const dy = y - centroid.y;
            const dz = z - centroid.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            const total = dist + instanceRadius;
            if (total > maxRadius) {
                maxRadius = total;
            }
        }

        return new BoundingSphere(centroid, maxRadius);
    }
}

function getGeometryRadius(def: GeometryDef): number {
    switch (def.type) {
        case GeometryPrimitive.Box: {
            const d = def as BoxGeometryDef;
            return Math.sqrt(d.width * d.width + d.height * d.height + d.depth * d.depth) / 2;
        }
        case GeometryPrimitive.Sphere: {
            const d = def as SphereGeometryDef;
            return d.radius;
        }
        case GeometryPrimitive.Cylinder: {
            const d = def as CylinderGeometryDef;
            return Math.sqrt(Math.max(d.radiusTop ?? 1, d.radiusBottom ?? 1) ** 2 + (d.height / 2) ** 2);
        }
        case GeometryPrimitive.Cone: {
            const d = def as ConeGeometryDef;
            return Math.sqrt(d.radius * d.radius + (d.height / 2) * (d.height / 2));
        }
        case GeometryPrimitive.Plane: {
            const d = def as PlaneGeometryDef;
            return Math.sqrt(d.width * d.width + d.height * d.height) / 2;
        }
        case GeometryPrimitive.Torus: {
            return 1.0;
        }
        default:
            return 1.0; // Fallback
    }
}
