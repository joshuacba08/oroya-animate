import { Scene, Node, Geometry, GeometryPrimitive, Material, Light, LightType, type ColorRGB, ComponentType } from '@joroya/core';
import { PhysicsSystem, RigidBody, RigidBodyType, Collider, ColliderShape } from '@joroya/physics';

export function createPhysicsScene(): { scene: Scene, animate: (time: number) => void } {
    const scene = new Scene();

    // Physics System
    const physicsSystem = new PhysicsSystem(scene);
    // Initialize asynchronously (floating promise)
    physicsSystem.init().catch(err => console.error("Physics init failed", err));

    let lastTime = 0;
    function animate(time: number) {
        const dt = time - lastTime;
        lastTime = time;
        // Cap dt to avoid spirals of death, e.g. 0.1s
        physicsSystem.update(Math.min(dt, 0.1));
    }

    // --- Lights ---
    const ambientLightNode = new Node("Ambient Light");
    ambientLightNode.addComponent(new Light({
        type: LightType.Ambient,
        intensity: 0.5,
        color: { r: 1, g: 1, b: 1 }
    }));
    scene.add(ambientLightNode);

    const dirLightNode = new Node("Directional Light");
    dirLightNode.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1,
        color: { r: 1, g: 1, b: 0.9 },
        target: { x: 0, y: 0, z: 0 }
    }));
    dirLightNode.transform.position = { x: 5, y: 10, z: 5 };
    scene.add(dirLightNode);

    // --- Floor (Static) ---
    const floor = new Node("Floor");
    floor.addComponent(new Geometry({
        type: GeometryPrimitive.Box,
        width: 20,
        height: 1,
        depth: 20
    }));
    floor.addComponent(new Material({
        color: { r: 0.5, g: 0.5, b: 0.5 },
        metalness: 0.2,
        roughness: 0.8
    }));
    // Physics
    const floorBody = new RigidBody({ type: RigidBodyType.Static });
    floor.addComponent(floorBody);
    const floorCollider = new Collider({ shape: ColliderShape.Box, args: [10, 0.5, 10] }); // Half-extents!
    floor.addComponent(floorCollider);

    floor.transform.position = { x: 0, y: -2, z: 0 };
    scene.add(floor);

    // --- Dynamic Cubes ---
    const colors: ColorRGB[] = [
        { r: 1, g: 0, b: 0 },
        { r: 0, g: 1, b: 0 },
        { r: 0, g: 0, b: 1 },
        { r: 1, g: 1, b: 0 },
        { r: 0, g: 1, b: 1 },
    ];

    for (let i = 0; i < 10; i++) {
        const cube = new Node(`Cube ${i}`);
        cube.addComponent(new Geometry({
            type: GeometryPrimitive.Box,
            width: 1,
            height: 1,
            depth: 1
        }));
        cube.addComponent(new Material({
            color: colors[i % colors.length],
            metalness: 0.5,
            roughness: 0.2
        }));

        // Physics
        const body = new RigidBody({
            type: RigidBodyType.Dynamic,
            mass: 1,
            restitution: 0.5
        });
        cube.addComponent(body);
        const collider = new Collider({ shape: ColliderShape.Box, args: [0.5, 0.5, 0.5] });
        cube.addComponent(collider);

        cube.transform.position = { x: (Math.random() - 0.5) * 2, y: 5 + i * 2, z: (Math.random() - 0.5) * 2 };
        cube.transform.rotation = { x: Math.random(), y: Math.random(), z: Math.random(), w: 1 };

        scene.add(cube);
    }

    return { scene, animate };
}
