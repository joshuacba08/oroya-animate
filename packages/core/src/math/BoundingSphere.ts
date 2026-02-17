import { Vec3 } from '../components/Transform';
import * as Vector3 from './Vector3';
import { Matrix4 } from './Matrix4';

export class BoundingSphere {
    center: Vec3;
    radius: number;

    constructor(center: Vec3 = { x: 0, y: 0, z: 0 }, radius: number = 0) {
        this.center = center;
        this.radius = radius;
    }

    set(center: Vec3, radius: number): this {
        this.center = center;
        this.radius = radius;
        return this;
    }

    applyMatrix4(matrix: Matrix4): this {
        this.center = Vector3.applyMatrix4(this.center, matrix);
        const maxScaleOnAxis = Math.max(
            Math.abs(matrix[0]) + Math.abs(matrix[1]) + Math.abs(matrix[2]), // Scale on X (approximation/upper bound) or use exact decomposition?
            // Proper way is max(scaleX, scaleY, scaleZ). 
            // Simplified max scale extraction from matrix columns:
            Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]),
            Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]),
            Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10])
        );
        this.radius = this.radius * maxScaleOnAxis;
        return this;
    }
}
