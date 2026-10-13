// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Scene, Node, Material, createBox, createSphere, createPlane, Geometry, GeometryPrimitive, type Diagnostic } from '@joroya/core';
import { renderToSVG } from '@joroya/renderer-svg';
import { renderToCanvas, canvas2DCapabilities } from '../src';

describe('Canvas2D frame contract and common properties', () => {
  it('shares a single scene update with SVG and emits transformed fill/opacity', () => {
    const scene = new Scene(); let ticks = 0; scene.root.onUpdate = () => { ticks++; };
    scene.root.transform.setPosition({ x: 10, y: 0, z: 0 });
    const node = new Node('box'); node.addComponent(createBox()); node.addComponent(new Material({ color: { r: 1, g: 0, b: 0 }, opacity: 0.5 })); scene.add(node);
    const context = { setTransform: vi.fn(), transform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), globalAlpha: 1 };
    const canvas = { width: 200, height: 100, getContext: () => context } as unknown as HTMLCanvasElement;
    renderToSVG(scene, { width: 200, height: 100, dt: 0.1 });
    renderToCanvas(scene, canvas, { width: 200, height: 100, dt: 0.1, advanceScene: false });
    expect(ticks).toBe(1); expect(context.transform).toHaveBeenCalledWith(1, 0, 0, 1, 10, 0);
    expect(context.fillRect).toHaveBeenCalledWith(-0.5, -0.5, 1, 1); expect(context.globalAlpha).toBe(0.5);
  });
  it('draws declared primitives and reports unsupported buffer geometry', () => {
    const scene = new Scene();
    for (const geometry of [createSphere(), createPlane(), new Geometry({ type: GeometryPrimitive.Buffer, positions: new Float32Array(9) })]) {
      const node = new Node(); node.addComponent(geometry); node.addComponent(new Material({ color: { r: 1, g: 1, b: 1 } })); scene.add(node);
    }
    const context = { setTransform: vi.fn(), transform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), globalAlpha: 1 };
    const canvas = { width: 200, height: 100, getContext: () => context } as unknown as HTMLCanvasElement;
    const diagnostics: Diagnostic[] = [];
    renderToCanvas(scene, canvas, { width: 200, height: 100, onDiagnostic: (value) => diagnostics.push(value) });
    expect(context.arc).toHaveBeenCalledOnce(); expect(context.fillRect).toHaveBeenCalledOnce();
    expect(diagnostics.some((value) => value.code === 'UNSUPPORTED_GEOMETRY')).toBe(true); expect(canvas2DCapabilities.interaction).toBe(false);
  });
});
