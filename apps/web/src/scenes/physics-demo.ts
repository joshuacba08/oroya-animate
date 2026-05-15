import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createBox,
    createPlane,
    Material,
    Environment,
    RigidBody,
    RigidBodyType,
    Collider,
    ColliderShape,
    ComponentType,
} from "@joroya/core";
import { PhysicsSystem } from "@joroya/physics";

export function createPhysicsScene() {
    const scene = new Scene();
    const root = scene.root;
    const physics = new PhysicsSystem();

    // 1. Camera
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 5, z: 10 };
    cameraNode.transform.lookAt({ x: 0, y: 2, z: 0 });

    cameraNode.addComponent(
        new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 16 / 9,
            near: 0.1,
            far: 100,
        })
    );
    root.add(cameraNode);

    // 2. Lights
    const lightNode = new Node("light");
    lightNode.addComponent(
        new Light({
            type: LightType.Directional,
            color: { r: 1, g: 1, b: 1 },
            intensity: 1.0,
            castShadow: true,
        })
    );
    lightNode.transform.position = { x: 5, y: 10, z: 5 };
    lightNode.transform.lookAt({ x: 0, y: 0, z: 0 });
    root.add(lightNode);

    const ambientNode = new Node("ambient");
    ambientNode.addComponent(
        new Light({
            type: LightType.Ambient,
            color: { r: 0.2, g: 0.2, b: 0.2 },
            intensity: 0.5
        })
    );
    root.add(ambientNode);

    // 3. Environment
    const envNode = new Node("environment");
    envNode.addComponent(
        new Environment({
            background: { r: 0.8, g: 0.9, b: 1.0 }, // Sky blue
        })
    );
    root.add(envNode);

    // 4. Ground (Static RigidBody)
    const floor = new Node("floor");
    floor.addComponent(createPlane(20, 20));
    floor.addComponent(
        new Material({
            color: { r: 0.5, g: 0.5, b: 0.5 },
            roughness: 0.8,
        })
    );
    // Rotate plane to be flat
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };

    // Physics
    floor.addComponent(new RigidBody({
        type: RigidBodyType.Static,
        mass: 0
    }));
    floor.addComponent(new Collider({
        shape: ColliderShape.Plane
    }));

    root.add(floor);

    // 5. Falling Cubes (Dynamic RigidBody)
    const colors = [
        { r: 1, g: 0, b: 0 },
        { r: 0, g: 1, b: 0 },
        { r: 0, g: 0, b: 1 },
        { r: 1, g: 1, b: 0 },
        { r: 0, g: 1, b: 1 },
    ];

    for (let i = 0; i < 5; i++) {
        const cube = new Node(`cube-${i}`);
        cube.transform.position = {
            x: (Math.random() - 0.5) * 2,
            y: 5 + i * 1.5,
            z: (Math.random() - 0.5) * 2
        };

        // Random rotation
        const axis = { x: Math.random(), y: Math.random(), z: Math.random() };
        // Normalize axis
        const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
        axis.x /= len; axis.y /= len; axis.z /= len;
        cube.transform.rotateOnAxis(axis, Math.random() * Math.PI);

        cube.addComponent(createBox(1, 1, 1));
        cube.addComponent(
            new Material({
                color: colors[i % colors.length],
                roughness: 0.4,
            })
        );

        // Physics
        cube.addComponent(new RigidBody({
            type: RigidBodyType.Dynamic,
            mass: 1,
            restitution: 0.5 // Bouncy
        } as any)); // Restitution not in RigidBodyDef but ColliderDef? 
        // Oops, restitution is in ColliderDef in my implementation plan. 
        // RigidBodyDef has mass/type.

        cube.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            restitution: 0.5,
            friction: 0.4
        }));

        root.add(cube);
    }

    // Animation Loop
    let lastTime: number | null = null;

    function animate(time: number) {
        // physics.update uses dt in seconds
        // time comes in as seconds from ExampleCard

        // ExampleCard passes `time` in seconds (accumulated).
        // We need delta.
        // Wait, ExampleCard ALREADY calculates dt and calls scene.update(dt).
        // But here we export `animate` which ExampleCard ALSO calls with `t`.
        // We can manage our own dt inside animate if we want, or rely on scene.update.
        // But physics is strictly time-step dependent.

        // The `animate` function allows us to hook into the loop BEFORE render.
        // But ExampleCard calls: animate(t) -> scene.update(dt) -> render().
        // If we put physics update in `scene.update(dt)`, we'd need to attach PhysicsSystem to Scene.
        // Since PhysicsSystem is external for now, calls it here.

        // We need 'dt'. ExampleCard doesn't pass 'dt' to animate(), only 'time'.
        // So we calculate it.

        // HOWEVER, ExampleCard calculates dt and calls scene.update(dt) appropriately.
        // Maybe we should just use that if we could? 
        // But PhysicsSystem is NOT a component on the root node (yet).

        // Let's implement dt calculation here.
        if (lastTime === null) lastTime = time;
        const dt = time - lastTime;
        lastTime = time;

        // Avoid huge steps
        if (dt > 0.1) return;

        physics.update(dt, scene);
    }

    return { scene, animate, cameraNode };
}
