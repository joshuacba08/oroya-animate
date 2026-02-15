import {
  Scene,
  Node,
  ComponentType,
  Geometry,
  Material,
  GeometryPrimitive,
  Path2DGeometryDef,
  ColorRGB,
  Interactive,
  InteractionEventType,
  createInteractionEvent,
} from '@oroya/core';

interface SvgRenderOptions {
  width: number;
  height: number;
  viewBox?: string;
}

function toCssColor(color: ColorRGB | undefined, defaultColor: string): string {
  if (!color) return defaultColor;
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

export function renderToSVG(scene: Scene, options: SvgRenderOptions): string {
  const paths: string[] = [];

  scene.traverse((node: Node) => {
    const geo = node.getComponent<Geometry>(ComponentType.Geometry);
    if (!geo || geo.definition.type !== GeometryPrimitive.Path2D) {
      return;
    }

    const mat = node.getComponent<Material>(ComponentType.Material);
    const pathDef = geo.definition as Path2DGeometryDef;

    const d = pathDef.path
      .map(cmd => `${cmd.command} ${cmd.args.join(' ')}`)
      .join(' ');

    const style: Record<string, string | number> = {};
    if (mat?.definition.fill) {
      style['fill'] = toCssColor(mat.definition.fill, 'none');
    } else {
      style['fill'] = 'none';
    }

    if (mat?.definition.stroke) {
      style['stroke'] = toCssColor(mat.definition.stroke, 'black');
      style['stroke-width'] = mat.definition.strokeWidth ?? 1;
    }

    const styleString = Object.entries(style)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    paths.push(`<path d="${d}" ${styleString} />`);
  });

  const viewBox = options.viewBox ?? `0 0 ${options.width} ${options.height}`;

  return `
    <svg width="${options.width}" height="${options.height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
      ${paths.join('\n      ')}
    </svg>
  `.trim();
}

// ─── Interactive SVG (DOM mode) ─────────────────────────────

interface SvgElementRenderOptions extends SvgRenderOptions {
  /** Target container to append the SVG element to. */
  container?: HTMLElement;
}

/**
 * Render the scene as a real SVG DOM element with interactive event delegation.
 *
 * Each renderable node gets a `<path>` element with a `data-oroya-id` attribute.
 * Interactive nodes (those with an `Interactive` component) receive pointer/click
 * event listeners that dispatch `InteractionEvent`s through the Oroya scene graph.
 *
 * @returns An object containing the SVG element and a `dispose()` function to clean up listeners.
 */
export function renderToSVGElement(
  scene: Scene,
  options: SvgElementRenderOptions,
): { svg: SVGSVGElement; dispose: () => void } {
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

  scene.traverse((node: Node) => {
    const geo = node.getComponent<Geometry>(ComponentType.Geometry);
    if (!geo || geo.definition.type !== GeometryPrimitive.Path2D) return;

    const mat = node.getComponent<Material>(ComponentType.Material);
    const pathDef = geo.definition as Path2DGeometryDef;

    const d = pathDef.path
      .map(cmd => `${cmd.command} ${cmd.args.join(' ')}`)
      .join(' ');

    const pathEl = document.createElementNS(NS, 'path');
    pathEl.setAttribute('d', d);
    pathEl.setAttribute('data-oroya-id', node.id);

    // Fill & stroke
    if (mat?.definition.fill) {
      pathEl.setAttribute('fill', toCssColor(mat.definition.fill, 'none'));
    } else {
      pathEl.setAttribute('fill', 'none');
    }
    if (mat?.definition.stroke) {
      pathEl.setAttribute('stroke', toCssColor(mat.definition.stroke, 'black'));
      pathEl.setAttribute('stroke-width', String(mat.definition.strokeWidth ?? 1));
    }

    // Interactive event delegation
    if (node.hasComponent(ComponentType.Interactive)) {
      const interactive = node.getComponent<Interactive>(ComponentType.Interactive)!;
      if (interactive.definition.enabled) {
        pathEl.style.cursor = interactive.definition.cursor;

        const dispatch = (type: InteractionEventType, e: Event) => {
          const pointerEvent = e as PointerEvent;
          const event = createInteractionEvent(
            type, node, e,
            { x: pointerEvent.clientX, y: pointerEvent.clientY },
          );
          node.dispatchInteraction(event);
        };

        pathEl.addEventListener('click', (e) => dispatch(InteractionEventType.Click, e), { signal });
        pathEl.addEventListener('pointerdown', (e) => dispatch(InteractionEventType.PointerDown, e), { signal });
        pathEl.addEventListener('pointerup', (e) => dispatch(InteractionEventType.PointerUp, e), { signal });
        pathEl.addEventListener('pointermove', (e) => dispatch(InteractionEventType.PointerMove, e), { signal });
        pathEl.addEventListener('pointerenter', (e) => dispatch(InteractionEventType.PointerEnter, e), { signal });
        pathEl.addEventListener('pointerleave', (e) => dispatch(InteractionEventType.PointerLeave, e), { signal });
        pathEl.addEventListener('wheel', (e) => dispatch(InteractionEventType.Wheel, e), { signal, passive: true });
      }
    }

    nodeElementMap.set(node.id, pathEl);
    svg.appendChild(pathEl);
  });

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

