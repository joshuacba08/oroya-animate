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
    Animator,
    type AnimationClip,
} from "@joroya/core";

/**
 * Three-clip cross-fade demo. A hero cube cycles between `idle`, `walk`
 * and `spin` every few seconds using `Animator.crossFade`. Demonstrates
 * v0.9+ Animator: declarative clip library, named playback, smooth
 * transitions, and keyframe events.
 *
 * Unlike the legacy "manual animate()" pattern, ALL transform updates
 * here flow through `scene.update(dt)` → `Animator.onUpdate(dt)` →
 * `AnimationMixer`. The `animate()` callback only drives the
 * clip-cycling timer.
 */
export function createAnimatorCrossfadeScene() {
    const scene = new Scene();
    const root = scene.root;

    // Camera
    const camera = new Node("camera");
    camera.transform.position = { x: 0, y: 4, z: 8 };
    camera.transform.lookAt({ x: 0, y: 1, z: 0 });
    camera.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 55,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
    }));
    root.add(camera);

    // Lights
    const sun = new Node("sun");
    sun.transform.position = { x: 5, y: 8, z: 5 };
    sun.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1.1,
        castShadow: true,
        shadowMapSize: 1024,
    }));
    root.add(sun);

    const ambient = new Node("ambient");
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.45 }));
    root.add(ambient);

    // Ground
    const ground = new Node("ground");
    ground.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
    ground.addComponent(new Material({ color: { r: 0.18, g: 0.2, b: 0.24 } }));
    ground.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    root.add(ground);

    // Hero — the cube every clip animates.
    const hero = new Node("hero");
    hero.addComponent(createBox(1, 1, 1, { castShadow: true }));
    hero.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 }, roughness: 0.4 }));
    hero.transform.position = { x: 0, y: 1, z: 0 };
    root.add(hero);

    // Three clips — keyframe data is a small Float32Array each. The
    // mixer interpolates linearly between samples; quaternion blending in
    // `crossFade` uses nlerp + hemisphere correction.

    const idle: AnimationClip = {
        name: "idle",
        duration: 2.0,
        tracks: [{
            targetNodeName: "hero",
            property: "position",
            times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
            values: new Float32Array([
                0, 1.00, 0,
                0, 1.15, 0,
                0, 1.00, 0,
                0, 0.85, 0,
                0, 1.00, 0,
            ]),
            interpolation: "linear",
        }],
    };

    const walk: AnimationClip = {
        name: "walk",
        duration: 2.4,
        tracks: [{
            targetNodeName: "hero",
            property: "position",
            times: new Float32Array([0, 0.6, 1.2, 1.8, 2.4]),
            values: new Float32Array([
                -2, 1.0, 0,
                 0, 1.2, 0,
                 2, 1.0, 0,
                 0, 1.2, 0,
                -2, 1.0, 0,
            ]),
            interpolation: "linear",
        }],
        events: [
            { time: 0.6, name: "footstep", data: { foot: "right" } },
            { time: 1.8, name: "footstep", data: { foot: "left" } },
        ],
    };

    const spin: AnimationClip = {
        name: "spin",
        duration: 2.0,
        tracks: [{
            targetNodeName: "hero",
            property: "rotation",
            // Quaternion track: identity → 90° → 180° → 270° → identity
            times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
            values: new Float32Array([
                0, 0, 0, 1,
                0, Math.SQRT1_2, 0, Math.SQRT1_2,
                0, 1, 0, 0,
                0, Math.SQRT1_2, 0, -Math.SQRT1_2,
                0, 0, 0, 1,
            ]),
            interpolation: "linear",
        }],
    };

    const animator = new Animator({
        animations: { idle, walk, spin },
        autoplay: "idle",
    });
    hero.addComponent(animator);
    animator.bindToScene(scene);

    // Cycle clips every 4 seconds so the preview shows all three. Real
    // apps would drive transitions from input events.
    const order = ["idle", "walk", "spin"] as const;
    let currentIdx = 0;
    const cycleSeconds = 4;

    function animate(time: number) {
        const idx = Math.floor(time / cycleSeconds) % order.length;
        if (idx !== currentIdx) {
            currentIdx = idx;
            animator.crossFade(order[currentIdx], 0.4);
        }
    }

    return { scene, animate };
}
