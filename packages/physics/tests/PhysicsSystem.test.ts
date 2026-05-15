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

function tick(sys: PhysicsSystem, scene: Scene, dt: number, steps: number) {
    for (let i = 0; i < steps; i++) sys.update(dt, scene);
}

describe('PhysicsSystem — step + sync', () => {
    it('applies gravity to a dynamic body', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();
        const cube = new Node('cube');
        cube.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        cube.addComponent(new Collider({ shape: ColliderShape.Box }));
        scene.add(cube);

        const initialY = cube.transform.position.y;
        tick(sys, scene, 1 / 60, 60); // 1 second
        // Free fall under -9.82 m/s² for ~1s → y should drop noticeably
        expect(cube.transform.position.y).toBeLessThan(initialY - 1);
    });

    it('does not move static bodies', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();
        const floor = new Node('floor');
        floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        floor.addComponent(new Collider({ shape: ColliderShape.Box }));
        scene.add(floor);

        tick(sys, scene, 1 / 60, 30);
        expect(floor.transform.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('stacks a dynamic body on top of a static floor without falling through', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();

        const floor = new Node('floor');
        floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        floor.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 5, y: 0.5, z: 5 },
        }));
        scene.add(floor);

        const box = new Node('box');
        box.transform.position = { x: 0, y: 2, z: 0 };
        box.transform.updateLocalMatrix();
        box.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        box.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
        }));
        scene.add(box);

        // World matrices must reflect the initial position before first sync
        scene.updateWorldMatrices();
        tick(sys, scene, 1 / 60, 120); // 2 seconds

        // The box should have settled on top of the floor (y ≈ 0.5 + 0.5 = 1)
        expect(box.transform.position.y).toBeGreaterThan(0.5);
        expect(box.transform.position.y).toBeLessThan(2);
    });

    it('gravity setter updates the world gravity vector', () => {
        const sys = new PhysicsSystem();
        expect(sys.gravity).toEqual({ x: 0, y: -9.82, z: 0 });
        sys.gravity = { x: 0, y: 0, z: 0 };
        expect(sys.gravity).toEqual({ x: 0, y: 0, z: 0 });
    });
});

describe('PhysicsSystem — collision events', () => {
    it('emits collide-begin on the node when two bodies touch', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();

        const a = new Node('a');
        a.transform.position = { x: 0, y: 1, z: 0 };
        a.transform.updateLocalMatrix();
        a.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        a.addComponent(new Collider({ shape: ColliderShape.Box }));
        scene.add(a);

        const b = new Node('b');
        b.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        b.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 5, y: 0.5, z: 5 },
        }));
        scene.add(b);
        scene.updateWorldMatrices();

        let beganOnA = false;
        let collidedNode: string | null = null;
        a.events.on('collide-begin', (e) => {
            beganOnA = true;
            collidedNode = e.other.name;
        });

        tick(sys, scene, 1 / 60, 120);
        expect(beganOnA).toBe(true);
        expect(collidedNode).toBe('b');
    });

    it('emits trigger-enter for sensor colliders without contact response', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();

        const trigger = new Node('trigger');
        trigger.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        trigger.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 5, y: 5, z: 5 },
            isTrigger: true,
        }));
        scene.add(trigger);

        const ball = new Node('ball');
        ball.transform.position = { x: 0, y: 2, z: 0 };
        ball.transform.updateLocalMatrix();
        ball.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        ball.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 0.5 }));
        scene.add(ball);
        scene.updateWorldMatrices();

        let triggered = false;
        trigger.events.on('trigger-enter', () => { triggered = true; });

        // Sensor should be hit on the first overlapping step (ball already inside).
        tick(sys, scene, 1 / 60, 5);
        expect(triggered).toBe(true);

        // Sensors do not block motion — ball must keep falling.
        const yBefore = ball.transform.position.y;
        tick(sys, scene, 1 / 60, 30);
        expect(ball.transform.position.y).toBeLessThan(yBefore);
    });
});

describe('PhysicsSystem — joints', () => {
    it('addPointToPointConstraint links two bodies at a pivot', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();

        const anchor = new Node('anchor');
        anchor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        anchor.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 0.1 }));
        scene.add(anchor);

        const pendulum = new Node('pendulum');
        pendulum.transform.position = { x: 1, y: 0, z: 0 };
        pendulum.transform.updateLocalMatrix();
        pendulum.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        pendulum.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 0.1 }));
        scene.add(pendulum);
        scene.updateWorldMatrices();

        // First tick instantiates bodies — required before constraint can link them.
        sys.update(1 / 60, scene);
        const constraint = sys.addPointToPointConstraint(anchor, pendulum, {
            pivotA: { x: 0, y: 0, z: 0 },
            pivotB: { x: -1, y: 0, z: 0 },
        });
        expect(constraint).not.toBeNull();

        tick(sys, scene, 1 / 60, 120);
        // Pendulum stays bounded (constraint prevents free fall to infinity).
        expect(pendulum.transform.position.y).toBeGreaterThan(-5);
    });
});

describe('PhysicsSystem — raycast', () => {
    it('returns the closest body hit', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();

        const ball = new Node('ball');
        ball.transform.position = { x: 0, y: 5, z: 0 };
        ball.transform.updateLocalMatrix();
        ball.addComponent(new RigidBody({ type: RigidBodyType.Static }));
        ball.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 1 }));
        scene.add(ball);
        scene.updateWorldMatrices();
        sys.update(1 / 60, scene);

        const hit = sys.raycast({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 });
        expect(hit).not.toBeNull();
        expect(hit!.node.name).toBe('ball');
        expect(hit!.distance).toBeCloseTo(4, 0); // ball center y=5, radius 1 → hit at y=4
    });

    it('returns null when nothing is in the ray path', () => {
        const sys = new PhysicsSystem();
        const scene = new Scene();
        sys.update(1 / 60, scene);
        const hit = sys.raycast({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 });
        expect(hit).toBeNull();
    });
});
