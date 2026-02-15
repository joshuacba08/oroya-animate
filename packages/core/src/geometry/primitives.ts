import { Geometry, BoxGeometryDef, GeometryPrimitive, Path2DGeometryDef } from '../components';

export function createBox(width = 1, height = 1, depth = 1): Geometry {
  const def: BoxGeometryDef = { type: GeometryPrimitive.Box, width, height, depth };
  return new Geometry(def);
}

export function createPath2D(path: Path2DGeometryDef['path']): Geometry {
    const def: Path2DGeometryDef = { type: GeometryPrimitive.Path2D, path };
    return new Geometry(def);
}
