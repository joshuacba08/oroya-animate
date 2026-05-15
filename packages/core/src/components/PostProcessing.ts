import { Component, ComponentType } from './Component';

/**
 * Tone-mapping curves supported by the post-processing pipeline.
 * Maps to Three.js `WebGLRenderer.toneMapping` (Reinhard, Cineon, ACESFilmic).
 */
export enum ToneMapping {
  None = 'None',
  Reinhard = 'Reinhard',
  Cineon = 'Cineon',
  ACESFilmic = 'ACESFilmic',
}

/**
 * Options for the UnrealBloom pass.
 */
export interface BloomOptions {
  enabled: boolean;
  /** Luminance threshold above which pixels bloom. Range: 0..1. */
  threshold: number;
  /** Bloom intensity multiplier. */
  strength: number;
  /** Gaussian blur radius for the bloom convolution. */
  radius: number;
}

/**
 * Declarative description of a post-processing chain.
 *
 * Backends consume this to assemble a render-pass graph. The Three.js backend
 * maps it to an `EffectComposer` with RenderPass → UnrealBloomPass → SMAAPass
 * → OutputPass (each pass added only when its option is enabled).
 */
export interface PostProcessingDef {
  toneMapping?: ToneMapping;
  /** Tone-mapping exposure multiplier. Default: 1.0 */
  exposure?: number;
  bloom?: BloomOptions;
  /**
   * Enable screen-space antialiasing.
   *
   * Implemented as an SMAA pass in the Three.js backend (better edge quality
   * than FXAA at the same cost). Mutually exclusive with the WebGL MSAA
   * pipeline — when post-processing is active, MSAA is bypassed and SMAA is
   * the recommended replacement.
   */
  antialiasing?: boolean;
}

/**
 * A scene-graph component that declares a post-processing chain.
 *
 * **Placement convention:** attach to the **active Camera node**. Renderers
 * look up the post-processing chain off the camera being rendered, so each
 * camera can carry its own effects (useful for split-screen, picture-in-picture,
 * or render-target previews).
 */
export class PostProcessing extends Component {
  readonly type = ComponentType.PostProcessing;

  definition: PostProcessingDef;

  constructor(definition: PostProcessingDef = {}) {
    super();
    this.definition = definition;
  }
}
