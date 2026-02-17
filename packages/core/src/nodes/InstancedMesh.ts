import { Node } from './Node';
import { Geometry, GeometryDef } from '../components/Geometry';
import { Material, MaterialDef } from '../components/Material';
import { InstancedMeshComponent } from '../components/InstancedMeshComponent';
import { Matrix4 } from '../math/Matrix4';
import { ColorRGB } from '../components/Material';

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
}
