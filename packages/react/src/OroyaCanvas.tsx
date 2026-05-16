import { useEffect, useMemo, useRef, type ReactNode, type CSSProperties } from 'react';
import { Scene, Camera, CameraType, Node as OroyaNode } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';
import { OroyaContext, type FrameCallback, type OroyaContextValue } from './context';

export interface OroyaCanvasProps {
    /** CSS width of the canvas. Default `100%`. */
    width?: number | string;
    /** CSS height of the canvas. Default `100%`. */
    height?: number | string;
    /** Inline style passed to the underlying `<canvas>`. */
    style?: CSSProperties;
    /** Device pixel ratio override. Default `window.devicePixelRatio`. */
    dpr?: number;
    /**
     * If `true`, the canvas auto-creates a perspective camera at
     * `(0, 0, 5)` looking at the origin. Default `true`. Disable when you
     * want full control via a `<PerspectiveCamera>` JSX child.
     */
    autoCamera?: boolean;
    children?: ReactNode;
}

/**
 * Root component of the React binding. Owns a `Scene`, mounts a
 * `ThreeRenderer` to a managed `<canvas>`, and drives a
 * `requestAnimationFrame` loop that:
 *   1. computes `dt` since the previous frame,
 *   2. fires every registered `useFrame` callback,
 *   3. calls `renderer.render(dt)` (which itself runs
 *      `scene.update(dt)` first).
 *
 * Child JSX (`<Box>`, `<Light>`, custom hooks calling `useFrame`) attaches
 * to the scene graph via context — no manual `scene.add(node)` from app code.
 *
 * @experimental — alpha React bindings; prop names may evolve.
 */
export function OroyaCanvas(props: OroyaCanvasProps) {
    const { width = '100%', height = '100%', style, dpr, autoCamera = true, children } = props;

    // Stable across renders — recreating the scene each render would
    // discard all children's effects and snowball into infinite remounts.
    const scene = useMemo(() => new Scene(), []);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameCallbacksRef = useRef<Set<FrameCallback>>(new Set());

    const contextValue = useMemo<OroyaContextValue>(() => ({
        scene,
        parentNode: scene.root,
        registerFrameCallback: (cb: FrameCallback) => {
            frameCallbacksRef.current.add(cb);
            return () => {
                frameCallbacksRef.current.delete(cb);
            };
        },
    }), [scene]);

    // Optional default camera. Attached directly to scene root before the
    // first render so the renderer has a camera to use even if the app
    // hasn't mounted a `<PerspectiveCamera>` JSX child.
    useEffect(() => {
        if (!autoCamera) return;
        const camNode = new OroyaNode('__oroya_default_camera');
        camNode.transform.position = { x: 0, y: 0, z: 5 };
        camNode.addComponent(new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 1,
            near: 0.1,
            far: 1000,
        }));
        scene.add(camNode);
        return () => {
            scene.remove(camNode);
        };
    }, [autoCamera, scene]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new ThreeRenderer({
            canvas,
            width: canvas.clientWidth || 1,
            height: canvas.clientHeight || 1,
            dpr,
        });
        renderer.mount(scene);

        // ResizeObserver keeps the renderer in sync with CSS layout changes.
        const ro = new ResizeObserver(() => {
            const w = canvas.clientWidth || 1;
            const h = canvas.clientHeight || 1;
            renderer.setSize(w, h);
        });
        ro.observe(canvas);

        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1); // cap to 100ms to survive tab-switches
            last = now;
            for (const cb of frameCallbacksRef.current) cb(dt);
            renderer.render(dt);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose?.();
        };
    }, [scene, dpr]);

    return (
        <OroyaContext.Provider value={contextValue}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width, height, ...style }}
            />
            {children}
        </OroyaContext.Provider>
    );
}
