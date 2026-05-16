import { BoxGeometryDef, CircleGeometryDef, ConeGeometryDef, CylinderGeometryDef, Geometry, GeometryPrimitive, Path2DGeometryDef, PlaneGeometryDef, SphereGeometryDef, TextGeometryDef, TorusGeometryDef } from '../components';

export interface GeometryOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Creates a new box geometry component.
 * @param width The width of the box.
 * @param height The height of the box.
 * @param depth The depth of the box.
 * @returns A new Geometry component with a box definition.
 */
export function createBox(width = 1, height = 1, depth = 1, options?: GeometryOptions): Geometry {
  const def: BoxGeometryDef = { type: GeometryPrimitive.Box, width, height, depth, ...options };
  return new Geometry(def);
}

/**
 * Creates a new sphere geometry component.
 * @param radius The radius of the sphere.
 * @param widthSegments The number of horizontal segments.
 * @param heightSegments The number of vertical segments.
 * @returns A new Geometry component with a sphere definition.
 */
export function createSphere(radius = 0.5, widthSegments = 16, heightSegments = 16, options?: GeometryOptions): Geometry {
  const def: SphereGeometryDef = {
    type: GeometryPrimitive.Sphere,
    radius,
    widthSegments,
    heightSegments,
    ...options
  };
  return new Geometry(def);
}

/**
 * Creates a new 2D path geometry component.
 * @param path An array of path commands.
 * @returns A new Geometry component with a 2D path definition.
 */
export function createPath2D(path: Path2DGeometryDef['path'], options?: GeometryOptions): Geometry {
  const def: Path2DGeometryDef = { type: GeometryPrimitive.Path2D, path, ...options };
  return new Geometry(def);
}

/**
 * Creates a new text geometry component.
 * @param text The text content to display.
 * @param options Optional text styling (fontSize, fontFamily, fontWeight, textAnchor, dominantBaseline).
 * @returns A new Geometry component with a text definition.
 */
export function createText(
  text: string,
  options: Omit<TextGeometryDef, 'type' | 'text'> = {},
): Geometry {
  const def: TextGeometryDef = { type: GeometryPrimitive.Text, text, ...options };
  return new Geometry(def);
}

/**
 * Creates a new cylinder geometry component.
 * @param radiusTop Radius of the top of the cylinder.
 * @param radiusBottom Radius of the bottom of the cylinder.
 * @param height Height of the cylinder.
 * @param radialSegments Number of segmented faces around the circumference of the cylinder.
 * @param heightSegments Number of rows of faces along the height of the cylinder.
 * @param openEnded A boolean indicating whether the ends of the cylinder are open or capped.
 * @returns A new Geometry component with a cylinder definition.
 */
export function createCylinder(
  radiusTop = 1,
  radiusBottom = 1,
  height = 1,
  radialSegments = 32,
  heightSegments = 1,
  openEnded = false,
  options?: GeometryOptions
): Geometry {
  const def: CylinderGeometryDef = {
    type: GeometryPrimitive.Cylinder,
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    openEnded,
    ...options
  };
  return new Geometry(def);
}

/**
 * Creates a new plane geometry component.
 * @param width Width along the X axis.
 * @param height Height along the Y axis.
 * @param widthSegments Number of segments along the width.
 * @param heightSegments Number of segments along the height.
 * @returns A new Geometry component with a plane definition.
 */
export function createPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1, options?: GeometryOptions): Geometry {
  const def: PlaneGeometryDef = {
    type: GeometryPrimitive.Plane,
    width,
    height,
    widthSegments,
    heightSegments,
    ...options
  };
  return new Geometry(def);
}

/**
 * Creates a new cone geometry component.
 * @param radius Radius of the cone base.
 * @param height Height of the cone.
 * @param radialSegments Number of segmented faces around the circumference of the cone.
 * @param heightSegments Number of rows of faces along the height of the cone.
 * @param openEnded A boolean indicating whether the base of the cone is open or capped.
 * @returns A new Geometry component with a cone definition.
 */
export function createCone(
  radius = 1,
  height = 1,
  radialSegments = 32,
  heightSegments = 1,
  openEnded = false,
  options?: GeometryOptions
): Geometry {
  const def: ConeGeometryDef = {
    type: GeometryPrimitive.Cone,
    radius,
    height,
    radialSegments,
    heightSegments,
    openEnded,
    ...options
  };
  return new Geometry(def);
}

/**
 * Creates a new torus geometry component.
 * @param radius Radius of the torus, from the center of the torus to the center of the tube.
 * @param tube Radius of the tube.
 * @param radialSegments Number of segments around the tube.
 * @param tubularSegments Number of segments around the torus.
 * @param arc Central angle in radians (default `Math.PI * 2` — a full torus).
 * @returns A new Geometry component with a torus definition.
 */
export function createTorus(
  radius = 1,
  tube = 0.4,
  radialSegments = 16,
  tubularSegments = 100,
  arc: number = Math.PI * 2,
  options?: GeometryOptions,
): Geometry {
  const def: TorusGeometryDef = {
    type: GeometryPrimitive.Torus,
    radius,
    tube,
    radialSegments,
    tubularSegments,
    arc,
    ...options,
  };
  return new Geometry(def);
}

/**
 * Creates a new circle geometry component (flat disc).
 * @param radius Radius of the circle.
 * @param segments Number of segments (triangles).
 * @param thetaStart Start angle in radians.
 * @param thetaLength Central angle in radians (default `Math.PI * 2` — full circle).
 * @returns A new Geometry component with a circle definition.
 */
export function createCircle(
  radius = 1,
  segments = 32,
  thetaStart = 0,
  thetaLength: number = Math.PI * 2,
  options?: GeometryOptions,
): Geometry {
  const def: CircleGeometryDef = {
    type: GeometryPrimitive.Circle,
    radius,
    segments,
    thetaStart,
    thetaLength,
    ...options,
  };
  return new Geometry(def);
}


