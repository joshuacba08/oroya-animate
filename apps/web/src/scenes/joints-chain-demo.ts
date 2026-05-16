import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createBox,
    createSphere,
    createPlane,
    Material,
    RigidBody,
    RigidBodyType,
    Collider,
    ColliderShape,
} from "@joroya/core";
import { PhysicsSystem } from "@joroya/physics";

/**
 * A swinging chain built from point-to-point constraints. Five spheres
 * hang from a static anchor; the leftmost sphere is displaced and
 * released so it swings into the rest — a Newton's cradle, except the
 * solver is naive (single-iteration impulse) so the energy dissipates
 * over time, which makes for a satisfying visual.
 *
 * Demonstrates: `addPointToPointConstraint`, eager body materialization
 * via `physics.getBody`, multiple constraints on the same world.
 */
export function createJointsChainScene() {
    const scene = new Scene();
    const root = scene.root;
    const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });

    // Camera — angled to show the swing arc.
    const camera = new Node("camera");
    camera.transform.position = { x: 2, y: 4, z: 12 };
    camera.transform.lookAt({ x: 0, y: 2, z: 0 });
    camera.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 45,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
    }));
    root.add(camera);

    // Lights
    const sun = new Node("sun");
    sun.transform.position = { x: 4, y: 10, z: 6 };
    sun.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1.0,
        castShadow: true,
        shadowMapSize: 1024,
    }));
    root.add(sun);

    const ambient = new Node("ambient");
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.45 }));
    root.add(ambient);

    // Ground — visual only, no body. The chain doesn't reach the floor.
    const ground = new Node("ground");
    ground.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
    ground.addComponent(new Material({ color: { r: 0.18, g: 0.2, b: 0.24 } }));
    ground.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    ground.transform.position = { x: 0, y: -2, z: 0 };
    root.add(ground);

    // Static anchor bar — a thin slab the chain hangs from.
    const anchorBar = new Node("anchor-bar");
    anchorBar.transform.position = { x: 0, y: 5, z: 0 };
    anchorBar.transform.updateLocalMatrix();
    anchorBar.addComponent(createBox(6, 0.2, 0.2, { castShadow: true }));
    anchorBar.addComponent(new Material({ color: { r: 0.5, g: 0.5, b: 0.55 } }));
    anchorBar.addComponent(new RigidBody({ type: RigidBodyType.Static }));
    anchorBar.addComponent(new Collider({
        shape: ColliderShape.Box,
        halfExtents: { x: 3, y: 0.1, z: 0.1 },
    }));
    root.add(anchorBar);

    // Build five hanging spheres, each constrained to the bar above it.
    // Displace the first sphere so the chain has stored energy.
    const linkCount = 5;
    const spacing = 0.8;
    const linkRadius = 0.3;
    const anchorY = 5;
    const ropeLength = 2.5;

    const balls: Node[] = [];

    for (let i = 0; i < linkCount; i++) {
        const x = (i - (linkCount - 1) / 2) * spacing;
        const xOffset = i === 0 ? -2.5 : 0; // First ball is pulled left

        const ball = new Node(`link-${i}`);
        ball.transform.position = {
            x: x + xOffset,
            y: anchorY - ropeLength,
            z: 0,
        };
        ball.transform.updateLocalMatrix();
        ball.addComponent(createSphere(linkRadius, 24, 24, { castShadow: true }));
        ball.addComponent(new Material({
            color: { r: 0.85, g: 0.7, b: 0.3 },
            metalness: 0.7,
            roughness: 0.25,
        }));
        ball.addComponent(new RigidBody({
            type: RigidBodyType.Dynamic,
            mass: 1,
            linearDamping: 0.02,    // very slight drag so the cradle eventually rests
            angularDamping: 0.05,
        }));
        ball.addComponent(new Collider({
            shape: ColliderShape.Sphere,
            radius: linkRadius,
            restitution: 0.95,       // nearly elastic — cradle-like collisions
            friction: 0.1,
        }));
        root.add(ball);
        balls.push(ball);
    }

    // Materialize every body before linking — physics.getBody() does this
    // eagerly so the constraints can find their bodies in cannon's world.
    for (const ball of balls) physics.getBody(ball);
    physics.getBody(anchorBar);

    // Attach each ball to a point on the anchor bar via a point-to-point
    // constraint. The bar pivot sits at the ball's resting x position.
    for (let i = 0; i < balls.length; i++) {
        const x = (i - (linkCount - 1) / 2) * spacing;
        physics.addPointToPointConstraint(anchorBar, balls[i], {
            pivotA: { x, y: 0, z: 0 },
            pivotB: { x: 0, y: ropeLength, z: 0 },
        });
    }

    let lastTime: number | null = null;
    function animate(time: number) {
        if (lastTime === null) lastTime = time;
        const dt = Math.min(time - lastTime, 0.1);
        lastTime = time;
        physics.update(dt, scene);
    }

    return { scene, animate };
}
