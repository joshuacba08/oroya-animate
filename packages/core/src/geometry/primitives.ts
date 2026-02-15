import { Geometry, BoxGeometryDef, GeometryPrimitive, Path2DGeometryDef, SphereGeometryDef } from '../components';

/**
 * Creates a new box geometry component.
 * @param width The width of the box.
 * @param height The height of the box.
 * @param depth The depth of the box.
 * @returns A new Geometry component with a box definition.
 */
export function createBox(width = 1, height = 1, depth = 1): Geometry {
  const def: BoxGeometryDef = { type: GeometryPrimitive.Box, width, height, depth };
  return new Geometry(def);
}

/**
 * Creates a new sphere geometry component.
 * @param radius The radius of the sphere.
 * @param widthSegments The number of horizontal segments.
 * @param heightSegments The number of vertical segments.
 * @returns A new Geometry component with a sphere definition.
 */
export function createSphere(radius = 0.5, widthSegments = 16, heightSegments = 16): Geometry {
  const def: SphereGeometryDef = { 
    type: GeometryPrimitive.Sphere, 
    radius, 
    widthSegments, 
    heightSegments 
  };
  return new Geometry(def);
}

/**
 * Creates a new 2D path geometry component.
 * @param path An array of path commands.
 * @returns A new Geometry component with a 2D path definition.
 */
export function createPath2D(path: Path2DGeometryDef['path']): Geometry {
    const def: Path2DGeometryDef = { type: GeometryPrimitive.Path2D, path };
    return new Geometry(def);
}


