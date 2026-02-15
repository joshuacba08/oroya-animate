import { Component, ComponentType } from './Component';

/**
 * An interface for representing an RGB color.
 */
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * The definition for a material.
 */
export interface MaterialDef {
  /**
   * The color of the material.
   */
  color?: ColorRGB;

  /**
   * The opacity of the material, from 0 (transparent) to 1 (opaque).
   */
  opacity?: number;

  /**
   * The fill color for 2D/SVG rendering.
   */
  fill?: ColorRGB;

  /**
   * The stroke color for 2D/SVG rendering.
   */
  stroke?: ColorRGB;

  /**
   * The stroke width for 2D/SVG rendering.
   */
  strokeWidth?: number;

  // more properties like roughness, metalness, etc. can be added here
}

/**
 * A component that defines the material of a node, affecting its appearance.
 */
export class Material extends Component {
  readonly type = ComponentType.Material;

  /**
   * The definition of the material.
   */
  definition: MaterialDef;

  constructor(definition: MaterialDef = {}) {
    super();
    this.definition = definition;
  }
}

