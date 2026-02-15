import { Component, ComponentType } from './Component';

/**
 * Definition for an `<animate>` element that animates a single attribute.
 */
export interface SvgAnimateDef {
  type: 'animate';
  /** The attribute name to animate (e.g. 'opacity', 'r', 'fill'). */
  attributeName: string;
  /** Starting value. */
  from?: string;
  /** Ending value. */
  to?: string;
  /** Semicolon-separated list of values for keyframe animation. */
  values?: string;
  /** Duration (e.g. '2s', '500ms'). */
  dur: string;
  /** Repeat count (e.g. 'indefinite', '3'). Default: undefined (once). */
  repeatCount?: string;
  /** Begin time or event (e.g. '0s', 'click'). */
  begin?: string;
  /** Fill mode: 'freeze' keeps the final value, 'remove' resets. */
  fill?: 'freeze' | 'remove';
  /** Semicolon-separated key times (0–1). */
  keyTimes?: string;
  /** Semicolon-separated key splines for spline interpolation. */
  keySplines?: string;
  /** Calculation mode. */
  calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
}

/**
 * Definition for an `<animateTransform>` element.
 */
export interface SvgAnimateTransformDef {
  type: 'animateTransform';
  /** Transform type to animate. */
  transformType: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
  /** Starting value. */
  from?: string;
  /** Ending value. */
  to?: string;
  /** Semicolon-separated list of values. */
  values?: string;
  /** Duration (e.g. '2s', '500ms'). */
  dur: string;
  /** Repeat count (e.g. 'indefinite', '3'). */
  repeatCount?: string;
  /** Begin time or event. */
  begin?: string;
  /** Fill mode. */
  fill?: 'freeze' | 'remove';
  /** Whether to add to or replace existing transforms. Default: 'replace'. */
  additive?: 'sum' | 'replace';
}

/**
 * A union of all SVG animation definition types.
 */
export type SvgAnimationDef = SvgAnimateDef | SvgAnimateTransformDef;

/**
 * A component that attaches SVG animations to a node.
 * When rendered by the SVG renderer, these produce `<animate>` and
 * `<animateTransform>` child elements inside the geometry element.
 *
 * @example
 * ```ts
 * const node = new Node('pulsing-circle');
 * node.addComponent(createSphere(20));
 * node.addComponent(new Animation([
 *   { type: 'animate', attributeName: 'r', from: '20', to: '30', dur: '1s', repeatCount: 'indefinite' }
 * ]));
 * ```
 */
export class Animation extends Component {
  readonly type = ComponentType.Animation;

  /** The list of SVG animation definitions to apply. */
  animations: SvgAnimationDef[];

  constructor(animations: SvgAnimationDef[]) {
    super();
    this.animations = animations;
  }
}
