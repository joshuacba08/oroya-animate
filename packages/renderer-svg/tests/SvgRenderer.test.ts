// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Animation, Animator, ComponentType, GeometryPrimitive, Interactive, Material, Node, Scene, createBox, createCircle, createText } from '@joroya/core';
import { SvgRenderer, renderToSVG } from '../src/renderSVG';

const renderers: SvgRenderer[] = [];
const renderer = () => {
  const result = new SvgRenderer({ width: 640, height: 320, container: document.body, title: 'Ciclo for', description: 'Un paso de la ejecución' });
  renderers.push(result); return result;
};
function box(name: string) {
  const node = new Node(name); node.addComponent(createBox(50, 30, 0));
  node.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } })); return node;
}
afterEach(() => { renderers.forEach(r => r.dispose()); renderers.length = 0; document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('persistent SvgRenderer', () => {
  it('keeps root, group and shape identities while transforms and colors change', () => {
    const scene = new Scene(); const node = box('cursor'); scene.add(node);
    const r = renderer(); r.mount(scene); const svg = r.svg, group = r.getNodeElement(node.id)!, rect = group.querySelector('rect');
    const created = vi.spyOn(document, 'createElementNS');
    node.transform.setPosition({ x: 120, y: 0, z: 0 });
    node.getComponent<Material>(ComponentType.Material)!.definition.fill = { r: 0, g: 1, b: 0 };
    r.render(0, { advanceScene: false });
    expect(r.svg).toBe(svg); expect(r.getNodeElement(node.id)).toBe(group); expect(group.querySelector('rect')).toBe(rect);
    expect(group.getAttribute('transform')).toBe('matrix(1,0,0,1,120,0)'); expect(rect?.getAttribute('fill')).toBe('rgb(0, 255, 0)');
    expect(created).not.toHaveBeenCalled();
  });
  it('does not mutate the DOM for an unchanged frame', () => {
    const scene = new Scene(); scene.add(box('box')); const r = renderer(); r.mount(scene);
    const attributes = vi.spyOn(Element.prototype, 'setAttribute'), inserted = vi.spyOn(globalThis.Node.prototype, 'insertBefore');
    r.render(0, { advanceScene: false });
    expect(attributes).not.toHaveBeenCalled(); expect(inserted).not.toHaveBeenCalled();
  });
  it('updates text safely without recreating its element or restarting its SMIL children', () => {
    const scene = new Scene(); const node = new Node('text'); const geometry = createText('i = 0', { fontSize: 18 }); node.addComponent(geometry);
    node.addComponent(new Animation([{ type: 'animate', attributeName: 'opacity', from: '0', to: '1', dur: '2s' }])); scene.add(node);
    const r = renderer(); r.mount(scene); const text = r.getNodeElement(node.id)!.querySelector('text')!, animate = text.querySelector('animate');
    if (geometry.definition.type === GeometryPrimitive.Text) { geometry.definition.text = '<script>i = 1</script>'; geometry.definition.fontSize = 22; }
    r.render(0, { advanceScene: false });
    expect(r.getNodeElement(node.id)!.querySelector('text')).toBe(text); expect(text.querySelector('animate')).toBe(animate);
    expect(text.textContent).toBe('<script>i = 1</script>'); expect(text.querySelector('script')).toBeNull(); expect(text.getAttribute('font-size')).toBe('22');
  });
  it('removes stale material, CSS and animation attributes', () => {
    const scene = new Scene(); const node = box('box'); node.cssId = 'cursor'; node.cssClass = 'selected';
    const material = node.getComponent<Material>(ComponentType.Material)!;
    material.definition.stroke = { r: 0, g: 0, b: 0 }; material.definition.strokeWidth = 4; material.definition.opacity = 0.4;
    node.addComponent(new Animation([{ type: 'animate', attributeName: 'opacity', dur: '1s', to: '1' }])); scene.add(node);
    const r = renderer(); r.mount(scene); const rect = r.getNodeElement(node.id)!.querySelector('rect')!;
    material.definition = {}; node.cssId = undefined; node.cssClass = undefined; node.removeComponent(ComponentType.Animation);
    r.render(0, { advanceScene: false });
    for (const attribute of ['stroke', 'stroke-width', 'opacity']) expect(rect.hasAttribute(attribute)).toBe(false);
    expect(rect.getAttribute('fill')).toBe('none'); expect(rect.children.length).toBe(0);
    expect(r.getNodeElement(node.id)!.hasAttribute('id')).toBe(false); expect(r.getNodeElement(node.id)!.hasAttribute('class')).toBe(false);
  });
  it('preserves groups through reparenting, reorders children, and removes obsolete nodes', () => {
    const scene = new Scene(); const left = new Node('left'), right = new Node('right'), a = box('a'), b = box('b');
    scene.root.transform.position.x = 10; left.add(a); left.add(b); scene.add(left); scene.add(right);
    const r = renderer(); r.mount(scene); const element = r.getNodeElement(a.id)!;
    expect(r.getNodeElement(scene.root.id)!.getAttribute('transform')).toBe('matrix(1,0,0,1,10,0)');
    right.add(a); left.remove(b); const c = box('c'); right.add(c); right.children.reverse();
    r.render(0, { advanceScene: false });
    expect(r.getNodeElement(a.id)).toBe(element); expect(element.parentNode).toBe(r.getNodeElement(right.id)); expect(r.getNodeElement(b.id)).toBeUndefined();
    expect(Array.from(r.getNodeElement(right.id)!.children).map(child => child.getAttribute('data-oroya-node'))).toEqual([c.id, a.id]);
  });
  it('handles adding/removing/changing geometry without losing the containing group', () => {
    const scene = new Scene(); const node = box('changing'); scene.add(node); const r = renderer(); r.mount(scene); const group = r.getNodeElement(node.id)!;
    node.removeComponent(ComponentType.Geometry); r.render(0, { advanceScene: false }); expect(group.querySelector('rect')).toBeNull();
    node.addComponent(createCircle(20)); r.render(0, { advanceScene: false }); expect(group.querySelector('circle')).not.toBeNull();
    node.addComponent(createCircle(20, 32, 0, Math.PI)); r.render(0, { advanceScene: false });
    expect(group.querySelector('circle')).toBeNull(); expect(group.querySelector('path')).not.toBeNull(); expect(r.getNodeElement(node.id)).toBe(group);
  });
  it('scopes definitions per renderer and refreshes them for in-place gradient edits', () => {
    const scene = new Scene(); const node = box('gradient'); const material = node.getComponent<Material>(ComponentType.Material)!;
    const gradient = { type: 'linear' as const, stops: [{ offset: 0, color: { r: 1, g: 0, b: 0 } }, { offset: 1, color: { r: 0, g: 0, b: 1 } }] };
    material.definition.fillGradient = gradient; scene.add(node);
    const a = renderer(), b = renderer(); a.mount(scene); b.mount(scene);
    expect(a.svg.querySelector('linearGradient')!.id).not.toBe(b.svg.querySelector('linearGradient')!.id);
    gradient.stops[0].color = { r: 0, g: 1, b: 0 }; a.render(0, { advanceScene: false });
    expect(a.svg.querySelector('stop')!.getAttribute('stop-color')).toBe('rgb(0, 255, 0)');
    delete material.definition.fillGradient; a.render(0, { advanceScene: false }); expect(a.svg.querySelector('defs')).toBeNull();
  });
  it('delegates each interaction once and observes live enable/disable changes', () => {
    const scene = new Scene(); const parent = new Node('parent'), node = box('interactive');
    const interactive = new Interactive(); node.addComponent(interactive); parent.add(node); scene.add(parent);
    const childHandler = vi.fn(), parentHandler = vi.fn(); node.events.on('click', childHandler); parent.events.on('click', parentHandler);
    const r = renderer(); r.mount(scene);
    for (let i = 0; i < 20; i++) r.render(0, { advanceScene: false });
    r.getNodeElement(node.id)!.querySelector('rect')!.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10 }));
    expect(childHandler).toHaveBeenCalledTimes(1); expect(parentHandler).toHaveBeenCalledTimes(1);
    interactive.definition.enabled = false; r.render(0, { advanceScene: false });
    r.getNodeElement(node.id)!.querySelector('rect')!.dispatchEvent(new MouseEvent('click', { bubbles: true })); expect(childHandler).toHaveBeenCalledTimes(1);
  });
  it('keeps application accessibility annotations and keyboard focus through redraws', () => {
    const scene = new Scene(); const node = box('focusable'); scene.add(node); const r = renderer(); r.mount(scene);
    const group = r.getNodeElement(node.id)!; group.setAttribute('tabindex', '0'); group.setAttribute('aria-label', 'Variable i'); group.focus();
    node.transform.setPosition({ x: 50, y: 0, z: 0 }); r.render(0, { advanceScene: false });
    expect(document.activeElement).toBe(group); expect(group.getAttribute('aria-label')).toBe('Variable i');
    expect(r.svg.querySelector('title')?.textContent).toBe('Ciclo for');
    r.setAccessibleDescription('<script>Ejemplo</script>', ''); expect(r.svg.querySelector('script')).toBeNull(); expect(r.svg.hasAttribute('aria-describedby')).toBe(false);
  });
  it('binds new Animators, advances once and preserves event-free seeks', () => {
    const scene = new Scene(); const node = box('cursor'); scene.add(node);
    const clip = { name: 'move', duration: 2, tracks: [{ targetNodeName: 'cursor', property: 'position' as const, times: new Float32Array([0, 2]), values: new Float32Array([0, 0, 0, 200, 0, 0]), interpolation: 'linear' as const }] };
    const animator = new Animator({ animations: { move: clip }, autoplay: 'move', loop: false }); scene.root.addComponent(animator);
    const r = renderer(); r.mount(scene); expect(animator.currentMixer?.time).toBe(0);
    r.render(0.5); expect(node.transform.position.x).toBe(50);
    animator.pause(); r.render(0.5); expect(node.transform.position.x).toBe(50);
    animator.seek(1.5); r.render(0, { advanceScene: false }); expect(node.transform.position.x).toBe(150);
    scene.root.removeComponent(ComponentType.Animator); r.render(0, { advanceScene: false }); expect(animator.currentMixer).toBeNull();
  });
  it('does not dispose a mixer bound by the application', () => {
    const scene = new Scene(); const animator = new Animator(); scene.root.addComponent(animator); animator.bindToScene(scene);
    const mixer = animator.currentMixer; const r = renderer(); r.mount(scene); r.dispose(); expect(animator.currentMixer).toBe(mixer);
    animator.unbindFromScene();
  });
  it('resizes, validates lifecycle inputs and disposes only its own DOM', () => {
    const unrelated = document.createElement('aside'); document.body.appendChild(unrelated);
    const r = renderer(); expect(() => r.render()).toThrow('mount'); r.mount(new Scene());
    r.setSize(800, 500); expect(r.svg.getAttribute('viewBox')).toBe('0 0 800 500');
    r.setViewBox('10 20 100 200'); r.setSize(900, 600); expect(r.svg.getAttribute('viewBox')).toBe('10 20 100 200');
    expect(() => r.setSize(0, 10)).toThrow(); expect(() => r.setViewBox('0 0 NaN 10')).toThrow(); expect(() => r.render(-1)).toThrow();
    r.dispose(); r.dispose(); expect(unrelated.isConnected).toBe(true); expect(r.svg.isConnected).toBe(false); expect(() => r.mount(new Scene())).toThrow('disposed');
  });
  it('keeps the string exporter DOM-independent', () => {
    const scene = new Scene(); scene.add(box('export')); expect(renderToSVG(scene, { width: 100, height: 100, advanceScene: false })).toContain('<rect');
  });
});
