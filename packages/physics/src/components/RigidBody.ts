import { Component, ComponentType, Vec3, Quat } from '@joroya/core';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsWorld } from '../PhysicsWorld';

export enum RigidBodyType {
    Dynamic = 'dynamic',
    Static = 'static',
    KinematicPositionBased = 'kinematicPosition',
    KinematicVelocityBased = 'kinematicVelocity',
}

export interface RigidBodyDef {
    type: RigidBodyType;
    mass?: number;
    linearDamping?: number;
    angularDamping?: number;
    canSleep?: boolean;
    ccdEnabled?: boolean;
}

export class RigidBody extends Component {
    readonly type = ComponentType.RigidBody;
    public raw: RAPIER.RigidBody | null = null;

    private _def: RigidBodyDef;

    constructor(def: RigidBodyDef) {
        super();
        this._def = def;
    }

    /**
     * Initializes the Rapier RigidBody. 
     * This should be called by the PhysicsSystem when the component is added to the scene.
     */
    public init(position: Vec3, rotation: Quat): void {
        const world = PhysicsWorld.getInstance().raw;
        if (!world) {
            console.warn('PhysicsWorld not initialized. Cannot create RigidBody.');
            return;
        }

        let desc: RAPIER.RigidBodyDesc;

        switch (this._def.type) {
            case RigidBodyType.Dynamic:
                desc = RAPIER.RigidBodyDesc.dynamic();
                break;
            case RigidBodyType.Static:
                desc = RAPIER.RigidBodyDesc.fixed();
                break;
            case RigidBodyType.KinematicPositionBased:
                desc = RAPIER.RigidBodyDesc.kinematicPositionBased();
                break;
            case RigidBodyType.KinematicVelocityBased:
                desc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
                break;
            default:
                desc = RAPIER.RigidBodyDesc.dynamic();
        }

        desc.setTranslation(position.x, position.y, position.z)
            .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });

        if (this._def.linearDamping !== undefined) desc.setLinearDamping(this._def.linearDamping);
        if (this._def.angularDamping !== undefined) desc.setAngularDamping(this._def.angularDamping);
        if (this._def.canSleep !== undefined) desc.setCanSleep(this._def.canSleep);
        if (this._def.ccdEnabled !== undefined) desc.setCcdEnabled(this._def.ccdEnabled);

        this.raw = world.createRigidBody(desc);

        if (this._def.mass !== undefined && this.raw) {
            this.raw.setAdditionalMass(this._def.mass, true);
        }
    }

    public applyImpulse(impulse: Vec3): void {
        if (this.raw) {
            this.raw.applyImpulse(new RAPIER.Vector3(impulse.x, impulse.y, impulse.z), true);
        }
    }

    public lockRotations(locked: boolean, wake = true): void {
        if (this.raw) this.raw.lockRotations(locked, wake);
    }
}
