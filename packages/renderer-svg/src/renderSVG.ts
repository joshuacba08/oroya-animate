import {
  Scene,
  Node,
  ComponentType,
  Geometry,
  Material,
  GeometryPrimitive,
  Path2DGeometryDef,
  ColorRGB,
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
      ${paths.join('
      ')}
    </svg>
  `.trim();
}
