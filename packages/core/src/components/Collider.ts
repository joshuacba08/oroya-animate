import { Component, ComponentType } from './Component';
import { Vec3 } from './Transform';

export enum ColliderShape {
    Box = 'Box',
    Sphere = 'Sphere',
    Plane = 'Plane',
    Cylinder = 'Cylinder'
}

export interface ColliderDef {
    shape: ColliderShape;
    // Box
    halfExtents?: Vec3;
    // Sphere
    radius?: number;
    // Cylinder - simplified, cannon-es uses radiusTop, radiusBottom, height, numSegments
    height?: number;

    // Offset from node center
    center?: Vec3;

    // Material properties
    friction?: number;
    restitution?: number;
}

export class Collider extends Component {
    readonly type = ComponentType.Collider;

    definition: Required<ColliderDef>;

    constructor(definition: ColliderDef) {
        super();
        this.definition = {
            halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            radius: 0.5,
            height: 1,
            center: { x: 0, y: 0, z: 0 },
            friction: 0.3,
            restitution: 0.3,
            ...definition,
        };
    }
}
