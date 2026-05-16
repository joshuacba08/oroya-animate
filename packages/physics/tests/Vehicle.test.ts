import { describe, expect, it } from 'vitest';
import {
    Scene,
    Node,
    RigidBody,
    RigidBodyType,
    Collider,
    ColliderShape,
} from '@joroya/core';
import { PhysicsSystem } from '../src/PhysicsSystem';
import { Vehicle } from '../src/Vehicle';

function buildVehicleScene() {
    const scene = new Scene();

    const ground = new Node('ground');
    ground.addComponent(new RigidBody({ type: RigidBodyType.Static }));
    ground.addComponent(new Collider({
        shape: ColliderShape.Box,
        halfExtents: { x: 20, y: 0.5, z: 20 },
    }));
    scene.add(ground);

    const chassis = new Node('chassis');
    chassis.transform.position = { x: 0, y: 2, z: 0 };
    chassis.transform.updateLocalMatrix();
    chassis.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 100 }));
    chassis.addComponent(new Collider({
        shape: ColliderShape.Box,
        halfExtents: { x: 1, y: 0.3, z: 2 },
    }));
    scene.add(chassis);
    scene.updateWorldMatrices();

    return { scene, chassis, ground };
}

function tickAll(physics: PhysicsSystem, vehicle: Vehicle, scene: Scene, dt: number, steps: number): void {
    for (let i = 0; i < steps; i++) {
        physics.update(dt, scene);
        vehicle.syncWheelNodes();
    }
}

describe('Vehicle', () => {
    it('constructs against an existing RigidBody node', () => {
        const physics = new PhysicsSystem();
        const { scene, chassis } = buildVehicleScene();
        // Materialize bodies before creating the vehicle.
        physics.update(1 / 60, scene);

        const vehicle = new Vehicle({ chassisNode: chassis, physics });
        expect(vehicle.raw).toBeDefined();
        expect(vehicle.raw.wheelInfos).toHaveLength(0);
    });

    it('throws if the chassis node has no RigidBody', () => {
        const physics = new PhysicsSystem();
        const scene = new Scene();
        const noBody = new Node('no-body');
        scene.add(noBody);
        expect(() => new Vehicle({ chassisNode: noBody, physics })).toThrow(/RigidBody/);
    });

    it('addWheel registers driving / steering / node maps independently', () => {
        const physics = new PhysicsSystem();
        const { scene, chassis } = buildVehicleScene();
        physics.update(1 / 60, scene);
        const vehicle = new Vehicle({ chassisNode: chassis, physics });

        const wheelFL = new Node('wheelFL');
        scene.add(wheelFL);
        const wheelRL = new Node('wheelRL');
        scene.add(wheelRL);

        vehicle.addWheel({
            chassisPosition: { x: 1, y: 0, z: 1.5 },
            radius: 0.4,
            isDriving: true,
            node: wheelFL,
        });
        vehicle.addWheel({
            chassisPosition: { x: 1, y: 0, z: -1.5 },
            radius: 0.4,
            isSteering: true,
            node: wheelRL,
        });

        expect(vehicle.raw.wheelInfos).toHaveLength(2);

        // Brake on all wheels (drive=0 + brake=10) and step. After a few steps
        // wheels should still report finite world transforms.
        vehicle.brake(10);
        tickAll(physics, vehicle, scene, 1 / 60, 10);
        for (const w of vehicle.raw.wheelInfos) {
            expect(Number.isFinite(w.worldTransform.position.x)).toBe(true);
            expect(Number.isFinite(w.worldTransform.position.y)).toBe(true);
            expect(Number.isFinite(w.worldTransform.position.z)).toBe(true);
        }
    });

    it('syncWheelNodes mirrors simulated wheel pose into Oroya node transforms', () => {
        const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });
        const { scene, chassis } = buildVehicleScene();
        physics.update(1 / 60, scene);
        const vehicle = new Vehicle({ chassisNode: chassis, physics });

        const wheelNode = new Node('wheel');
        wheelNode.transform.position = { x: 999, y: 999, z: 999 }; // arbitrary "stale" pose
        scene.add(wheelNode);

        vehicle.addWheel({
            chassisPosition: { x: 1, y: 0, z: 1.5 },
            radius: 0.4,
            node: wheelNode,
        });

        physics.update(1 / 60, scene);
        vehicle.syncWheelNodes();

        // Wheel node has been written back from the simulated pose, so it
        // is no longer at (999, 999, 999).
        const p = wheelNode.transform.position;
        expect(p.x).not.toBe(999);
        expect(p.y).not.toBe(999);
        expect(p.z).not.toBe(999);
    });

    it('dispose removes the vehicle from the world', () => {
        const physics = new PhysicsSystem();
        const { scene, chassis } = buildVehicleScene();
        physics.update(1 / 60, scene);
        const vehicle = new Vehicle({ chassisNode: chassis, physics });
        // No explicit constraint here, but `removeFromWorld` should not throw.
        expect(() => vehicle.dispose()).not.toThrow();
    });
});
