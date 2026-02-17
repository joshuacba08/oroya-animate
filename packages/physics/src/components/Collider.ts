import { Component, ComponentType } from '@joroya/core';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsWorld } from '../PhysicsWorld';
import { RigidBody } from './RigidBody';

export enum ColliderShape {
    Box = 'box',
    Sphere = 'sphere',
    Capsule = 'capsule',
    Cylinder = 'cylinder',
}

export interface ColliderDef {
    shape: ColliderShape;
    args: number[]; // e.g. [halfWidth, halfHeight, halfDepth] for Box
    friction?: number;
    restitution?: number;
    density?: number;
    isSensor?: boolean;
}

export class Collider extends Component {
    readonly type = ComponentType.Collider;
    public raw: RAPIER.Collider | null = null;
    private _def: ColliderDef;

    constructor(def: ColliderDef) {
        super();
        this._def = def;
    }

    public init(parentRigidBody: RigidBody): void {
        const world = PhysicsWorld.getInstance().raw;
        if (!world || !parentRigidBody.raw) {
            console.warn('PhysicsWorld or Parent RigidBody not initialized. Cannot create Collider.');
            return;
        }

        let desc: RAPIER.ColliderDesc;

        switch (this._def.shape) {
            case ColliderShape.Box:
                // args: [hx, hy, hz]
                desc = RAPIER.ColliderDesc.cuboid(this._def.args[0], this._def.args[1], this._def.args[2]);
                break;
            case ColliderShape.Sphere:
                // args: [radius]
                desc = RAPIER.ColliderDesc.ball(this._def.args[0]);
                break;
            case ColliderShape.Capsule:
                // args: [halfHeight, radius]
                desc = RAPIER.ColliderDesc.capsule(this._def.args[0], this._def.args[1]);
                break;
            case ColliderShape.Cylinder:
                // args: [halfHeight, radius]
                desc = RAPIER.ColliderDesc.cylinder(this._def.args[0], this._def.args[1]);
                break;
            default:
                desc = RAPIER.ColliderDesc.cuboid(1, 1, 1);
        }

        if (this._def.friction !== undefined) desc.setFriction(this._def.friction);
        if (this._def.restitution !== undefined) desc.setRestitution(this._def.restitution);
        if (this._def.density !== undefined) desc.setDensity(this._def.density);
        if (this._def.isSensor !== undefined) desc.setSensor(this._def.isSensor);

        this.raw = world.createCollider(desc, parentRigidBody.raw);
    }
}
