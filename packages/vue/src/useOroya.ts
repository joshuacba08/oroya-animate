import { inject, onBeforeUnmount, provide, shallowRef, watch, type InjectionKey, type Ref } from 'vue';
import {
    Camera,
    CameraType,
    Node as OroyaNode,
    Scene,
    type Vec3,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

/**
 * Per-frame callback. Receives `dt` in seconds — same convention as the
 * core renderer.
 */
export type FrameCallback = (dt: number) => void;

export interface OroyaContext {
    scene: Scene;
    parentNode: OroyaNode;
    registerFrameCallback: (cb: FrameCallback) => () => void;
}

const OROYA_KEY: InjectionKey<OroyaContext> = Symbol('oroya');

/**
 * Mount an Oroya scene + ThreeRenderer onto a `<canvas>` `ref`. Returns
 * the scene and a `start()` function that begins the animation loop.
 *
 * Designed for use in a Vue 3 `<script setup>` root component:
 *
 * ```vue
 * <script setup lang="ts">
 * import { ref, onMounted } from 'vue';
 * import { useOroyaCanvas, useNode, useFrame } from '@joroya/vue';
 * import { createBox, Material } from '@joroya/core';
 *
 * const canvasRef = ref<HTMLCanvasElement>();
 * const { scene } = useOroyaCanvas(canvasRef);
 *
 * useNode((node) => {
 *   node.addComponent(createBox(1, 1, 1));
 *   node.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
 * });
 *
 * useFrame((dt) => { /* per-frame logic *\/ });
 * </script>
 *
 * <template>
 *   <canvas ref="canvasRef" style="width: 100%; height: 100%" />
 * </template>
 * ```
 */
/** @experimental — alpha Vue 3 composable; signature may evolve. */
export function useOroyaCanvas(
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    options: {
        dpr?: number;
        /** Default camera at (0, 0, 5). Default true. */
        autoCamera?: boolean;
        cameraPosition?: Vec3;
    } = {},
): { scene: Scene } {
    const scene = new Scene();
    const frameCallbacks = new Set<FrameCallback>();

    provide(OROYA_KEY, {
        scene,
        parentNode: scene.root,
        registerFrameCallback: (cb) => {
            frameCallbacks.add(cb);
            return () => frameCallbacks.delete(cb);
        },
    });

    // Wait for the canvas ref to populate (Vue mounts asynchronously) before
    // creating the renderer. Re-runs if the user swaps the canvas element.
    // The watch's `onCleanup` handles disposal automatically.
    watch(canvasRef, (canvas, _old, onCleanup) => {
        if (!canvas) return;

        if (options.autoCamera !== false) {
            const camNode = new OroyaNode('__oroya_default_camera');
            const cp = options.cameraPosition ?? { x: 0, y: 0, z: 5 };
            camNode.transform.position = cp;
            camNode.addComponent(new Camera({
                type: CameraType.Perspective,
                fov: 60,
                aspect: 1,
                near: 0.1,
                far: 1000,
            }));
            scene.add(camNode);
        }

        const renderer = new ThreeRenderer({
            canvas,
            width: canvas.clientWidth || 1,
            height: canvas.clientHeight || 1,
            dpr: options.dpr,
        });
        renderer.mount(scene);

        const ro = new ResizeObserver(() => {
            renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1);
        });
        ro.observe(canvas);

        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            for (const cb of frameCallbacks) cb(dt);
            renderer.render(dt);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        onCleanup(() => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose?.();
        });
    }, { immediate: true });

    return { scene };
}

/**
 * Access the context inside a child composable. Throws if no
 * `useOroyaCanvas` ancestor is mounted.
 *
 * @experimental
 */
export function useOroya(): OroyaContext {
    const ctx = inject(OROYA_KEY);
    if (!ctx) {
        throw new Error('@joroya/vue composables must be used inside a component that called useOroyaCanvas().');
    }
    return ctx;
}

/**
 * Register a per-frame callback. Auto-deregistered on component unmount.
 *
 * @experimental
 */
export function useFrame(cb: FrameCallback): void {
    const { registerFrameCallback } = useOroya();
    const dispose = registerFrameCallback(cb);
    onBeforeUnmount(dispose);
}

/**
 * Create an Oroya `Node`, attach it under the current JSX-equivalent
 * parent, and run `setup` once with the node. Returns a ref to the
 * underlying node so template / script code can mutate transforms.
 *
 * @experimental
 */
export function useNode(setup: (node: OroyaNode) => void): Ref<OroyaNode> {
    const { parentNode } = useOroya();
    const node = new OroyaNode('vue-node');
    setup(node);
    parentNode.add(node);
    onBeforeUnmount(() => parentNode.remove(node));
    // `shallowRef` (not `ref`) — we don't want Vue's reactivity proxy to
    // recurse into the scene graph. Mutations on `node.transform.*` are
    // visible to the renderer directly; reactivity is only needed for the
    // ref identity itself.
    return shallowRef(node);
}
