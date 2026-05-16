import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createBox,
    createPlane,
    createSphere,
    Material,
    RigidBody,
    RigidBodyType,
    Collider,
    ColliderShape,
} from "@joroya/core";
import { PhysicsSystem } from "@joroya/physics";

/**
 * Trigger volumes demo — a falling ball passes through a sensor-collider
 * zone. The zone visualizes its occupancy by mutating the material color
 * of an overlay mesh whenever `trigger-enter` / `trigger-exit` fire on it.
 *
 * Demonstrates: `isTrigger: true` colliders, six-event physics channel,
 * v1.0 collision events on `node.events`.
 */
export function createTriggerVolumesScene() {
    const scene = new Scene();
    const root = scene.root;
    const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });

    // Camera
    const camera = new Node("camera");
    camera.transform.position = { x: 4, y: 5, z: 9 };
    camera.transform.lookAt({ x: 0, y: 1, z: 0 });
    camera.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 50,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
    }));
    root.add(camera);

    // Lights
    const sun = new Node("sun");
    sun.transform.position = { x: 5, y: 10, z: 5 };
    sun.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1.0,
        castShadow: true,
        shadowMapSize: 1024,
    }));
    root.add(sun);

    const ambient = new Node("ambient");
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
    root.add(ambient);

    // Floor — static solid body
    const floor = new Node("floor");
    floor.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
    floor.addComponent(new Material({ color: { r: 0.22, g: 0.24, b: 0.28 } }));
    floor.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
    floor.addComponent(new Collider({
        shape: ColliderShape.Box,
        halfExtents: { x: 10, y: 0.1, z: 10 },
    }));
    root.add(floor);

    // Trigger zone — a transparent box collider with `isTrigger: true`.
    // No contact response; events still fire when something overlaps.
    const triggerMaterial = new Material({
        color: { r: 0.2, g: 0.8, b: 0.4 },
        opacity: 0.25,
    });
    const triggerZone = new Node("trigger-zone");
    triggerZone.transform.position = { x: 0, y: 1.5, z: 0 };
    triggerZone.transform.updateLocalMatrix();
    triggerZone.addComponent(createBox(3, 1, 3));
    triggerZone.addComponent(triggerMaterial);
    triggerZone.addComponent(new RigidBody({ type: RigidBodyType.Static }));
    triggerZone.addComponent(new Collider({
        shape: ColliderShape.Box,
        halfExtents: { x: 1.5, y: 0.5, z: 1.5 },
        isTrigger: true,
    }));
    root.add(triggerZone);

    // Falling balls — three spheres dropped from different heights so the
    // trigger oscillates between empty and occupied as they pass through.
    const balls: Node[] = [];
    for (let i = 0; i < 3; i++) {
        const ball = new Node(`ball-${i}`);
        ball.transform.position = {
            x: (i - 1) * 0.8,
            y: 6 + i * 1.5,
            z: 0,
        };
        ball.transform.updateLocalMatrix();
        ball.addComponent(createSphere(0.4, 16, 16, { castShadow: true }));
        ball.addComponent(new Material({
            color: { r: 1, g: 0.5 + i * 0.15, b: 0.2 },
            roughness: 0.4,
        }));
        ball.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
        ball.addComponent(new Collider({
            shape: ColliderShape.Sphere,
            radius: 0.4,
            restitution: 0.6,
        }));
        root.add(ball);
        balls.push(ball);
    }

    // Track occupancy by counting trigger-enter / trigger-exit events.
    // The zone's material brightens when any ball is inside.
    let occupants = 0;
    triggerZone.events.on("trigger-enter", () => {
        occupants++;
        triggerMaterial.definition.color = { r: 1.0, g: 0.85, b: 0.2 };
        triggerMaterial.definition.opacity = 0.5;
    });
    triggerZone.events.on("trigger-exit", () => {
        occupants = Math.max(0, occupants - 1);
        if (occupants === 0) {
            triggerMaterial.definition.color = { r: 0.2, g: 0.8, b: 0.4 };
            triggerMaterial.definition.opacity = 0.25;
        }
    });

    // Respawn balls that fall past the floor so the loop runs forever.
    function respawnIfFallen() {
        for (const ball of balls) {
            if (ball.transform.position.y < -3) {
                // Reset via the physics body — the system writes back on next step.
                const body = physics.getBody(ball);
                if (body) {
                    body.position.set(
                        (Math.random() - 0.5) * 2,
                        6 + Math.random() * 2,
                        (Math.random() - 0.5) * 2,
                    );
                    body.velocity.set(0, 0, 0);
                    body.angularVelocity.set(0, 0, 0);
                }
            }
        }
    }

    let lastTime: number | null = null;
    function animate(time: number) {
        if (lastTime === null) lastTime = time;
        const dt = Math.min(time - lastTime, 0.1);
        lastTime = time;
        physics.update(dt, scene);
        respawnIfFallen();
    }

    return { scene, animate };
}
