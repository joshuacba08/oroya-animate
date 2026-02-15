import { Component, ComponentType } from './Component';

/**
 * An enumeration of the available geometry primitive types.
 */
export enum GeometryPrimitive {
  Box = 'Box',
  Sphere = 'Sphere',
  Path2D = 'Path2D',
  Text = 'Text',
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
 * A union of all possible geometry definitions.
 */
export type GeometryDef = BoxGeometryDef | SphereGeometryDef | Path2DGeometryDef | TextGeometryDef;

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


