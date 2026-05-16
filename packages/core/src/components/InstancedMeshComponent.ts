import { Component, ComponentType } from './Component';
import { Matrix4, Matrix4Identity } from '../math/Matrix4';
import { ColorRGB } from './Material';

/**
 * A component that defines instanced rendering data for a node.
 * It holds the transformation matrices and optional colors for multiple instances of the same geometry.
 */
export class InstancedMeshComponent extends Component {
    readonly type = ComponentType.InstancedMesh;

    /**
     * The number of instances.
     */
    count: number;

    /**
     * The maximum number of instances this component can hold.
     */
    readonly capacity: number;

    /**
     * The instance transformation matrices.
     * Stored as a flat Float32Array (16 floats per instance).
     */
    instanceMatrix: Float32Array;

    /**
     * The instance colors.
     * Stored as a flat Float32Array (3 floats per instance: R, G, B).
     * Null if no instance colors are used.
     */
    instanceColor: Float32Array | null;

    /**
     * Flag indicating if the matrices need to be updated on the GPU.
     */
    matricesDirty: boolean = true;

    /**
     * Flag indicating if the colors need to be updated on the GPU.
     */
    colorsDirty: boolean = true;

    constructor(count: number, useColors: boolean = false) {
        super();
        this.capacity = count;
        this.count = count;
        this.instanceMatrix = new Float32Array(count * 16);
        this.instanceColor = useColors ? new Float32Array(count * 3) : null;

        // Initialize matrices to identity
        for (let i = 0; i < count; i++) {
            this.setMatrixAt(i, Matrix4Identity as unknown as Matrix4);
        }
    }

    /**
     * Sets the local transformation matrix for a specific instance.
     * @param index The index of the instance.
     * @param matrix The 4x4 matrix.
     */
    setMatrixAt(index: number, matrix: Matrix4): void {
        if (index < 0 || index >= this.capacity) return; // Silent fail or throw?
        this.instanceMatrix.set(matrix, index * 16);
        this.matricesDirty = true;
    }

    /**
     * Gets the local transformation matrix for a specific instance.
     * @param index The index of the instance.
     * @param target Optional target matrix to copy into.
     * @returns The matrix (new or target).
     */
    getMatrixAt(index: number, target?: Matrix4): Matrix4 {
        const offset = index * 16;
        // `Matrix4` is a fixed-length 16-tuple. `Array(16)` produces an array
        // of the right length; the cast through `unknown` tells TypeScript to
        // trust the runtime guarantee (no tuple-from-length inference).
        const out = target || (new Array(16) as unknown as Matrix4);
        for (let i = 0; i < 16; i++) {
            out[i] = this.instanceMatrix[offset + i];
        }
        return out;
    }

    /**
     * Sets the color for a specific instance.
     * @param index The index of the instance.
     * @param color The RGB color.
     */
    setColorAt(index: number, color: ColorRGB): void {
        if (!this.instanceColor || index < 0 || index >= this.capacity) return;
        const offset = index * 3;
        this.instanceColor[offset] = color.r;
        this.instanceColor[offset + 1] = color.g;
        this.instanceColor[offset + 2] = color.b;
        this.colorsDirty = true;
    }
}
