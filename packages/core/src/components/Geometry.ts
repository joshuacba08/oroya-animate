import { Component, ComponentType } from './Component';
import { Matrix4 } from '../math/Matrix4';

/**
 * An enumeration of the available geometry primitive types.
 */
export enum GeometryPrimitive {
  Box = 'Box',
  Sphere = 'Sphere',
  Cylinder = 'Cylinder',
  Plane = 'Plane',
  Cone = 'Cone',
  Torus = 'Torus',
  Circle = 'Circle',
  Path2D = 'Path2D',
  Text = 'Text',
  Buffer = 'Buffer',
  CSG = 'CSG',
}

/**
 * The definition for a box geometry.
 */
export interface BoxGeometryDef {
  type: GeometryPrimitive.Box;
  width: number;
  height: number;
  depth: number;
}

/**
 * The definition for a sphere geometry.
 */
export interface SphereGeometryDef {
  type: GeometryPrimitive.Sphere;
  radius: number;
  widthSegments: number;
  heightSegments: number;
}

/**
 * The definition for a cylinder geometry.
 */
export interface CylinderGeometryDef {
  type: GeometryPrimitive.Cylinder;
  radiusTop?: number; // Default: 1
  radiusBottom?: number; // Default: 1
  height: number;
  radialSegments?: number; // Default: 32
  heightSegments?: number; // Default: 1
  openEnded?: boolean; // Default: false
}

/**
 * The definition for a plane geometry.
 */
export interface PlaneGeometryDef {
  type: GeometryPrimitive.Plane;
  width: number;
  height: number;
  widthSegments?: number; // Default: 1
  heightSegments?: number; // Default: 1
}

/**
 * The definition for a cone geometry.
 */
export interface ConeGeometryDef {
  type: GeometryPrimitive.Cone;
  radius: number;
  height: number;
  radialSegments?: number; // Default: 32
  heightSegments?: number; // Default: 1
  openEnded?: boolean; // Default: false
}

/**
 * The definition for a torus geometry.
 */
export interface TorusGeometryDef {
  type: GeometryPrimitive.Torus;
  radius: number; // Radius of the entire torus
  tube: number; // Radius of the tube
  radialSegments?: number; // Default: 16
  tubularSegments?: number; // Default: 100
  arc?: number; // Central angle in radians (default: Math.PI * 2)
}

/**
 * The definition for a circle geometry.
 */
export interface CircleGeometryDef {
  type: GeometryPrimitive.Circle;
  radius: number;
  segments?: number; // Default: 32
  thetaStart?: number; // Start angle in radians (default: 0)
  thetaLength?: number; // Central angle in radians (default: Math.PI * 2)
}

/**
 * A command for a 2D path, using standard SVG path command letters.
 */
export interface Path2DCommand {
  command: 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';
  args: number[];
}

/**
 * The definition for a 2D path geometry.
 */
export interface Path2DGeometryDef {
  type: GeometryPrimitive.Path2D;
  path: Path2DCommand[];
}

/**
 * The definition for a text geometry.
 */
export interface TextGeometryDef {
  type: GeometryPrimitive.Text;
  /** The text content to display. */
  text: string;
  /** Font size in SVG user units (pixels). Default: 16 */
  fontSize?: number;
  /** Font family name. Default: 'sans-serif' */
  fontFamily?: string;
  /** Font weight (e.g. 'normal', 'bold', '700'). Default: 'normal' */
  fontWeight?: string;
  /** Text anchor: 'start', 'middle', or 'end'. Default: 'start' */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Dominant baseline: 'auto', 'middle', 'hanging', etc. Default: 'auto' */
  dominantBaseline?: string;
}

/**
 * The definition for a buffer geometry with arbitrary mesh data.
 * Used for loading complex models from glTF/GLB files.
 */
export interface BufferGeometryDef {
  type: GeometryPrimitive.Buffer;
  /** Vertex positions as flat xyz array. */
  positions: Float32Array;
  /** Vertex normals as flat xyz array (optional). */
  normals?: Float32Array;
  /** UV coordinates as flat uv array (optional). */
  uvs?: Float32Array;
  /** Triangle indices (optional, for indexed geometry). */
  indices?: Uint16Array | Uint32Array;
}

/**
 * Operations for Constructive Solid Geometry.
 */
export enum CSGOperation {
  Union = 'Union',
  Subtract = 'Subtract',
  Intersect = 'Intersect',
}

/**
 * The definition for a CSG geometry, combining two geometries with a boolean operation.
 */
export interface CSGGeometryDef {
  type: GeometryPrimitive.CSG;
  /** The operation to perform. */
  operation: CSGOperation;
  /** The base geometry. */
  base: GeometryDef;
  /** The geometry to combine with the base. */
  modifier: GeometryDef;
  /** Optional transform for the modifier geometry relative to the base. */
  modifierTransform?: Matrix4;
}

/**
 * A union of all possible geometry definitions.
 */
export type GeometryDef =
  | BoxGeometryDef
  | SphereGeometryDef
  | CylinderGeometryDef
  | PlaneGeometryDef
  | ConeGeometryDef
  | TorusGeometryDef
  | CircleGeometryDef
  | Path2DGeometryDef
  | TextGeometryDef
  | BufferGeometryDef
  | CSGGeometryDef;

/**
 * A component that defines the geometry of a node.
 */
export class Geometry extends Component {
  readonly type = ComponentType.Geometry;

  /**
   * The definition of the geometry.
   */
  definition: GeometryDef;

  constructor(definition: GeometryDef) {
    super();
    this.definition = definition;
  }
}


