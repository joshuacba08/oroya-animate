import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Scene, Node, Camera, CameraType, Light, LightType, Material, createBox, createSphere, createPlane } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';
import { PerspectiveCamera } from 'three';
import { TransformControls } from 'three/addons';
import { HierarchyPanel } from './HierarchyPanel';
import { TransformInspector } from './TransformInspector';
import { Toolbar } from './Toolbar';
import { EditorController, captureTransform, type TransformSnapshot } from './EditorController';

export function Editor() {
  const model = useMemo(() => new EditorController(buildStarterScene()), []);
  const revision = useSyncExternalStore(model.subscribe, model.getSnapshot);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const gizmoRef = useRef<TransformControls | null>(null);
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const loadGeneration = useRef(0);
  const scene = model.scene;
  const guard = (action: () => void) => {
    try { action(); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new ThreeRenderer({ canvas, width: canvas.clientWidth || 800, height: canvas.clientHeight || 600,
      onDiagnostic: (diagnostic) => setMessage(diagnostic.message) });
    // Viewport navigation never modifies authored scene cameras.
    const camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(4, 4, 6); camera.lookAt(0, 0, 0);
    renderer.setCameraOverride(camera);
    renderer.mount(scene); renderer.enableOrbitControls(); rendererRef.current = renderer;
    const gizmo = new TransformControls(camera, canvas);
    gizmoRef.current = gizmo; renderer.addOverlay(gizmo);
    let drag: { node: Node; before: TransformSnapshot } | undefined;
    gizmo.addEventListener('mouseDown', () => {
      if (model.selected) drag = { node: model.selected, before: captureTransform(model.selected) };
      renderer.disableOrbitControls();
    });
    gizmo.addEventListener('objectChange', () => {
      if (!drag || !gizmo.object) return;
      model.previewTransform(drag.node, { position: { x: gizmo.object.position.x, y: gizmo.object.position.y, z: gizmo.object.position.z },
        rotation: { x: gizmo.object.quaternion.x, y: gizmo.object.quaternion.y, z: gizmo.object.quaternion.z, w: gizmo.object.quaternion.w },
        scale: { x: gizmo.object.scale.x, y: gizmo.object.scale.y, z: gizmo.object.scale.z } });
    });
    let suppressClick = false;
    gizmo.addEventListener('mouseUp', () => {
      if (drag) model.recordTransform(drag.node, drag.before, captureTransform(drag.node));
      drag = undefined; suppressClick = true; renderer.enableOrbitControls();
    });
    const click = (event: MouseEvent) => {
      if (suppressClick) { suppressClick = false; return; }
      if (gizmo.axis || gizmo.dragging) return;
      model.select(renderer.pick(event.clientX, event.clientY));
    };
    canvas.addEventListener('click', click);
    const resize = new ResizeObserver(() => renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight)));
    resize.observe(canvas); renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight));
    let raf = 0; let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.1)); last = now;
      renderer.render(dt, { advanceScene: false });
      const object = model.selected ? renderer.getObject(model.selected) : undefined;
      if (!drag && object && gizmo.object !== object) gizmo.attach(object);
      else if (!object && gizmo.object) gizmo.detach();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); resize.disconnect(); canvas.removeEventListener('click', click);
      gizmo.detach(); gizmo.dispose(); gizmoRef.current = null;
      renderer.dispose(); rendererRef.current = null;
    };
  }, [scene, model]);

  useEffect(() => { gizmoRef.current?.setMode(mode); }, [mode, scene]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches('input, textarea, select') || event.target.isContentEditable)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); if (event.shiftKey) model.redo(); else model.undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); model.redo(); }
      else if (event.key === 'Delete') model.delete();
      else if (event.key.toLowerCase() === 'w') setMode('translate');
      else if (event.key.toLowerCase() === 'e') setMode('rotate');
      else if (event.key.toLowerCase() === 'r') setMode('scale');
    };
    const unload = (event: BeforeUnloadEvent) => { if (model.dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('keydown', keyboard); window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('keydown', keyboard); window.removeEventListener('beforeunload', unload); };
  }, [model]);

  const save = () => guard(() => {
    const result = model.save();
    if (result.diagnostics.length && !window.confirm(result.diagnostics.map((item) => item.message).join('\n') + '\nContinue saving declarative data?')) return;
    const url = URL.createObjectURL(new Blob([result.json], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'scene.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); model.markSaved();
  });
  const load = async (file: File) => {
    const generation = ++loadGeneration.current; setBusy(true);
    try {
      const text = await file.text();
      if (generation !== loadGeneration.current) return;
      // Construct and validate before asking to replace unsaved authoring.
      const preview = new EditorController(new Scene()); const diagnostics = preview.load(text);
      if (model.dirty && !window.confirm('Replace the scene and discard unsaved changes?')) return;
      model.load(text); setMessage(diagnostics.map((item) => item.message).join('\n'));
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { if (generation === loadGeneration.current) setBusy(false); }
  };

  return <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', color: '#ddd', background: '#191b20', fontFamily: 'system-ui' }}>
    <Toolbar onAdd={(kind) => guard(() => { model.add(kind); })} onSave={save} onLoad={load}
      onUndo={() => model.undo()} onRedo={() => model.redo()} canUndo={model.canUndo} canRedo={model.canRedo}
      dirty={model.dirty} busy={busy} mode={mode} onMode={setMode} />
    {message && <div role="alert" style={{ padding: 10, whiteSpace: 'pre-wrap', background: '#4b2929', maxHeight: 140, overflow: 'auto' }}>{message}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(120px, 1fr) 280px', flex: 1, minHeight: 0 }}>
      <aside style={{ overflow: 'auto', borderRight: '1px solid #383c46' }} aria-label="Scene hierarchy">
        <HierarchyPanel scene={scene} selected={model.selected} onSelect={(node) => model.select(node)} revision={revision} />
      </aside>
      <main style={{ minHeight: 0, position: 'relative' }}>
        <canvas ref={canvasRef} aria-label="Scene viewport" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, pointerEvents: 'none', fontSize: 12 }}>Orbit: drag · Pan: right drag · Zoom: scroll · W/E/R: gizmos</div>
      </main>
      <aside style={{ overflow: 'auto', borderLeft: '1px solid #383c46' }} aria-label="Node inspector">
        <TransformInspector model={model} onError={setMessage} />
      </aside>
    </div>
  </div>;
}

function buildStarterScene(): Scene {
  const scene = new Scene();
  const camera = new Node('camera'); camera.transform.setPosition({ x: 4, y: 4, z: 6 }); camera.transform.lookAt({ x: 0, y: 0, z: 0 });
  camera.addComponent(new Camera({ type: CameraType.Perspective, fov: 50, aspect: 1, near: 0.1, far: 100, autoAspect: true })); scene.add(camera);
  const sun = new Node('sun'); sun.addComponent(new Light({ type: LightType.Directional, intensity: 1, castShadow: true }));
  sun.transform.setPosition({ x: 5, y: 8, z: 5 }); scene.add(sun);
  const ambient = new Node('ambient'); ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.45 })); scene.add(ambient);
  const ground = new Node('ground'); ground.addComponent(createPlane(10, 10, 1, 1, { receiveShadow: true }));
  ground.addComponent(new Material({ color: { r: 0.2, g: 0.22, b: 0.27 } })); ground.transform.setRotation({ x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }); scene.add(ground);
  const cube = new Node('hero'); cube.addComponent(createBox()); cube.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 } }));
  cube.transform.setPosition({ x: 0, y: 0.5, z: 0 }); scene.add(cube);
  const ball = new Node('ball'); ball.addComponent(createSphere(0.5, 16, 16)); ball.addComponent(new Material({ color: { r: 0.3, g: 0.7, b: 1 } }));
  ball.transform.setPosition({ x: 2, y: 0.5, z: -1 }); scene.add(ball); return scene;
}
