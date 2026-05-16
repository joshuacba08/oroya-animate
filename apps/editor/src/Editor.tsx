import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Scene,
    Node as OroyaNode,
    Camera,
    CameraType,
    Light,
    LightType,
    Material,
    createBox,
    createSphere,
    createPlane,
    serialize,
    deserialize,
    type Vec3,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';
import { Inspector } from '@joroya/inspector';
import { HierarchyPanel } from './HierarchyPanel';
import { TransformInspector } from './TransformInspector';
import { Toolbar } from './Toolbar';

/**
 * The visual editor app shell.
 *
 * Three panels:
 *   • Left:   hierarchy tree (HierarchyPanel)
 *   • Center: rendered scene + free-orbit camera
 *   • Right:  transform inspector for the selected node
 *
 * The scene is mutable from the right panel — sliders edit
 * `node.transform.{position, rotation, scale}` directly. Save/Load buttons
 * use the v0.10.0 serialization round-trip.
 *
 * The `Inspector` package's panel is *not* used here — its DOM overlay
 * collides with a host-driven layout. Instead we reuse the underlying
 * `FrameMetrics` and `collectSceneStats` helpers and render our own UI.
 */
export function Editor() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const rendererRef = useRef<ThreeRenderer | null>(null);
    const inspectorRef = useRef<Inspector | null>(null);

    // We re-render the panels only when the selection changes, not every
    // frame — the canvas already updates 60Hz on its own RAF loop.
    const [selected, setSelected] = useState<OroyaNode | null>(null);
    // Counter forces re-renders when we mutate the scene tree from buttons
    // (add cube, load), since the scene itself isn't a React state object.
    const [revision, bumpRevision] = useState(0);
    const bump = useCallback(() => bumpRevision((r) => r + 1), []);

    const scene = useMemo(() => {
        const s = buildStarterScene();
        sceneRef.current = s;
        return s;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const renderer = new ThreeRenderer({
            canvas,
            width: canvas.clientWidth || 800,
            height: canvas.clientHeight || 600,
        });
        renderer.mount(scene);
        renderer.enableInteraction?.();
        rendererRef.current = renderer;

        // We still use the inspector internally for selection click-handling
        // and for FrameMetrics. The DOM panel is hidden via opacity-0.
        const inspector = new Inspector(scene, { startCollapsed: true, container: document.body });
        inspectorRef.current = inspector;

        const ro = new ResizeObserver(() => {
            renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1);
        });
        ro.observe(canvas);

        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            renderer.render(dt);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose?.();
        };
    }, [scene]);

    const handleSelect = useCallback((node: OroyaNode | null) => {
        setSelected(node);
    }, []);

    const handleAddCube = useCallback(() => {
        if (!sceneRef.current) return;
        const cube = new OroyaNode(`cube-${Date.now().toString(36).slice(-4)}`);
        cube.addComponent(createBox(1, 1, 1, { castShadow: true }));
        cube.addComponent(new Material({ color: { r: Math.random(), g: Math.random(), b: Math.random() } }));
        cube.transform.position = { x: Math.random() * 2 - 1, y: 0.5, z: Math.random() * 2 - 1 };
        cube.transform.updateLocalMatrix();
        sceneRef.current.add(cube);
        bump();
    }, [bump]);

    const handleDelete = useCallback(() => {
        if (!selected || !sceneRef.current) return;
        sceneRef.current.remove(selected);
        setSelected(null);
        bump();
    }, [selected, bump]);

    const handleSave = useCallback(() => {
        if (!sceneRef.current) return;
        const json = serialize(sceneRef.current);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const handleLoad = useCallback(async (file: File) => {
        const text = await file.text();
        const loaded = deserialize(text);
        if (!rendererRef.current) return;
        sceneRef.current = loaded;
        rendererRef.current.mount(loaded);
        setSelected(null);
        bump();
    }, [bump]);

    const handleTransformChange = useCallback((axis: 'position' | 'rotation' | 'scale', component: keyof Vec3 | 'w', value: number) => {
        if (!selected) return;
        // The Vec3 / Quat types are fixed-shape structs. Cast through
        // `unknown` to write by component name — the runtime field exists
        // (constrained by the `component` union type).
        if (axis === 'rotation') {
            (selected.transform.rotation as unknown as Record<string, number>)[component] = value;
        } else {
            (selected.transform[axis] as unknown as Record<string, number>)[component] = value;
        }
        selected.transform.updateLocalMatrix();
        bump();
    }, [selected, bump]);

    return (
        <div style={shellStyle}>
            <Toolbar onAddCube={handleAddCube} onSave={handleSave} onLoad={handleLoad} />
            <div style={bodyStyle}>
                <aside style={leftPanelStyle}>
                    <HierarchyPanel scene={scene} selected={selected} onSelect={handleSelect} revision={revision} />
                </aside>
                <main style={canvasContainerStyle}>
                    <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
                </main>
                <aside style={rightPanelStyle}>
                    <TransformInspector node={selected} onChange={handleTransformChange} onDelete={handleDelete} />
                </aside>
            </div>
        </div>
    );
}

function buildStarterScene(): Scene {
    const scene = new Scene();

    const cam = new OroyaNode('camera');
    cam.transform.position = { x: 4, y: 4, z: 6 };
    cam.transform.lookAt({ x: 0, y: 0, z: 0 });
    cam.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 50,
        aspect: 1,
        near: 0.1,
        far: 100,
    }));
    scene.add(cam);

    const sun = new OroyaNode('sun');
    sun.addComponent(new Light({
        type: LightType.Directional,
        intensity: 1.0,
        castShadow: true,
        shadowMapSize: 1024,
    }));
    sun.transform.position = { x: 5, y: 8, z: 5 };
    scene.add(sun);

    const ambient = new OroyaNode('ambient');
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.45 }));
    scene.add(ambient);

    const ground = new OroyaNode('ground');
    ground.addComponent(createPlane(10, 10, 1, 1, { receiveShadow: true }));
    ground.addComponent(new Material({ color: { r: 0.2, g: 0.22, b: 0.27 } }));
    ground.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
    scene.add(ground);

    const hero = new OroyaNode('hero');
    hero.addComponent(createBox(1, 1, 1, { castShadow: true }));
    hero.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 } }));
    hero.transform.position = { x: 0, y: 0.5, z: 0 };
    scene.add(hero);

    const ball = new OroyaNode('ball');
    ball.addComponent(createSphere(0.5, 16, 16, { castShadow: true }));
    ball.addComponent(new Material({ color: { r: 0.3, g: 0.7, b: 1 } }));
    ball.transform.position = { x: 2, y: 0.5, z: -1 };
    scene.add(ball);

    return scene;
}

// ── styles ──────────────────────────────────────────────────────

const shellStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1a1a',
    color: '#ddd',
};

const bodyStyle: React.CSSProperties = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '240px 1fr 280px',
    minHeight: 0,
};

const leftPanelStyle: React.CSSProperties = {
    borderRight: '1px solid #333',
    background: '#222',
    overflowY: 'auto',
};

const canvasContainerStyle: React.CSSProperties = {
    background: '#101012',
    minHeight: 0,
};

const rightPanelStyle: React.CSSProperties = {
    borderLeft: '1px solid #333',
    background: '#222',
    overflowY: 'auto',
};
