import {
  BoxGeometryDef,
  ColorRGB,
  ComponentType,
  createInteractionEvent,
  Geometry,
  GeometryPrimitive,
  GradientDef,
  InteractionEventType,
  Interactive,
  LinearGradientDef,
  Material,
  Matrix4,
  Node,
  Path2DGeometryDef,
  RadialGradientDef,
  Scene,
  SphereGeometryDef,
  TextGeometryDef,
} from '@oroya/core';

// ─── Shared Helpers ─────────────────────────────────────────

interface SvgRenderOptions {
  width: number;
  height: number;
  viewBox?: string;
}

function toCssColor(color: ColorRGB | undefined, defaultColor: string): string {
  if (!color) return defaultColor;
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

/**
 * Extract a 2D affine transform `matrix(a,b,c,d,e,f)` from a column-major 4×4 matrix.
 * Returns an empty string when the matrix is identity (no transform needed).
 *
 * Column-major layout:
 *   m[0] m[4] m[8]  m[12]
 *   m[1] m[5] m[9]  m[13]
 *   m[2] m[6] m[10] m[14]
 *   m[3] m[7] m[11] m[15]
 *
 * SVG matrix(a,b,c,d,e,f) maps to:
 *   | a c e |
 *   | b d f |
 *   | 0 0 1 |
 */
function matrix4ToSvgTransform(m: Matrix4): string {
  const a = m[0], b = m[1], c = m[4], d = m[5], e = m[12], f = m[13];

  // Skip identity transforms
  if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) {
    return '';
  }

  return `matrix(${a},${b},${c},${d},${e},${f})`;
}

// ─── Gradient Helpers ───────────────────────────────────────

/**
 * A collector that accumulates gradient definitions during rendering and
 * generates a `<defs>` block. Each gradient definition is deduplicated by
 * reference identity—if the same GradientDef object is used on multiple
 * nodes, it only generates one `<...Gradient>` element.
 */
class GradientCollector {
  private counter = 0;
  private map = new Map<GradientDef, string>(); // def → id

  /** Register a gradient and return its SVG url reference (e.g. "url(#grad-0)"). */
  register(def: GradientDef): string {
    let id = this.map.get(def);
    if (!id) {
      id = `oroya-grad-${this.counter++}`;
      this.map.set(def, id);
    }
    return `url(#${id})`;
  }

  /** Generate all `<stop>` elements for a gradient. */
  private stopsToString(def: GradientDef): string {
    return def.stops
      .map(s => {
        const color = toCssColor(s.color, 'black');
        const opacity = s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : '';
        return `<stop offset="${s.offset}" stop-color="${color}"${opacity} />`;
      })
      .join('');
  }

  /** Generate the `<defs>…</defs>` string. Returns empty string if no gradients. */
  toDefsString(indent: string = '  '): string {
    if (this.map.size === 0) return '';

    const entries: string[] = [];
    for (const [def, id] of this.map) {
      if (def.type === 'linear') {
        const g = def as LinearGradientDef;
        entries.push(
          `${indent}  <linearGradient id="${id}" x1="${g.x1 ?? 0}" y1="${g.y1 ?? 0}" x2="${g.x2 ?? 1}" y2="${g.y2 ?? 0}">${this.stopsToString(g)}</linearGradient>`,
        );
      } else {
        const g = def as RadialGradientDef;
        const fx = g.fx ?? g.cx ?? 0.5;
        const fy = g.fy ?? g.cy ?? 0.5;
        entries.push(
          `${indent}  <radialGradient id="${id}" cx="${g.cx ?? 0.5}" cy="${g.cy ?? 0.5}" r="${g.r ?? 0.5}" fx="${fx}" fy="${fy}">${this.stopsToString(g)}</radialGradient>`,
        );
      }
    }

    return [`${indent}<defs>`, ...entries, `${indent}</defs>`].join('\n');
  }

  /** Build DOM `<defs>` element, returns null if no gradients. */
  toDefsDom(NS: string): SVGDefsElement | null {
    if (this.map.size === 0) return null;

    const defs = document.createElementNS(NS, 'defs') as SVGDefsElement;

    for (const [def, id] of this.map) {
      if (def.type === 'linear') {
        const g = def as LinearGradientDef;
        const el = document.createElementNS(NS, 'linearGradient') as SVGElement;
        el.setAttribute('id', id);
        el.setAttribute('x1', String(g.x1 ?? 0));
        el.setAttribute('y1', String(g.y1 ?? 0));
        el.setAttribute('x2', String(g.x2 ?? 1));
        el.setAttribute('y2', String(g.y2 ?? 0));
        for (const s of g.stops) {
          const stop = document.createElementNS(NS, 'stop') as SVGElement;
          stop.setAttribute('offset', String(s.offset));
          stop.setAttribute('stop-color', toCssColor(s.color, 'black'));
          if (s.opacity !== undefined) stop.setAttribute('stop-opacity', String(s.opacity));
          el.appendChild(stop);
        }
        defs.appendChild(el);
      } else {
        const g = def as RadialGradientDef;
        const el = document.createElementNS(NS, 'radialGradient') as SVGElement;
        el.setAttribute('id', id);
        el.setAttribute('cx', String(g.cx ?? 0.5));
        el.setAttribute('cy', String(g.cy ?? 0.5));
        el.setAttribute('r', String(g.r ?? 0.5));
        el.setAttribute('fx', String(g.fx ?? g.cx ?? 0.5));
        el.setAttribute('fy', String(g.fy ?? g.cy ?? 0.5));
        for (const s of g.stops) {
          const stop = document.createElementNS(NS, 'stop') as SVGElement;
          stop.setAttribute('offset', String(s.offset));
          stop.setAttribute('stop-color', toCssColor(s.color, 'black'));
          if (s.opacity !== undefined) stop.setAttribute('stop-opacity', String(s.opacity));
          el.appendChild(stop);
        }
        defs.appendChild(el);
      }
    }

    return defs;
  }
}

/**
 * Build the fill/stroke/opacity style attributes string for a node's Material.
 * When fillGradient or strokeGradient is present, registers it with the collector
 * and uses `url(#id)` as the value.
 */
function buildStyleAttrs(mat: Material | undefined, gradients?: GradientCollector): string {
  const attrs: string[] = [];

  if (mat?.definition.fillGradient && gradients) {
    attrs.push(`fill="${gradients.register(mat.definition.fillGradient)}"`);
  } else if (mat?.definition.fill) {
    attrs.push(`fill="${toCssColor(mat.definition.fill, 'none')}"`);
  } else {
    attrs.push('fill="none"');
  }

  if (mat?.definition.strokeGradient && gradients) {
    attrs.push(`stroke="${gradients.register(mat.definition.strokeGradient)}"`);
    attrs.push(`stroke-width="${mat.definition.strokeWidth ?? 1}"`);
  } else if (mat?.definition.stroke) {
    attrs.push(`stroke="${toCssColor(mat.definition.stroke, 'black')}"`);
    attrs.push(`stroke-width="${mat.definition.strokeWidth ?? 1}"`);
  }

  if (mat?.definition.opacity !== undefined && mat.definition.opacity < 1) {
    attrs.push(`opacity="${mat.definition.opacity}"`);
  }

  return attrs.join(' ');
}

/**
 * Apply fill/stroke/opacity attributes from a Material to a DOM element.
 * When fillGradient or strokeGradient is present, registers it with the collector.
 */
function applyStyleAttrsToElement(el: SVGElement, mat: Material | undefined, gradients?: GradientCollector): void {
  if (mat?.definition.fillGradient && gradients) {
    el.setAttribute('fill', gradients.register(mat.definition.fillGradient));
  } else if (mat?.definition.fill) {
    el.setAttribute('fill', toCssColor(mat.definition.fill, 'none'));
  } else {
    el.setAttribute('fill', 'none');
  }

  if (mat?.definition.strokeGradient && gradients) {
    el.setAttribute('stroke', gradients.register(mat.definition.strokeGradient));
    el.setAttribute('stroke-width', String(mat.definition.strokeWidth ?? 1));
  } else if (mat?.definition.stroke) {
    el.setAttribute('stroke', toCssColor(mat.definition.stroke, 'black'));
    el.setAttribute('stroke-width', String(mat.definition.strokeWidth ?? 1));
  }

  if (mat?.definition.opacity !== undefined && mat.definition.opacity < 1) {
    el.setAttribute('opacity', String(mat.definition.opacity));
  }
}

// ─── String-based SVG Renderer ──────────────────────────────

/**
 * Render a geometry definition to an SVG element string (without transform).
 * Returns `null` if the geometry type is not supported by SVG.
 */
function geometryToSvgString(geo: Geometry, mat: Material | undefined, gradients: GradientCollector): string | null {
  const style = buildStyleAttrs(mat, gradients);

  switch (geo.definition.type) {
    case GeometryPrimitive.Path2D: {
      const pathDef = geo.definition as Path2DGeometryDef;
      const d = pathDef.path
        .map(cmd => `${cmd.command} ${cmd.args.join(' ')}`)
        .join(' ');
      return `<path d="${d}" ${style} />`;
    }

    case GeometryPrimitive.Box: {
      const boxDef = geo.definition as BoxGeometryDef;
      // Center the rect at origin; the transform will position it.
      const x = -boxDef.width / 2;
      const y = -boxDef.height / 2;
      return `<rect x="${x}" y="${y}" width="${boxDef.width}" height="${boxDef.height}" ${style} />`;
    }

    case GeometryPrimitive.Sphere: {
      const sphereDef = geo.definition as SphereGeometryDef;
      return `<circle cx="0" cy="0" r="${sphereDef.radius}" ${style} />`;
    }

    case GeometryPrimitive.Text: {
      const textDef = geo.definition as TextGeometryDef;
      const fontSize = textDef.fontSize ?? 16;
      const fontFamily = textDef.fontFamily ?? 'sans-serif';
      const fontWeight = textDef.fontWeight ?? 'normal';
      const textAnchor = textDef.textAnchor ?? 'start';
      const dominantBaseline = textDef.dominantBaseline ?? 'auto';
      const escaped = textDef.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<text font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" ${style}>${escaped}</text>`;
    }

    default:
      return null;
  }
}

/**
 * Recursively render a node and its children to an SVG string.
 * Uses the node's **localMatrix** for the transform so that `<g>` nesting
 * replicates the scene-graph hierarchy exactly.
 */
function renderNodeToString(node: Node, indent: string, gradients: GradientCollector): string {
  const geo = node.getComponent<Geometry>(ComponentType.Geometry);
  const mat = node.getComponent<Material>(ComponentType.Material);
  const hasChildren = node.children.length > 0;
  const geoString = geo ? geometryToSvgString(geo, mat, gradients) : null;
  const transformStr = matrix4ToSvgTransform(node.transform.localMatrix);
  const transformAttr = transformStr ? ` transform="${transformStr}"` : '';

  // Skip empty subtrees (no geometry anywhere below) — but we can't know
  // cheaply, so we always emit groups for simplicity and editor friendliness.

  // Leaf node with geometry, no children
  if (geoString && !hasChildren) {
    if (transformAttr) {
      return `${indent}<g${transformAttr}>\n${indent}  ${geoString}\n${indent}</g>`;
    }
    return `${indent}${geoString}`;
  }

  // Node with children (may also have geometry)
  if (hasChildren) {
    const lines: string[] = [];
    lines.push(`${indent}<g${transformAttr}>`);
    if (geoString) {
      lines.push(`${indent}  ${geoString}`);
    }
    for (const child of node.children) {
      const childStr = renderNodeToString(child, indent + '  ', gradients);
      if (childStr) lines.push(childStr);
    }
    lines.push(`${indent}</g>`);
    return lines.join('\n');
  }

  // Leaf node without geometry — nothing to render
  return '';
}

export function renderToSVG(scene: Scene, options: SvgRenderOptions): string {
  // Ensure all matrices are up-to-date before rendering.
  scene.updateWorldMatrices();

  const viewBox = options.viewBox ?? `0 0 ${options.width} ${options.height}`;
  const gradients = new GradientCollector();
  const childStrings: string[] = [];

  for (const child of scene.root.children) {
    const str = renderNodeToString(child, '    ', gradients);
    if (str) childStrings.push(str);
  }

  const defsStr = gradients.toDefsString('  ');

  return [
    `<svg width="${options.width}" height="${options.height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`,
    ...(defsStr ? [defsStr] : []),
    ...childStrings,
    `</svg>`,
  ].join('\n');
}

// ─── Interactive SVG (DOM mode) ─────────────────────────────

interface SvgElementRenderOptions extends SvgRenderOptions {
  /** Target container to append the SVG element to. */
  container?: HTMLElement;
}

/**
 * Create the appropriate SVG DOM element for a geometry definition.
 * Returns `null` if the geometry type is not supported.
 */
function geometryToDomElement(geo: Geometry, NS: string): SVGElement | null {
  switch (geo.definition.type) {
    case GeometryPrimitive.Path2D: {
      const pathDef = geo.definition as Path2DGeometryDef;
      const d = pathDef.path
        .map(cmd => `${cmd.command} ${cmd.args.join(' ')}`)
        .join(' ');
      const el = document.createElementNS(NS, 'path') as SVGElement;
      el.setAttribute('d', d);
      return el;
    }

    case GeometryPrimitive.Box: {
      const boxDef = geo.definition as BoxGeometryDef;
      const el = document.createElementNS(NS, 'rect') as SVGElement;
      el.setAttribute('x', String(-boxDef.width / 2));
      el.setAttribute('y', String(-boxDef.height / 2));
      el.setAttribute('width', String(boxDef.width));
      el.setAttribute('height', String(boxDef.height));
      return el;
    }

    case GeometryPrimitive.Sphere: {
      const sphereDef = geo.definition as SphereGeometryDef;
      const el = document.createElementNS(NS, 'circle') as SVGElement;
      el.setAttribute('cx', '0');
      el.setAttribute('cy', '0');
      el.setAttribute('r', String(sphereDef.radius));
      return el;
    }

    case GeometryPrimitive.Text: {
      const textDef = geo.definition as TextGeometryDef;
      const el = document.createElementNS(NS, 'text') as SVGElement;
      el.setAttribute('font-size', String(textDef.fontSize ?? 16));
      el.setAttribute('font-family', textDef.fontFamily ?? 'sans-serif');
      el.setAttribute('font-weight', textDef.fontWeight ?? 'normal');
      el.setAttribute('text-anchor', textDef.textAnchor ?? 'start');
      el.setAttribute('dominant-baseline', textDef.dominantBaseline ?? 'auto');
      el.textContent = textDef.text;
      return el;
    }

    default:
      return null;
  }
}

/**
 * Attach interactive event listeners to an SVG element for a given node.
 */
function attachInteractiveListeners(
  el: SVGElement,
  node: Node,
  signal: AbortSignal,
): void {
  if (!node.hasComponent(ComponentType.Interactive)) return;

  const interactive = node.getComponent<Interactive>(ComponentType.Interactive)!;
  if (!interactive.definition.enabled) return;

  el.style.cursor = interactive.definition.cursor;

  const dispatch = (type: InteractionEventType, e: Event) => {
    const pointerEvent = e as PointerEvent;
    const event = createInteractionEvent(
      type, node, e,
      { x: pointerEvent.clientX, y: pointerEvent.clientY },
    );
    node.dispatchInteraction(event);
  };

  el.addEventListener('click', (e) => dispatch(InteractionEventType.Click, e), { signal });
  el.addEventListener('pointerdown', (e) => dispatch(InteractionEventType.PointerDown, e), { signal });
  el.addEventListener('pointerup', (e) => dispatch(InteractionEventType.PointerUp, e), { signal });
  el.addEventListener('pointermove', (e) => dispatch(InteractionEventType.PointerMove, e), { signal });
  el.addEventListener('pointerenter', (e) => dispatch(InteractionEventType.PointerEnter, e), { signal });
  el.addEventListener('pointerleave', (e) => dispatch(InteractionEventType.PointerLeave, e), { signal });
  el.addEventListener('wheel', (e) => dispatch(InteractionEventType.Wheel, e), { signal, passive: true });
}

/**
 * Recursively build the SVG DOM tree for a node and its children.
 */
function renderNodeToDom(
  node: Node,
  parent: SVGElement,
  NS: string,
  nodeElementMap: Map<string, SVGElement>,
  signal: AbortSignal,
  gradients: GradientCollector,
): void {
  const geo = node.getComponent<Geometry>(ComponentType.Geometry);
  const mat = node.getComponent<Material>(ComponentType.Material);
  const hasChildren = node.children.length > 0;

  const geoEl = geo ? geometryToDomElement(geo, NS) : null;
  const transformStr = matrix4ToSvgTransform(node.transform.localMatrix);

  // Determine whether we need a <g> wrapper
  const needsGroup = hasChildren || (geoEl && transformStr);

  if (needsGroup) {
    const g = document.createElementNS(NS, 'g') as SVGElement;
    if (transformStr) g.setAttribute('transform', transformStr);

    if (geoEl) {
      geoEl.setAttribute('data-oroya-id', node.id);
      applyStyleAttrsToElement(geoEl, mat, gradients);
      attachInteractiveListeners(geoEl, node, signal);
      nodeElementMap.set(node.id, geoEl);
      g.appendChild(geoEl);
    }

    for (const child of node.children) {
      renderNodeToDom(child, g, NS, nodeElementMap, signal, gradients);
    }

    parent.appendChild(g);
  } else if (geoEl) {
    // Leaf with geometry but no transform — append directly
    geoEl.setAttribute('data-oroya-id', node.id);
    applyStyleAttrsToElement(geoEl, mat, gradients);
    attachInteractiveListeners(geoEl, node, signal);
    nodeElementMap.set(node.id, geoEl);
    parent.appendChild(geoEl);
  }
  // else: leaf without geometry — skip
}

/**
 * Render the scene as a real SVG DOM element with interactive event delegation.
 *
 * The scene-graph hierarchy is preserved using `<g>` elements. Each node's
 * `localMatrix` is applied as a `transform="matrix(...)"` attribute so that
 * transforms compose naturally through SVG nesting.
 *
 * Supported geometries:
 * - **Path2D** → `<path>`
 * - **Box** → `<rect>` (width × height, depth ignored)
 * - **Sphere** → `<circle>` (radius)
 * - **Text** → `<text>`
 *
 * Gradients defined in `MaterialDef.fillGradient` / `strokeGradient` are
 * automatically collected and emitted as `<defs>` in the SVG.
 *
 * Interactive nodes (those with an `Interactive` component) receive pointer/click
 * event listeners that dispatch `InteractionEvent`s through the Oroya scene graph.
 *
 * @returns An object containing the SVG element and a `dispose()` function to clean up listeners.
 */
export function renderToSVGElement(
  scene: Scene,
  options: SvgElementRenderOptions,
): { svg: SVGSVGElement; dispose: () => void } {
  // Ensure all matrices are up-to-date before rendering.
  scene.updateWorldMatrices();

  const NS = 'http://www.w3.org/2000/svg';
  const viewBox = options.viewBox ?? `0 0 ${options.width} ${options.height}`;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(options.width));
  svg.setAttribute('height', String(options.height));
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('xmlns', NS);

  const nodeElementMap = new Map<string, SVGElement>();
  const abortController = new AbortController();
  const { signal } = abortController;
  const gradients = new GradientCollector();

  // Recursively build the DOM tree from the scene root's children.
  for (const child of scene.root.children) {
    renderNodeToDom(child, svg, NS, nodeElementMap, signal, gradients);
  }

  // Insert <defs> for gradients at the top of the SVG
  const defsEl = gradients.toDefsDom(NS);
  if (defsEl) {
    svg.insertBefore(defsEl, svg.firstChild);
  }

  if (options.container) {
    options.container.appendChild(svg);
  }

  return {
    svg,
    dispose: () => {
      abortController.abort();
      svg.remove();
      nodeElementMap.clear();
    },
  };
}

