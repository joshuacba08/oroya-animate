import { describe, expect, it } from 'vitest';
import {
    createBox,
    createPath2D,
    createSphere,
    Material,
    Node,
    Scene,
} from '../../core/src';
import { createText } from '../../core/src/geometry/primitives';
import { renderToSVG } from '../src/renderSVG';

// ─── Helper ─────────────────────────────────────────────────

function triangle(name = 'tri') {
  const n = new Node(name);
  n.addComponent(
    createPath2D([
      { command: 'M' as any, args: [0, 0] },
      { command: 'L' as any, args: [100, 0] },
      { command: 'L' as any, args: [50, 80] },
      { command: 'Z' as any, args: [] },
    ]),
  );
  n.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));
  return n;
}

// ─── Tests ──────────────────────────────────────────────────

describe('renderToSVG', () => {
  it('renders a basic Path2D as <path>', () => {
    const scene = new Scene();
    scene.add(triangle());

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(svg).toContain('d="M 0 0 L 100 0 L 50 80 Z "');
    expect(svg).toContain('fill="rgb(255, 0, 0)"');
  });

  it('renders a Box as <rect>', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(40, 20, 10));
    box.addComponent(new Material({ fill: { r: 0, g: 1, b: 0 } }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('<rect');
    expect(svg).toContain('x="-20"');
    expect(svg).toContain('y="-10"');
    expect(svg).toContain('width="40"');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('fill="rgb(0, 255, 0)"');
  });

  it('renders a Sphere as <circle>', () => {
    const scene = new Scene();
    const sphere = new Node('sphere');
    sphere.addComponent(createSphere(25));
    sphere.addComponent(new Material({ stroke: { r: 0, g: 0, b: 1 }, strokeWidth: 2 }));
    scene.add(sphere);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('<circle');
    expect(svg).toContain('cx="0"');
    expect(svg).toContain('cy="0"');
    expect(svg).toContain('r="25"');
    expect(svg).toContain('stroke="rgb(0, 0, 255)"');
  });

  // ── Transforms ──────────────────────────────────────────

  it('applies a translation transform as matrix()', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(10, 10, 10));
    box.addComponent(new Material({ fill: { r: 1, g: 1, b: 1 } }));
    box.transform.position = { x: 50, y: 30, z: 0 };
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    // Should contain a transform with translate values
    expect(svg).toContain('transform="matrix(1,0,0,1,50,30)"');
  });

  it('applies scale transform', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(10, 10, 10));
    box.addComponent(new Material({ fill: { r: 1, g: 1, b: 1 } }));
    box.transform.scale = { x: 2, y: 3, z: 1 };
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('transform="matrix(2,0,0,3,0,0)"');
  });

  it('omits transform for identity matrix', () => {
    const scene = new Scene();
    scene.add(triangle());

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    // No transform attribute for identity
    expect(svg).not.toContain('transform=');
  });

  // ── Hierarchy with <g> ──────────────────────────────────

  it('wraps children in <g> elements', () => {
    const scene = new Scene();
    const parent = new Node('parent');
    parent.transform.position = { x: 10, y: 20, z: 0 };

    const child = new Node('child');
    child.addComponent(createBox(5, 5, 5));
    child.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));

    parent.add(child);
    scene.add(parent);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('<g');
    expect(svg).toContain('</g>');
    expect(svg).toContain('transform="matrix(1,0,0,1,10,20)"');
    expect(svg).toContain('<rect');
  });

  it('nests <g> elements for deep hierarchies', () => {
    const scene = new Scene();

    const grandparent = new Node('gp');
    grandparent.transform.position = { x: 100, y: 0, z: 0 };

    const parentNode = new Node('p');
    parentNode.transform.position = { x: 0, y: 50, z: 0 };

    const leaf = new Node('leaf');
    leaf.addComponent(createSphere(5));
    leaf.addComponent(new Material({ fill: { r: 1, g: 1, b: 0 } }));

    parentNode.add(leaf);
    grandparent.add(parentNode);
    scene.add(grandparent);

    const svg = renderToSVG(scene, { width: 400, height: 400 });

    // Should have nested <g> groups
    const gCount = (svg.match(/<g/g) || []).length;
    expect(gCount).toBeGreaterThanOrEqual(2);
    expect(svg).toContain('<circle');
  });

  it('renders parent geometry alongside children', () => {
    const scene = new Scene();

    const parent = new Node('parent');
    parent.addComponent(createBox(100, 100, 0));
    parent.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.5 } }));

    const child = new Node('child');
    child.addComponent(createSphere(10));
    child.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));

    parent.add(child);
    scene.add(parent);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    // Both a rect (parent) and circle (child) should be present
    expect(svg).toContain('<rect');
    expect(svg).toContain('<circle');
  });

  // ── Options ─────────────────────────────────────────────

  it('uses custom viewBox', () => {
    const scene = new Scene();
    const svg = renderToSVG(scene, { width: 800, height: 600, viewBox: '-100 -100 200 200' });

    expect(svg).toContain('viewBox="-100 -100 200 200"');
  });

  it('defaults viewBox to 0 0 width height', () => {
    const scene = new Scene();
    const svg = renderToSVG(scene, { width: 300, height: 150 });

    expect(svg).toContain('viewBox="0 0 300 150"');
  });

  // ── Opacity ─────────────────────────────────────────────

  it('applies opacity attribute when opacity < 1', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(10, 10, 10));
    box.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 }, opacity: 0.5 }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('opacity="0.5"');
  });

  it('omits opacity attribute when opacity is 1', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(10, 10, 10));
    box.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 }, opacity: 1 }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).not.toContain('opacity=');
  });

  it('omits opacity attribute when opacity is undefined', () => {
    const scene = new Scene();
    scene.add(triangle());

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).not.toContain('opacity=');
  });

  // ── Text ────────────────────────────────────────────────

  it('renders Text geometry as <text>', () => {
    const scene = new Scene();
    const label = new Node('label');
    label.addComponent(createText('Hello World'));
    label.addComponent(new Material({ fill: { r: 0, g: 0, b: 0 } }));
    scene.add(label);

    const svg = renderToSVG(scene, { width: 400, height: 200 });

    expect(svg).toContain('<text');
    expect(svg).toContain('Hello World');
    expect(svg).toContain('font-size="16"');
    expect(svg).toContain('font-family="sans-serif"');
  });

  it('renders Text with custom font options', () => {
    const scene = new Scene();
    const label = new Node('label');
    label.addComponent(createText('Bold Title', {
      fontSize: 32,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      textAnchor: 'middle',
      dominantBaseline: 'middle',
    }));
    label.addComponent(new Material({ fill: { r: 1, g: 1, b: 1 } }));
    scene.add(label);

    const svg = renderToSVG(scene, { width: 400, height: 200 });

    expect(svg).toContain('font-size="32"');
    expect(svg).toContain('font-family="Georgia"');
    expect(svg).toContain('font-weight="bold"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="middle"');
    expect(svg).toContain('Bold Title');
  });

  it('escapes HTML entities in text content', () => {
    const scene = new Scene();
    const label = new Node('label');
    label.addComponent(createText('a < b & c > d'));
    label.addComponent(new Material({ fill: { r: 0, g: 0, b: 0 } }));
    scene.add(label);

    const svg = renderToSVG(scene, { width: 400, height: 200 });

    expect(svg).toContain('a &lt; b &amp; c &gt; d');
    expect(svg).not.toContain('a < b');
  });

  it('applies transform to text nodes', () => {
    const scene = new Scene();
    const label = new Node('label');
    label.addComponent(createText('Moved'));
    label.addComponent(new Material({ fill: { r: 0, g: 0, b: 0 } }));
    label.transform.position = { x: 100, y: 50, z: 0 };
    scene.add(label);

    const svg = renderToSVG(scene, { width: 400, height: 200 });

    expect(svg).toContain('transform="matrix(1,0,0,1,100,50)"');
    expect(svg).toContain('<text');
  });

  // ── Gradients ───────────────────────────────────────────

  it('renders linear gradient in <defs> and references it with url()', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(100, 100, 0));
    box.addComponent(new Material({
      fillGradient: {
        type: 'linear',
        x1: 0, y1: 0, x2: 1, y2: 1,
        stops: [
          { offset: 0, color: { r: 1, g: 0, b: 0 } },
          { offset: 1, color: { r: 0, g: 0, b: 1 } },
        ],
      },
    }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 400, height: 400 });

    expect(svg).toContain('<defs>');
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('x1="0"');
    expect(svg).toContain('x2="1"');
    expect(svg).toContain('y2="1"');
    expect(svg).toContain('stop-color="rgb(255, 0, 0)"');
    expect(svg).toContain('stop-color="rgb(0, 0, 255)"');
    expect(svg).toContain('fill="url(#oroya-grad-0)"');
    expect(svg).toContain('</defs>');
  });

  it('renders radial gradient in <defs>', () => {
    const scene = new Scene();
    const circle = new Node('circle');
    circle.addComponent(createSphere(50));
    circle.addComponent(new Material({
      fillGradient: {
        type: 'radial',
        cx: 0.5, cy: 0.5, r: 0.5,
        stops: [
          { offset: 0, color: { r: 1, g: 1, b: 1 } },
          { offset: 1, color: { r: 0, g: 0, b: 0 } },
        ],
      },
    }));
    scene.add(circle);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('<radialGradient');
    expect(svg).toContain('cx="0.5"');
    expect(svg).toContain('r="0.5"');
    expect(svg).toContain('fill="url(#oroya-grad-0)"');
  });

  it('supports stroke gradient', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(100, 100, 0));
    box.addComponent(new Material({
      fill: { r: 1, g: 1, b: 1 },
      strokeGradient: {
        type: 'linear',
        stops: [
          { offset: 0, color: { r: 1, g: 0, b: 0 } },
          { offset: 1, color: { r: 0, g: 1, b: 0 } },
        ],
      },
      strokeWidth: 3,
    }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('stroke="url(#oroya-grad-0)"');
    expect(svg).toContain('stroke-width="3"');
  });

  it('supports gradient stop opacity', () => {
    const scene = new Scene();
    const box = new Node('box');
    box.addComponent(createBox(50, 50, 0));
    box.addComponent(new Material({
      fillGradient: {
        type: 'linear',
        stops: [
          { offset: 0, color: { r: 1, g: 0, b: 0 }, opacity: 1 },
          { offset: 1, color: { r: 0, g: 0, b: 1 }, opacity: 0 },
        ],
      },
    }));
    scene.add(box);

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).toContain('stop-opacity="0"');
  });

  it('does not emit <defs> when no gradients are used', () => {
    const scene = new Scene();
    scene.add(triangle());

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    expect(svg).not.toContain('<defs>');
  });

  it('deduplicates the same gradient object used on multiple nodes', () => {
    const sharedGrad = {
      type: 'linear' as const,
      stops: [
        { offset: 0, color: { r: 1, g: 0, b: 0 } },
        { offset: 1, color: { r: 0, g: 0, b: 1 } },
      ],
    };

    const scene = new Scene();
    for (let i = 0; i < 3; i++) {
      const n = new Node(`box-${i}`);
      n.addComponent(createBox(10, 10, 0));
      n.addComponent(new Material({ fillGradient: sharedGrad }));
      scene.add(n);
    }

    const svg = renderToSVG(scene, { width: 200, height: 200 });

    // Should only have one linearGradient definition
    const gradCount = (svg.match(/<linearGradient/g) || []).length;
    expect(gradCount).toBe(1);

    // All three rects reference the same gradient
    const urlRefs = (svg.match(/url\(#oroya-grad-0\)/g) || []).length;
    expect(urlRefs).toBe(3);
  });
});
