import {
  Animation,
  Animator,
  BoxGeometryDef,
  Camera,
  CameraType,
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
  OrthographicCameraDef,
  Path2DGeometryDef,
  RadialGradientDef,
  Scene,
  SphereGeometryDef,
  CylinderGeometryDef,
  PlaneGeometryDef,
  ConeGeometryDef,
  TorusGeometryDef,
  CircleGeometryDef,
  SvgAnimateDef,
  SvgAnimateTransformDef,
  SvgClipPathDef,
  SvgFilterDef,
  SvgMaskDef,
  TextGeometryDef,
  type RenderOptions,
  type RendererCapabilities,
  diagnoseScene,
} from '@joroya/core';

// ─── Shared Helpers ─────────────────────────────────────────

/** SVG string rendering options. @public */
export interface SvgRenderOptions extends RenderOptions {
  width: number;
  height: number;
  viewBox?: string;
  /**
   * Time delta in seconds since the previous render. Drives `Scene.update(dt)`
   * — Animator, ParticleSystem, and user `onUpdate` hooks. Default `1/60`.
   */
  dt?: number;
}

/** SVG backend translation capabilities. @public */
export const svgCapabilities: RendererCapabilities = Object.freeze({
  backend: 'svg', geometry: Object.freeze(Object.values(GeometryPrimitive).filter((type) => type !== GeometryPrimitive.Buffer && type !== GeometryPrimitive.CSG)),
  components: Object.freeze([ComponentType.Transform, ComponentType.Geometry, ComponentType.Material, ComponentType.Camera, ComponentType.Animation, ComponentType.Animator, ComponentType.Interactive]),
  interaction: true, requiresDOM: false,
});

function toCssColor(color: ColorRGB | undefined, defaultColor: string): string {
  if (!color) return defaultColor;
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

/**
 * Find the first node with a Camera component in the scene.
 */
function findCameraNode(scene: Scene): Node | null {
  let result: Node | null = null;
  scene.traverse((node) => {
    if (!result && node.hasComponent(ComponentType.Camera)) {
      result = node;
    }
  });
  return result;
}

/**
 * Compute a viewBox string from an orthographic camera.
 * The camera's world-space position offsets the view.
 */
function orthoViewBox(cam: OrthographicCameraDef, camNode: Node): string {
  const pos = camNode.transform.worldMatrix;
  // Camera looks "down" the Z axis; X/Y translation shifts the view.
  const tx = pos[12]; // worldMatrix column-major: e = m[12], f = m[13]
  const ty = pos[13];

  const minX = cam.left + tx;
  const minY = cam.top + ty;  // SVG Y-down; top is the smaller Y value
  const w = cam.right - cam.left;
  const h = cam.bottom - cam.top;
  return `${minX} ${minY} ${w} ${h}`;
}

/**
 * Extract a 2D affine transform `matrix(a,b,c,d,e,f)` from a column-major 4ÁE matrix.
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

// ─── Defs Helpers (Gradients, Filters, ClipPaths, Masks) ────

/**
 * Helper to convert Path2DCommand[] to an SVG `d` attribute string.
 */
function pathToD(path: { command: string; args: number[] }[]): string {
  return path.map(cmd => `${cmd.command} ${cmd.args.join(' ')}`).join(' ');
}

/**
 * A collector that accumulates `<defs>` definitions (gradients, filters,
 * clip-paths, masks) during rendering and generates a `<defs>` block.
 * Each definition is deduplicated by reference identity.
 */
class GradientCollector {
  private counter = 0;
  private map = new Map<GradientDef, string>(); // gradient def ↁEid
  private filterMap = new Map<SvgFilterDef, string>();
  private clipPathMap = new Map<SvgClipPathDef, string>();
  private maskMap = new Map<SvgMaskDef, string>();
  constructor(private readonly prefix = 'oroya') {}

  /** Register a gradient and return its SVG url reference (e.g. "url(#grad-0)"). */
  register(def: GradientDef): string {
    let id = this.map.get(def);
    if (!id) {
      id = `${this.prefix}-grad-${this.counter++}`;
      this.map.set(def, id);
    }
    return `url(#${id})`;
  }

  /** Register a filter and return its SVG url reference. */
  registerFilter(def: SvgFilterDef): string {
    let id = this.filterMap.get(def);
    if (!id) {
      id = `${this.prefix}-filter-${this.counter++}`;
      this.filterMap.set(def, id);
    }
    return `url(#${id})`;
  }

  /** Register a clip-path and return its SVG url reference. */
  registerClipPath(def: SvgClipPathDef): string {
    let id = this.clipPathMap.get(def);
    if (!id) {
      id = `${this.prefix}-clip-${this.counter++}`;
      this.clipPathMap.set(def, id);
    }
    return `url(#${id})`;
  }

  /** Register a mask and return its SVG url reference. */
  registerMask(def: SvgMaskDef): string {
    let id = this.maskMap.get(def);
    if (!id) {
      id = `${this.prefix}-mask-${this.counter++}`;
      this.maskMap.set(def, id);
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

  /** Whether any definitions have been registered. */
  get isEmpty(): boolean {
    return this.map.size === 0 && this.filterMap.size === 0 &&
      this.clipPathMap.size === 0 && this.maskMap.size === 0;
  }

  /** Generate the `<defs>…</defs>` string. Returns empty string if no defs. */
  toDefsString(indent: string = '  '): string {
    if (this.isEmpty) return '';

    const entries: string[] = [];

    // Gradients
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

    // Filters
    for (const [def, id] of this.filterMap) {
      const effects = def.effects.map(e => {
        if (e.type === 'blur') {
          return `<feGaussianBlur stdDeviation="${e.stdDeviation}" />`;
        } else {
          // dropShadow
          const color = e.floodColor ? toCssColor(e.floodColor, 'black') : 'black';
          const opacity = e.floodOpacity ?? 1;
          return `<feDropShadow dx="${e.dx}" dy="${e.dy}" stdDeviation="${e.stdDeviation}" flood-color="${color}" flood-opacity="${opacity}" />`;
        }
      }).join('');
      entries.push(`${indent}  <filter id="${id}">${effects}</filter>`);
    }

    // ClipPaths
    for (const [def, id] of this.clipPathMap) {
      const d = pathToD(def.path);
      entries.push(`${indent}  <clipPath id="${id}"><path d="${d}" /></clipPath>`);
    }

    // Masks
    for (const [def, id] of this.maskMap) {
      const d = pathToD(def.path);
      const fill = def.fill ? toCssColor(def.fill, 'white') : 'white';
      const opacity = def.opacity !== undefined ? ` opacity="${def.opacity}"` : '';
      entries.push(`${indent}  <mask id="${id}"><path d="${d}" fill="${fill}"${opacity} /></mask>`);
    }

    return [`${indent}<defs>`, ...entries, `${indent}</defs>`].join('\n');
  }

  /** Build DOM `<defs>` element, returns null if no definitions. */
  toDefsDom(NS: string): SVGDefsElement | null {
    if (this.isEmpty) return null;

    const defs = document.createElementNS(NS, 'defs') as SVGDefsElement;

    // Gradients
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

    // Filters
    for (const [def, id] of this.filterMap) {
      const filterEl = document.createElementNS(NS, 'filter');
      filterEl.setAttribute('id', id);
      for (const e of def.effects) {
        if (e.type === 'blur') {
          const fe = document.createElementNS(NS, 'feGaussianBlur');
          fe.setAttribute('stdDeviation', String(e.stdDeviation));
          filterEl.appendChild(fe);
        } else {
          const fe = document.createElementNS(NS, 'feDropShadow');
          fe.setAttribute('dx', String(e.dx));
          fe.setAttribute('dy', String(e.dy));
          fe.setAttribute('stdDeviation', String(e.stdDeviation));
          fe.setAttribute('flood-color', e.floodColor ? toCssColor(e.floodColor, 'black') : 'black');
          fe.setAttribute('flood-opacity', String(e.floodOpacity ?? 1));
          filterEl.appendChild(fe);
        }
      }
      defs.appendChild(filterEl);
    }

    // ClipPaths
    for (const [def, id] of this.clipPathMap) {
      const clipEl = document.createElementNS(NS, 'clipPath');
      clipEl.setAttribute('id', id);
      const pathEl = document.createElementNS(NS, 'path') as SVGElement;
      pathEl.setAttribute('d', pathToD(def.path));
      clipEl.appendChild(pathEl);
      defs.appendChild(clipEl);
    }

    // Masks
    for (const [def, id] of this.maskMap) {
      const maskEl = document.createElementNS(NS, 'mask');
      maskEl.setAttribute('id', id);
      const pathEl = document.createElementNS(NS, 'path') as SVGElement;
      pathEl.setAttribute('d', pathToD(def.path));
      pathEl.setAttribute('fill', def.fill ? toCssColor(def.fill, 'white') : 'white');
      if (def.opacity !== undefined) pathEl.setAttribute('opacity', String(def.opacity));
      maskEl.appendChild(pathEl);
      defs.appendChild(maskEl);
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

  if (mat?.definition.filter && gradients) {
    attrs.push(`filter="${gradients.registerFilter(mat.definition.filter)}"`);
  }
  if (mat?.definition.clipPath && gradients) {
    attrs.push(`clip-path="${gradients.registerClipPath(mat.definition.clipPath)}"`);
  }
  if (mat?.definition.mask && gradients) {
    attrs.push(`mask="${gradients.registerMask(mat.definition.mask)}"`);
  }

  return attrs.join(' ');
}

/**
 * Apply fill/stroke/opacity/filter/clipPath/mask attributes from a Material to a DOM element.
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

  if (mat?.definition.filter && gradients) {
    el.setAttribute('filter', gradients.registerFilter(mat.definition.filter));
  }
  if (mat?.definition.clipPath && gradients) {
    el.setAttribute('clip-path', gradients.registerClipPath(mat.definition.clipPath));
  }
  if (mat?.definition.mask && gradients) {
    el.setAttribute('mask', gradients.registerMask(mat.definition.mask));
  }
}

// ─── Animation Helpers ──────────────────────────────────────

/**
 * Build common animation attributes string.
 */
function animAttrs(a: SvgAnimateDef | SvgAnimateTransformDef): string {
  const parts: string[] = [];
  if (a.from !== undefined) parts.push(`from="${a.from}"`);
  if (a.to !== undefined) parts.push(`to="${a.to}"`);
  if (a.values !== undefined) parts.push(`values="${a.values}"`);
  parts.push(`dur="${a.dur}"`);
  if (a.repeatCount !== undefined) parts.push(`repeatCount="${a.repeatCount}"`);
  if (a.begin !== undefined) parts.push(`begin="${a.begin}"`);
  if (a.fill !== undefined) parts.push(`fill="${a.fill}"`);
  return parts.join(' ');
}

/**
 * Generate `<animate>` / `<animateTransform>` child strings for a node.
 * Returns empty string if the node has no Animation component.
 */
function animationChildrenToString(node: Node): string {
  const anim = node.getComponent<Animation>(ComponentType.Animation);
  if (!anim || anim.animations.length === 0) return '';

  return anim.animations.map(a => {
    if (a.type === 'animate') {
      const d = a as SvgAnimateDef;
      const extra: string[] = [];
      if (d.keyTimes !== undefined) extra.push(`keyTimes="${d.keyTimes}"`);
      if (d.keySplines !== undefined) extra.push(`keySplines="${d.keySplines}"`);
      if (d.calcMode !== undefined) extra.push(`calcMode="${d.calcMode}"`);
      return `<animate attributeName="${d.attributeName}" ${animAttrs(d)}${extra.length ? ' ' + extra.join(' ') : ''} />`;
    } else {
      const d = a as SvgAnimateTransformDef;
      const extra: string[] = [];
      if (d.additive !== undefined) extra.push(`additive="${d.additive}"`);
      return `<animateTransform attributeName="transform" type="${d.transformType}" ${animAttrs(d)}${extra.length ? ' ' + extra.join(' ') : ''} />`;
    }
  }).join('');
}

/**
 * Attach `<animate>` / `<animateTransform>` DOM children to a geometry element.
 */
function attachAnimationDom(el: SVGElement, node: Node, NS: string): void {
  const anim = node.getComponent<Animation>(ComponentType.Animation);
  if (!anim || anim.animations.length === 0) return;

  for (const a of anim.animations) {
    if (a.type === 'animate') {
      const d = a as SvgAnimateDef;
      const animEl = document.createElementNS(NS, 'animate');
      animEl.setAttribute('attributeName', d.attributeName);
      if (d.from !== undefined) animEl.setAttribute('from', d.from);
      if (d.to !== undefined) animEl.setAttribute('to', d.to);
      if (d.values !== undefined) animEl.setAttribute('values', d.values);
      animEl.setAttribute('dur', d.dur);
      if (d.repeatCount !== undefined) animEl.setAttribute('repeatCount', d.repeatCount);
      if (d.begin !== undefined) animEl.setAttribute('begin', d.begin);
      if (d.fill !== undefined) animEl.setAttribute('fill', d.fill);
      if (d.keyTimes !== undefined) animEl.setAttribute('keyTimes', d.keyTimes);
      if (d.keySplines !== undefined) animEl.setAttribute('keySplines', d.keySplines);
      if (d.calcMode !== undefined) animEl.setAttribute('calcMode', d.calcMode);
      el.appendChild(animEl);
    } else {
      const d = a as SvgAnimateTransformDef;
      const animEl = document.createElementNS(NS, 'animateTransform');
      animEl.setAttribute('attributeName', 'transform');
      animEl.setAttribute('type', d.transformType);
      if (d.from !== undefined) animEl.setAttribute('from', d.from);
      if (d.to !== undefined) animEl.setAttribute('to', d.to);
      if (d.values !== undefined) animEl.setAttribute('values', d.values);
      animEl.setAttribute('dur', d.dur);
      if (d.repeatCount !== undefined) animEl.setAttribute('repeatCount', d.repeatCount);
      if (d.begin !== undefined) animEl.setAttribute('begin', d.begin);
      if (d.fill !== undefined) animEl.setAttribute('fill', d.fill);
      if (d.additive !== undefined) animEl.setAttribute('additive', d.additive);
      el.appendChild(animEl);
    }
  }
}

// ─── String-based SVG Renderer ──────────────────────────────

/**
 * Render a geometry definition to an SVG element string (without transform).
 * When the node has an Animation component, animation children are nested
 * inside the element (making it non-self-closing).
 * Returns `null` if the geometry type is not supported by SVG.
 */
function geometryToSvgString(geo: Geometry, mat: Material | undefined, gradients: GradientCollector, node: Node): string | null {
  const style = buildStyleAttrs(mat, gradients);
  const animStr = animationChildrenToString(node);

  // Helper: wrap a self-closing tag to include animation children if needed
  const wrapTag = (tag: string, attrs: string, selfClose: boolean, content?: string): string => {
    if (animStr) {
      return `<${tag} ${attrs}>${content ?? ''}${animStr}</${tag}>`;
    }
    if (content !== undefined) {
      return `<${tag} ${attrs}>${content}</${tag}>`;
    }
    return selfClose ? `<${tag} ${attrs} />` : `<${tag} ${attrs}></${tag}>`;
  };

  switch (geo.definition.type) {
    case GeometryPrimitive.Path2D: {
      const pathDef = geo.definition as Path2DGeometryDef;
      const d = pathDef.path
        .map(cmd => `${cmd.command} ${cmd.args.join(' ')}`)
        .join(' ');
      return wrapTag('path', `d="${d}" ${style}`, true);
    }

    case GeometryPrimitive.Box: {
      const boxDef = geo.definition as BoxGeometryDef;
      const x = -boxDef.width / 2;
      const y = -boxDef.height / 2;
      return wrapTag('rect', `x="${x}" y="${y}" width="${boxDef.width}" height="${boxDef.height}" ${style}`, true);
    }

    case GeometryPrimitive.Sphere: {
      const sphereDef = geo.definition as SphereGeometryDef;
      return wrapTag('circle', `cx="0" cy="0" r="${sphereDef.radius}" ${style}`, true);
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
      return wrapTag('text', `font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" ${style}`, false, escaped);
    }

    case GeometryPrimitive.Cylinder: {
      const cylDef = geo.definition as CylinderGeometryDef;
      const radiusTop = cylDef.radiusTop ?? 1;
      const radiusBottom = cylDef.radiusBottom ?? 1;
      const height = cylDef.height;

      // Project as side view: rectangle with ellipses at top/bottom
      const maxRadius = Math.max(radiusTop, radiusBottom);
      const width = maxRadius * 2;
      const x = -maxRadius;
      const y = -height / 2;

      // For simplicity, render as a rectangle (side view projection)
      return wrapTag('rect', `x="${x}" y="${y}" width="${width}" height="${height}" ${style}`, true);
    }

    case GeometryPrimitive.Plane: {
      const planeDef = geo.definition as PlaneGeometryDef;
      const x = -planeDef.width / 2;
      const y = -planeDef.height / 2;
      return wrapTag('rect', `x="${x}" y="${y}" width="${planeDef.width}" height="${planeDef.height}" ${style}`, true);
    }

    case GeometryPrimitive.Cone: {
      const coneDef = geo.definition as ConeGeometryDef;
      const { radius, height } = coneDef;
      const halfHeight = height / 2;

      // Project as triangle (side view)
      const points = `0,${-halfHeight} ${-radius},${halfHeight} ${radius},${halfHeight}`;
      return wrapTag('polygon', `points="${points}" ${style}`, true);
    }

    case GeometryPrimitive.Torus: {
      const torusDef = geo.definition as TorusGeometryDef;
      const { radius, tube } = torusDef;

      // Project as annulus (ring) - use SVG circle with stroke
      // For a true annulus, we'd need a path, but a thick-stroked circle approximates it
      return wrapTag('circle', `cx="0" cy="0" r="${radius}" stroke-width="${tube * 2}" ${style}`, true);
    }

    case GeometryPrimitive.Circle: {
      const circleDef = geo.definition as CircleGeometryDef;
      const { radius, thetaStart, thetaLength } = circleDef;
      const fullCircle = !thetaStart && (!thetaLength || thetaLength >= Math.PI * 2);

      if (fullCircle) {
        // Full circle
        return wrapTag('circle', `cx="0" cy="0" r="${radius}" ${style}`, true);
      } else {
        // Partial circle - render as path with arc
        const start = thetaStart ?? 0;
        const length = thetaLength ?? Math.PI * 2;
        const end = start + length;

        const x1 = Math.cos(start) * radius;
        const y1 = Math.sin(start) * radius;
        const x2 = Math.cos(end) * radius;
        const y2 = Math.sin(end) * radius;

        const largeArc = length > Math.PI ? 1 : 0;
        const d = `M 0,0 L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
        return wrapTag('path', `d="${d}" ${style}`, true);
      }
    }

    default:
      return null;
  }
}

/**
 * Build CSS class="" and id="" attribute string fragments for a node.
 */
function buildCssAttrs(node: Node): string {
  const parts: string[] = [];
  if (node.cssId) parts.push(`id="${node.cssId}"`);
  if (node.cssClass) parts.push(`class="${node.cssClass}"`);
  return parts.length ? ' ' + parts.join(' ') : '';
}

/**
 * Apply cssClass and cssId attributes to a DOM element from a node.
 */
function applyCssAttrs(el: SVGElement, node: Node): void {
  if (node.cssId) el.setAttribute('id', node.cssId);
  if (node.cssClass) el.setAttribute('class', node.cssClass);
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
  const geoString = geo ? geometryToSvgString(geo, mat, gradients, node) : null;
  const transformStr = matrix4ToSvgTransform(node.transform.localMatrix);
  const transformAttr = transformStr ? ` transform="${transformStr}"` : '';
  const cssAttrs = buildCssAttrs(node);

  // Leaf node with geometry, no children
  if (geoString && !hasChildren) {
    if (transformAttr) {
      return `${indent}<g${transformAttr}${cssAttrs}>\n${indent}  ${geoString}\n${indent}</g>`;
    }
    // Inject css attrs into the geometry tag itself
    if (cssAttrs) {
      // Insert before the closing /> or >
      const injected = geoString.replace(/(\/?>)$/, `${cssAttrs} $1`);
      return `${indent}${injected}`;
    }
    return `${indent}${geoString}`;
  }

  // Node with children (may also have geometry)
  if (hasChildren) {
    const lines: string[] = [];
    lines.push(`${indent}<g${transformAttr}${cssAttrs}>`);
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

  // Leaf node without geometry  Enothing to render
  return '';
}

/** @public */
export function renderToSVG(scene: Scene, options: SvgRenderOptions): string {
  // Advance scene logic first (Animator, custom onUpdate hooks). The SVG
  // backend is pure render so `dt` defaults to a single 60Hz tick — callers
  // driving their own loop should pass `options.dt` for accurate motion.
  if (options.advanceScene !== false) scene.update(options.dt ?? 1 / 60);
  if (options.onDiagnostic) diagnoseScene(scene, svgCapabilities).forEach(options.onDiagnostic);
  // Ensure all matrices are up-to-date before rendering.
  scene.updateWorldMatrices();

  // Compute viewBox: explicit option > orthographic camera > default
  let viewBox = options.viewBox;
  if (!viewBox) {
    const camNode = findCameraNode(scene);
    const cam = camNode?.getComponent<Camera>(ComponentType.Camera);
    if (cam && cam.definition.type === CameraType.Orthographic) {
      viewBox = orthoViewBox(cam.definition, camNode!);
    } else {
      viewBox = `0 0 ${options.width} ${options.height}`;
    }
  }

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

/** Live SVG options; this entry point requires a DOM. @public */
export interface SvgElementRenderOptions extends SvgRenderOptions {
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

    case GeometryPrimitive.Cylinder: {
      const cylDef = geo.definition as CylinderGeometryDef;
      const radiusTop = cylDef.radiusTop ?? 1;
      const radiusBottom = cylDef.radiusBottom ?? 1;
      const height = cylDef.height;
      const maxRadius = Math.max(radiusTop, radiusBottom);
      const el = document.createElementNS(NS, 'rect') as SVGElement;
      el.setAttribute('x', String(-maxRadius));
      el.setAttribute('y', String(-height / 2));
      el.setAttribute('width', String(maxRadius * 2));
      el.setAttribute('height', String(height));
      return el;
    }

    case GeometryPrimitive.Plane: {
      const planeDef = geo.definition as PlaneGeometryDef;
      const el = document.createElementNS(NS, 'rect') as SVGElement;
      el.setAttribute('x', String(-planeDef.width / 2));
      el.setAttribute('y', String(-planeDef.height / 2));
      el.setAttribute('width', String(planeDef.width));
      el.setAttribute('height', String(planeDef.height));
      return el;
    }

    case GeometryPrimitive.Cone: {
      const coneDef = geo.definition as ConeGeometryDef;
      const { radius, height } = coneDef;
      const halfHeight = height / 2;
      const el = document.createElementNS(NS, 'polygon') as SVGElement;
      const points = `0,${-halfHeight} ${-radius},${halfHeight} ${radius},${halfHeight}`;
      el.setAttribute('points', points);
      return el;
    }

    case GeometryPrimitive.Torus: {
      const torusDef = geo.definition as TorusGeometryDef;
      const { radius, tube } = torusDef;
      const el = document.createElementNS(NS, 'circle') as SVGElement;
      el.setAttribute('cx', '0');
      el.setAttribute('cy', '0');
      el.setAttribute('r', String(radius));
      el.setAttribute('stroke-width', String(tube * 2));
      return el;
    }

    case GeometryPrimitive.Circle: {
      const circleDef = geo.definition as CircleGeometryDef;
      const { radius, thetaStart, thetaLength } = circleDef;
      const fullCircle = !thetaStart && (!thetaLength || thetaLength >= Math.PI * 2);

      if (fullCircle) {
        const el = document.createElementNS(NS, 'circle') as SVGElement;
        el.setAttribute('cx', '0');
        el.setAttribute('cy', '0');
        el.setAttribute('r', String(radius));
        return el;
      } else {
        const start = thetaStart ?? 0;
        const length = thetaLength ?? Math.PI * 2;
        const end = start + length;
        const x1 = Math.cos(start) * radius;
        const y1 = Math.sin(start) * radius;
        const x2 = Math.cos(end) * radius;
        const y2 = Math.sin(end) * radius;
        const largeArc = length > Math.PI ? 1 : 0;
        const d = `M 0,0 L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
        const el = document.createElementNS(NS, 'path') as SVGElement;
        el.setAttribute('d', d);
        return el;
      }
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
    applyCssAttrs(g, node);

    if (geoEl) {
      geoEl.setAttribute('data-oroya-id', node.id);
      applyStyleAttrsToElement(geoEl, mat, gradients);
      attachAnimationDom(geoEl, node, NS);
      attachInteractiveListeners(geoEl, node, signal);
      nodeElementMap.set(node.id, geoEl);
      g.appendChild(geoEl);
    }

    for (const child of node.children) {
      renderNodeToDom(child, g, NS, nodeElementMap, signal, gradients);
    }

    parent.appendChild(g);
  } else if (geoEl) {
    // Leaf with geometry but no transform  Eappend directly
    geoEl.setAttribute('data-oroya-id', node.id);
    applyCssAttrs(geoEl, node);
    applyStyleAttrsToElement(geoEl, mat, gradients);
    attachAnimationDom(geoEl, node, NS);
    attachInteractiveListeners(geoEl, node, signal);
    nodeElementMap.set(node.id, geoEl);
    parent.appendChild(geoEl);
  }
  // else: leaf without geometry  Eskip
}

/**
 * Render the scene as a real SVG DOM element with interactive event delegation.
 *
 * The scene-graph hierarchy is preserved using `<g>` elements. Each node's
 * `localMatrix` is applied as a `transform="matrix(...)"` attribute so that
 * transforms compose naturally through SVG nesting.
 *
 * Supported geometries:
 * - **Path2D** ↁE`<path>`
 * - **Box** ↁE`<rect>` (width ÁEheight, depth ignored)
 * - **Sphere** ↁE`<circle>` (radius)
 * - **Text** ↁE`<text>`
 *
 * Gradients defined in `MaterialDef.fillGradient` / `strokeGradient` are
 * automatically collected and emitted as `<defs>` in the SVG.
 *
 * Interactive nodes (those with an `Interactive` component) receive pointer/click
 * event listeners that dispatch `InteractionEvent`s through the Oroya scene graph.
 *
 * @returns An object containing the SVG element and a `dispose()` function to clean up listeners.
 */
// `renderToSVGElement` mirrors `renderToSVG` but emits a live DOM element;
// it shares the same `scene.update(dt)` semantics.
/** @public */
export function renderToSVGElement(
  scene: Scene,
  options: SvgElementRenderOptions,
): { svg: SVGSVGElement; dispose: () => void } {
  // See `renderToSVG` for the rationale behind running scene logic first.
  if (options.advanceScene !== false) scene.update(options.dt ?? 1 / 60);
  if (options.onDiagnostic) diagnoseScene(scene, svgCapabilities).forEach(options.onDiagnostic);
  scene.updateWorldMatrices();

  const NS = 'http://www.w3.org/2000/svg';

  // Compute viewBox: explicit option > orthographic camera > default
  let viewBox = options.viewBox;
  if (!viewBox) {
    const camNode = findCameraNode(scene);
    const cam = camNode?.getComponent<Camera>(ComponentType.Camera);
    if (cam && cam.definition.type === CameraType.Orthographic) {
      viewBox = orthoViewBox(cam.definition, camNode!);
    } else {
      viewBox = `0 0 ${options.width} ${options.height}`;
    }
  }

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

/** Options for a persistent, DOM-owned SVG renderer. @public */
export interface SvgRendererOptions extends Omit<SvgElementRenderOptions, 'dt' | 'advanceScene'> {
  /** Accessible scene title. Defaults to "Oroya Animate scene". */
  title?: string;
  /** Static explanation; applications should announce step changes outside the SVG. */
  description?: string;
}

interface SvgNodeBinding {
  node: Node;
  group: SVGElement;
  shape?: SVGElement;
  geometryKey?: string;
  geometryAttributes: Map<string, string>;
  styleKey?: string;
  animationKey?: string;
}

const liveSvgStyleAttributes = ['fill', 'stroke', 'stroke-width', 'opacity', 'filter', 'clip-path', 'mask'];

function setSvgAttribute(element: SVGElement, name: string, value: string | undefined): void {
  if (value === undefined || value === '') {
    if (element.hasAttribute(name)) element.removeAttribute(name);
  } else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/**
 * Persistent SVG scene renderer. Keeps the SVG root, node groups and unchanged
 * geometry elements across frames; reconciles structural edits by node ID.
 *
 * Does not own a RAF loop. Drive `render(dt)` from one application clock, or use
 * `render(0, { advanceScene: false })` after seeking an AnimationMixer. Existing
 * renderToSVG/renderToSVGElement remain snapshot/export APIs.
 * @public
 */
export class SvgRenderer {
  readonly svg: SVGSVGElement;
  readonly capabilities: RendererCapabilities = Object.freeze({ ...svgCapabilities, requiresDOM: true });
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly prefix = `oroya-${new Node('svg-resource-scope').id}`;
  private readonly bindings = new Map<string, SvgNodeBinding>();
  private readonly ownedAnimators = new Set<Animator>();
  private readonly listenerCleanups: (() => void)[] = [];
  private scene: Scene | null = null;
  private disposed = false;
  private defs?: SVGDefsElement;
  private defsKey = '';
  private width: number;
  private height: number;
  private viewBox?: string;
  private readonly titleElement: SVGElement;
  private readonly descriptionElement: SVGElement;

  constructor(private readonly options: SvgRendererOptions) {
    this.validateSize(options.width, options.height);
    if (options.viewBox !== undefined) this.validateViewBox(options.viewBox);
    this.width = options.width;
    this.height = options.height;
    this.viewBox = options.viewBox;
    this.svg = document.createElementNS(this.namespace, 'svg');
    this.svg.setAttribute('xmlns', this.namespace);
    this.svg.setAttribute('role', 'img');
    this.titleElement = document.createElementNS(this.namespace, 'title');
    this.descriptionElement = document.createElementNS(this.namespace, 'desc');
    this.titleElement.id = `${this.prefix}-title`;
    this.descriptionElement.id = `${this.prefix}-description`;
    this.svg.append(this.titleElement, this.descriptionElement);
    this.setAccessibleDescription(options.title ?? 'Oroya Animate scene', options.description ?? '');
    this.updateViewport();
    this.installInteractionListeners();
    options.container?.appendChild(this.svg);
  }

  /** Attach a scene without advancing its simulation clock. */
  mount(scene: Scene): void {
    this.assertActive();
    if (this.scene !== scene) {
      this.releaseAnimators();
      for (const binding of this.bindings.values()) binding.group.remove();
      this.bindings.clear();
      this.scene = scene;
    }
    this.render(0, { advanceScene: false });
  }

  /** Draw one frame. Material/text edits are sampled as well as transforms. */
  render(dt = 1 / 60, options: RenderOptions = {}): void {
    this.assertActive();
    if (!this.scene) throw new Error('SvgRenderer.render() requires mount(scene).');
    if (!Number.isFinite(dt) || dt < 0) throw new Error('SVG frame delta must be finite and non-negative.');
    this.reconcileAnimators();
    if (options.advanceScene !== false) this.scene.update(dt);
    const diagnostic = options.onDiagnostic ?? this.options.onDiagnostic;
    if (diagnostic) diagnoseScene(this.scene, this.capabilities).forEach(diagnostic);
    this.scene.updateWorldMatrices();
    this.updateViewport();
    const gradients = new GradientCollector(this.prefix);
    const seen = new Set<string>();
    const root = this.reconcileNode(this.scene.root, gradients, seen);
    if (root.parentNode !== this.svg) this.svg.appendChild(root);
    for (const [id, binding] of this.bindings) {
      if (!seen.has(id)) { binding.group.remove(); this.bindings.delete(id); }
    }
    const defsKey = gradients.toDefsString('');
    if (defsKey !== this.defsKey) {
      const next = gradients.toDefsDom(this.namespace);
      this.defs?.remove();
      this.defs = next ?? undefined;
      if (next) this.svg.insertBefore(next, root);
      this.defsKey = defsKey;
    }
  }

  /** Stable group for annotations such as tabindex, role and aria-label. */
  getNodeElement(id: string): SVGElement | undefined {
    return this.bindings.get(id)?.group;
  }

  /** Change dimensions; an explicit viewBox remains independent of display size. */
  setSize(width: number, height: number): void {
    this.assertActive();
    this.validateSize(width, height);
    this.width = width; this.height = height;
    this.updateViewport();
  }

  /** Set an explicit viewBox, or return to camera/default framing with undefined. */
  setViewBox(viewBox?: string): void {
    this.assertActive();
    if (viewBox !== undefined) this.validateViewBox(viewBox);
    this.viewBox = viewBox;
    this.updateViewport();
  }

  /** Set safe text metadata without interpreting markup. */
  setAccessibleDescription(title: string, description = ''): void {
    this.assertActive();
    if (this.titleElement.textContent !== title) this.titleElement.textContent = title;
    if (this.descriptionElement.textContent !== description) this.descriptionElement.textContent = description;
    this.svg.setAttribute('aria-labelledby', this.titleElement.id);
    setSvgAttribute(this.svg, 'aria-describedby', description ? this.descriptionElement.id : undefined);
  }

  /** Release only renderer-owned bindings/listeners/DOM. Safe to call repeatedly. */
  dispose(): void {
    if (this.disposed) return;
    this.releaseAnimators();
    this.listenerCleanups.forEach(cleanup => cleanup());
    this.listenerCleanups.length = 0;
    this.bindings.clear();
    this.svg.remove();
    this.svg.replaceChildren();
    this.defs = undefined;
    this.scene = null;
    this.disposed = true;
  }

  private reconcileNode(node: Node, gradients: GradientCollector, seen: Set<string>): SVGElement {
    seen.add(node.id);
    let binding = this.bindings.get(node.id);
    if (!binding) {
      binding = { node, group: document.createElementNS(this.namespace, 'g'), geometryAttributes: new Map() };
      binding.group.setAttribute('data-oroya-node', node.id);
      this.bindings.set(node.id, binding);
    }
    binding.node = node;
    setSvgAttribute(binding.group, 'transform', matrix4ToSvgTransform(node.transform.localMatrix));
    setSvgAttribute(binding.group, 'id', node.cssId);
    setSvgAttribute(binding.group, 'class', node.cssClass);
    const interactive = node.getComponent<Interactive>(ComponentType.Interactive);
    const cursor = interactive?.definition.enabled ? interactive.definition.cursor : '';
    if (binding.group.style.cursor !== cursor) binding.group.style.cursor = cursor;
    const geometry = node.getComponent<Geometry>(ComponentType.Geometry);
    const geometryKey = geometry ? JSON.stringify(geometry.definition) : undefined;
    let geometryChanged = false;
    if (geometryKey !== binding.geometryKey) {
      const candidate = geometry ? geometryToDomElement(geometry, this.namespace) : null;
      if (!candidate) {
        binding.shape?.remove(); binding.shape = undefined;
        binding.geometryAttributes.clear();
      } else if (binding.shape?.tagName !== candidate.tagName) {
        binding.shape?.remove(); binding.shape = candidate;
        candidate.setAttribute('data-oroya-id', node.id);
        binding.group.insertBefore(candidate, binding.group.firstChild);
        binding.animationKey = undefined;
        binding.geometryAttributes = new Map(Array.from(candidate.attributes, attribute => [attribute.name, attribute.value]));
      } else {
        const attributes = new Map(Array.from(candidate.attributes, attribute => [attribute.name, attribute.value]));
        for (const name of binding.geometryAttributes.keys()) if (!attributes.has(name)) binding.shape.removeAttribute(name);
        for (const [name, value] of attributes) setSvgAttribute(binding.shape, name, value);
        binding.geometryAttributes = attributes;
        if (candidate.tagName === 'text') {
          const text = binding.shape.firstChild;
          if (text?.nodeType === 3) text.nodeValue = candidate.textContent;
          else binding.shape.insertBefore(document.createTextNode(candidate.textContent ?? ''), binding.shape.firstChild);
        }
      }
      binding.geometryKey = geometryKey;
      geometryChanged = true;
    }
    if (binding.shape) {
      const material = node.getComponent<Material>(ComponentType.Material);
      const styleKey = buildStyleAttrs(material, gradients);
      if (geometryChanged || styleKey !== binding.styleKey) {
        for (const name of liveSvgStyleAttributes) setSvgAttribute(binding.shape, name, binding.geometryAttributes.get(name));
        applyStyleAttrsToElement(binding.shape, material, gradients);
        binding.styleKey = styleKey;
      }
      const animationKey = JSON.stringify(node.getComponent<Animation>(ComponentType.Animation)?.animations);
      if (animationKey !== binding.animationKey) {
        for (const child of Array.from(binding.shape.children)) if (child.tagName === 'animate' || child.tagName === 'animateTransform') child.remove();
        attachAnimationDom(binding.shape, node, this.namespace);
        binding.animationKey = animationKey;
      }
    }
    let next: ChildNode | null = binding.shape ? binding.shape.nextSibling : binding.group.firstChild;
    for (const child of node.children) {
      const group = this.reconcileNode(child, gradients, seen);
      if (group !== next) binding.group.insertBefore(group, next);
      next = group.nextSibling;
    }
    return binding.group;
  }

  private reconcileAnimators(): void {
    const current = new Set<Animator>();
    this.scene?.traverse(node => {
      const animator = node.getComponent<Animator>(ComponentType.Animator);
      if (!animator) return;
      current.add(animator);
      if (!animator.currentMixer) { animator.bindToScene(this.scene!); this.ownedAnimators.add(animator); }
    });
    for (const animator of this.ownedAnimators) if (!current.has(animator)) {
      animator.unbindFromScene(); this.ownedAnimators.delete(animator);
    }
  }

  private releaseAnimators(): void {
    this.ownedAnimators.forEach(animator => animator.unbindFromScene());
    this.ownedAnimators.clear();
  }

  private installInteractionListeners(): void {
    const events: [string, InteractionEventType][] = [
      ['click', InteractionEventType.Click], ['pointerdown', InteractionEventType.PointerDown],
      ['pointerup', InteractionEventType.PointerUp], ['pointermove', InteractionEventType.PointerMove],
      ['pointerover', InteractionEventType.PointerEnter], ['pointerout', InteractionEventType.PointerLeave],
      ['wheel', InteractionEventType.Wheel],
    ];
    for (const [name, type] of events) {
      const listener = (event: Event) => {
        let element = event.target as Element | null;
        while (element && element !== this.svg && typeof element.getAttribute === 'function') {
          const id = element.getAttribute('data-oroya-node');
          const binding = id ? this.bindings.get(id) : undefined;
          const interactive = binding?.node.getComponent<Interactive>(ComponentType.Interactive);
          if (binding && interactive?.definition.enabled) {
            const pointer = event as PointerEvent;
            if ((name === 'pointerover' || name === 'pointerout') && pointer.relatedTarget &&
              binding.group.contains(pointer.relatedTarget as globalThis.Node)) return;
            binding.node.dispatchInteraction(createInteractionEvent(type, binding.node, event,
              { x: pointer.clientX ?? 0, y: pointer.clientY ?? 0 }));
            return;
          }
          element = element.parentElement;
        }
      };
      this.svg.addEventListener(name, listener, { passive: name === 'wheel' });
      this.listenerCleanups.push(() => this.svg.removeEventListener(name, listener));
    }
  }

  private updateViewport(): void {
    setSvgAttribute(this.svg, 'width', String(this.width));
    setSvgAttribute(this.svg, 'height', String(this.height));
    let viewBox = this.viewBox;
    if (!viewBox && this.scene) {
      const cameraNode = findCameraNode(this.scene);
      const camera = cameraNode?.getComponent<Camera>(ComponentType.Camera);
      if (cameraNode && camera?.definition.type === CameraType.Orthographic) viewBox = orthoViewBox(camera.definition, cameraNode);
    }
    setSvgAttribute(this.svg, 'viewBox', viewBox ?? `0 0 ${this.width} ${this.height}`);
  }

  private validateSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('SVG dimensions must be positive finite numbers.');
  }

  private validateViewBox(value: string): void {
    const parts = value.trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || !parts.every(Number.isFinite) || parts[2] <= 0 || parts[3] <= 0) throw new Error('SVG viewBox must have four finite values and positive dimensions.');
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('SvgRenderer has been disposed.');
  }
}

