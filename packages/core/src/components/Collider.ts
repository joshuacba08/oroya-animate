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
    /** Box half-extents. */
    halfExtents?: Vec3;
    /** Sphere radius (also used as base radius for Cylinder). */
    radius?: number;
    /** Cylinder height. */
    height?: number;

    /** Offset from node origin (in local space). */
    center?: Vec3;

    /** Material friction coefficient. */
    friction?: number;
    /** Material restitution (bounciness). */
    restitution?: number;

    /**
     * Sensor / trigger collider — generates collision events without producing
     * a contact response. Use for trigger volumes (checkpoints, damage zones,
     * proximity sensors).
     */
    isTrigger?: boolean;

    /**
     * Collision filter group (bitmask, 1 << N). Only collides with bodies
     * whose `collisionMask` includes this group. Default `1` = "default".
     */
    collisionGroup?: number;

    /**
     * Collision filter mask (bitmask). The body collides only with groups
     * that intersect this mask. Default `-1` = "everything".
     */
    collisionMask?: number;
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
            isTrigger: false,
            collisionGroup: 1,
            collisionMask: -1,
            ...definition,
        };
    }
}
