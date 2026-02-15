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
 * A gradient color stop.
 */
export interface GradientStop {
  /** Offset position from 0 to 1. */
  offset: number;
  /** Color at this stop. */
  color: ColorRGB;
  /** Opacity at this stop (0–1). Default: 1 */
  opacity?: number;
}

/**
 * Definition for a linear gradient.
 */
export interface LinearGradientDef {
  type: 'linear';
  /** Start X (0–1, relative to bounding box). Default: 0 */
  x1?: number;
  /** Start Y (0–1, relative to bounding box). Default: 0 */
  y1?: number;
  /** End X (0–1, relative to bounding box). Default: 1 */
  x2?: number;
  /** End Y (0–1, relative to bounding box). Default: 0 */
  y2?: number;
  /** Gradient color stops. */
  stops: GradientStop[];
}

/**
 * Definition for a radial gradient.
 */
export interface RadialGradientDef {
  type: 'radial';
  /** Center X (0–1). Default: 0.5 */
  cx?: number;
  /** Center Y (0–1). Default: 0.5 */
  cy?: number;
  /** Radius (0–1). Default: 0.5 */
  r?: number;
  /** Focus X (0–1). Default: cx */
  fx?: number;
  /** Focus Y (0–1). Default: cy */
  fy?: number;
  /** Gradient color stops. */
  stops: GradientStop[];
}

/**
 * A union of all gradient definitions.
 */
export type GradientDef = LinearGradientDef | RadialGradientDef;

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
   * A gradient fill for 2D/SVG rendering. If set, overrides `fill`.
   */
  fillGradient?: GradientDef;

  /**
   * The stroke color for 2D/SVG rendering.
   */
  stroke?: ColorRGB;

  /**
   * A gradient stroke for 2D/SVG rendering. If set, overrides `stroke`.
   */
  strokeGradient?: GradientDef;

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

