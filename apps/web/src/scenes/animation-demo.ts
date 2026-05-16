import {
    Animator,
    Camera,
    CameraType,
    createBox,
    createPlane,
    Light,
    LightType,
    Material,
    Node,
    Scene,
    type AnimationClip,
} from "@joroya/core";

/**
 * Demonstrates the v0.9.0 Animator API: declarative clip library, named
 * playback, crossfade, and keyframe events. Replaces the v0.4-era manual
 * `animate(time)` loop the demo previously used.
 *
 * Three clips are registered:
 *   • `idle`   — slow up/down hover.
 *   • `walk`   — horizontal slide back-and-forth + slight bobbing.
 *   • `spin`   — rotate around Y over 2s.
 *
 * The returned `controller` exposes `play(name)` and `crossFade(name, dur)`
 * for the UI to drive transitions.
 */
export function createAnimationScene() {
    const scene = new Scene();
    const root = scene.root;

    // ── Camera ─────────────────────────────────────────────
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 5, z: 10 };
    cameraNode.transform.lookAt({ x: 0, y: 1, z: 0 });
    cameraNode.addComponent(
        new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 16 / 9,
            near: 0.1,
            far: 100,
        }),
    );
    root.add(cameraNode);

    // ── Lights ─────────────────────────────────────────────
    const sun = new Node("sun");
    sun.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1.2,
        castShadow: true,
        shadowMapSize: 1024,
    }));
    sun.transform.position = { x: 5, y: 10, z: 5 };
    root.add(sun);

    const ambient = new Node("ambient");
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
    root.add(ambient);

    // ── Ground ─────────────────────────────────────────────
    const ground = new Node("ground");
    ground.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
    ground.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.25 } }));
    ground.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    root.add(ground);

    // ── Animated subject ───────────────────────────────────
    const box = new Node("hero");
    box.addComponent(createBox(1, 1, 1, { castShadow: true }));
    box.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));
    box.transform.position = { x: 0, y: 1, z: 0 };
    root.add(box);

    // ── Animator with three clips ──────────────────────────
    const idle: AnimationClip = {
        name: "idle",
        duration: 2.0,
        // Position track: 0 → 1.25 → 1 → 0.75 → 1 (smooth hover)
        tracks: [{
            targetNodeName: "hero",
            property: "position",
            times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
            values: new Float32Array([
                0, 1.0, 0,
                0, 1.25, 0,
                0, 1.0, 0,
                0, 0.75, 0,
                0, 1.0, 0,
            ]),
            interpolation: "linear",
        }],
    };

    const walk: AnimationClip = {
        name: "walk",
        duration: 2.0,
        tracks: [
            {
                targetNodeName: "hero",
                property: "position",
                times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
                values: new Float32Array([
                    -2, 1.0, 0,
                     0, 1.2, 0,
                     2, 1.0, 0,
                     0, 1.2, 0,
                    -2, 1.0, 0,
                ]),
                interpolation: "linear",
            },
        ],
        events: [
            { time: 0.5, name: "footstep", data: { foot: "right" } },
            { time: 1.5, name: "footstep", data: { foot: "left" } },
        ],
    };

    const spin: AnimationClip = {
        name: "spin",
        duration: 2.0,
        tracks: [{
            targetNodeName: "hero",
            property: "rotation",
            // Quaternion track around Y: identity → 90° → 180° → 270° → 360°
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
    box.addComponent(animator);
    animator.bindToScene(scene);

    // Footstep events surface through the controller so the UI can chain
    // audio playback or particle bursts off them.
    let lastFootstep: { foot: string } | null = null;
    animator.on("keyframe-event", (e) => {
        if (e.event.name === "footstep") {
            lastFootstep = e.event.data as { foot: string };
        }
    });

    // Auto-cycle clips so the gallery preview demonstrates all three.
    // Real apps would drive this from input events; the gallery has no UI
    // to expose the controller, so we cycle on a timer instead.
    let elapsed = 0;
    const cycleSeconds = 4;
    const order = ["idle", "walk", "spin"] as const;
    let currentIdx = 0;

    // The gallery's factory contract is `{ scene, animate(time) }`. `animate`
    // here just drives the clip-cycling timer — the Animator itself is
    // ticked automatically by `scene.update(dt)` which the renderer calls
    // each frame, so transforms update without any work in this callback.
    function animate(time: number) {
        const dt = elapsed === 0 ? 0 : time - elapsed;
        elapsed = time;
        if (Math.floor(time / cycleSeconds) !== currentIdx) {
            currentIdx = Math.floor(time / cycleSeconds) % order.length;
            animator.crossFade(order[currentIdx], 0.4);
        }
        // `dt` would be used here for any custom per-frame work; we just
        // touch it so eslint/tsc don't flag it as unused.
        void dt;
        void lastFootstep;
        void cameraNode;
    }

    return { scene, animate };
}
