import { Component, ComponentType } from './Component';

/**
 * An enumeration of the available geometry primitive types.
 */
export enum GeometryPrimitive {
  Box = 'Box',
  Sphere = 'Sphere',
  Path2D = 'Path2D',
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
 * A command for a 2D path.
 */
export interface Path2DCommand {
  command: 'moveTo' | 'lineTo' | 'closePath';
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
 * A union of all possible geometry definitions.
 */
export type GeometryDef = BoxGeometryDef | SphereGeometryDef | Path2DGeometryDef;

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


