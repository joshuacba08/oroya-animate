import { Node, type Vec3 } from '@joroya/core';
import * as CANNON from 'cannon-es';
import type { PhysicsSystem } from './PhysicsSystem';

/**
 * Wheel definition for `Vehicle.addWheel`.
 *
 * Geometry and chassis-relative position live here. Optional `node` is the
 * Oroya `Node` representing the wheel's visual — when supplied, the
 * vehicle keeps its world transform in sync with the simulated wheel pose
 * each step.
 */
export interface WheelOptions {
    /** Chassis-local position of the wheel's hub. */
    chassisPosition: Vec3;
    /** Direction the suspension extends from the chassis. Default `{0,-1,0}` (down). */
    directionLocal?: Vec3;
    /** Axle direction (around which the wheel spins). Default `{-1,0,0}`. */
    axleLocal?: Vec3;
    /** Wheel rolling radius in metres. */
    radius: number;
    /** Suspension rest length. Default `0.3`. */
    suspensionRestLength?: number;
    /** Suspension spring constant. Default `30`. */
    suspensionStiffness?: number;
    /** Suspension max travel (cm). Default `5`. */
    maxSuspensionTravel?: number;
    /** Tire friction coefficient. Default `5`. */
    frictionSlip?: number;
    /** Whether this wheel transfers engine force. Used by `applyEngineForce`. */
    isDriving?: boolean;
    /** Whether this wheel takes steering input. Used by `setSteering`. */
    isSteering?: boolean;
    /** Optional scene-graph node to keep in sync with the simulated wheel pose. */
    node?: Node;
}

/**
 * High-level wrapper around `CANNON.RaycastVehicle`.
 *
 * Raycast vehicles model wheels as a single raycast each (vs. full rigid
 * bodies). They're cheap, stable, and the standard arcade-driving choice.
 * This wrapper:
 *   1. Owns the chassis body and ties it to an Oroya node.
 *   2. Tracks per-wheel "driving" / "steering" tags so app code can say
 *      `vehicle.drive(force)` once instead of looping over wheel indices.
 *   3. Syncs each wheel's world pose to its optional `node` every step.
 *
 * ```ts
 * const vehicle = new Vehicle({ chassisNode, chassisShape, physics });
 * vehicle.addWheel({ chassisPosition: { x:  1, y: 0, z:  1.5 }, radius: 0.4, isDriving: true, node: wheelFL });
 * vehicle.addWheel({ chassisPosition: { x: -1, y: 0, z:  1.5 }, radius: 0.4, isDriving: true, node: wheelFR });
 * vehicle.addWheel({ chassisPosition: { x:  1, y: 0, z: -1.5 }, radius: 0.4, isSteering: true, node: wheelRL });
 * vehicle.addWheel({ chassisPosition: { x: -1, y: 0, z: -1.5 }, radius: 0.4, isSteering: true, node: wheelRR });
 * vehicle.drive(500);
 * vehicle.steer(0.3);
 * ```
 *
 * @experimental — wheel-options shape mirrors cannon-es; the helper may
 *                 gain per-wheel friction overrides in a follow-up release.
 */
export class Vehicle {
    readonly raw: CANNON.RaycastVehicle;
    private readonly drivingWheels: number[] = [];
    private readonly steeringWheels: number[] = [];
    private readonly wheelNodes = new Map<number, Node>();
    private readonly physics: PhysicsSystem;

    constructor(options: {
        /** The chassis node (must already have a `RigidBody` + `Collider`). */
        chassisNode: Node;
        physics: PhysicsSystem;
        /** Forward axis index (0=x, 1=y, 2=z). Default `2` (z). */
        indexForwardAxis?: number;
        /** Right axis index. Default `0` (x). */
        indexRightAxis?: number;
        /** Up axis index. Default `1` (y). */
        indexUpAxis?: number;
    }) {
        this.physics = options.physics;

        // Eagerly materialize the chassis body so we can wire the vehicle
        // before the next physics step.
        const chassisBody = options.physics.getBody(options.chassisNode);
        if (!chassisBody) {
            throw new Error(`Vehicle: chassis node "${options.chassisNode.name}" needs a RigidBody component.`);
        }

        this.raw = new CANNON.RaycastVehicle({
            chassisBody,
            indexForwardAxis: options.indexForwardAxis ?? 2,
            indexRightAxis: options.indexRightAxis ?? 0,
            indexUpAxis: options.indexUpAxis ?? 1,
        });
        this.raw.addToWorld(options.physics.world);
    }

    /**
     * Add a wheel. Returns its index for direct cannon-es access if needed.
     */
    addWheel(opts: WheelOptions): number {
        const index = this.raw.addWheel({
            chassisConnectionPointLocal: new CANNON.Vec3(opts.chassisPosition.x, opts.chassisPosition.y, opts.chassisPosition.z),
            directionLocal: new CANNON.Vec3(
                opts.directionLocal?.x ?? 0,
                opts.directionLocal?.y ?? -1,
                opts.directionLocal?.z ?? 0,
            ),
            axleLocal: new CANNON.Vec3(
                opts.axleLocal?.x ?? -1,
                opts.axleLocal?.y ?? 0,
                opts.axleLocal?.z ?? 0,
            ),
            radius: opts.radius,
            suspensionRestLength: opts.suspensionRestLength ?? 0.3,
            suspensionStiffness: opts.suspensionStiffness ?? 30,
            maxSuspensionTravel: opts.maxSuspensionTravel ?? 5,
            frictionSlip: opts.frictionSlip ?? 5,
        });

        if (opts.isDriving) this.drivingWheels.push(index);
        if (opts.isSteering) this.steeringWheels.push(index);
        if (opts.node) this.wheelNodes.set(index, opts.node);
        return index;
    }

    /**
     * Apply engine torque to all "driving" wheels. Positive force drives
     * forward; negative reverses. Use ~500 for a passenger car, ~5000 for
     * a truck — magnitudes depend on chassis mass.
     */
    drive(force: number): void {
        for (const i of this.drivingWheels) {
            this.raw.applyEngineForce(force, i);
        }
    }

    /**
     * Set steering angle (radians) on all "steering" wheels. Positive
     * turns right (assuming default axis mapping).
     */
    steer(angle: number): void {
        for (const i of this.steeringWheels) {
            this.raw.setSteeringValue(angle, i);
        }
    }

    /**
     * Apply braking force to every wheel. `0` releases the brake.
     * Typical values: 1 for engine braking, 10+ for hard stop.
     */
    brake(force: number): void {
        for (let i = 0; i < this.raw.wheelInfos.length; i++) {
            this.raw.setBrake(force, i);
        }
    }

    /**
     * Sync each wheel's `node` transform from the simulated wheel pose.
     * Call this **after** `physics.update(dt, scene)` each frame so
     * `wheel.worldTransform` reflects the freshly-stepped simulation.
     */
    syncWheelNodes(): void {
        for (const [index, node] of this.wheelNodes) {
            this.raw.updateWheelTransform(index);
            const w = this.raw.wheelInfos[index];
            const t = w.worldTransform;
            node.transform.position = { x: t.position.x, y: t.position.y, z: t.position.z };
            node.transform.rotation = { x: t.quaternion.x, y: t.quaternion.y, z: t.quaternion.z, w: t.quaternion.w };
            node.transform.updateLocalMatrix();
        }
    }

    /** Detach from the world. Call before discarding the vehicle. */
    dispose(): void {
        this.raw.removeFromWorld(this.physics.world);
    }
}
