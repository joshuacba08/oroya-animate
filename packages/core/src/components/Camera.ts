import { Component, ComponentType } from './Component';

/**
 * An enumeration of the available camera types.
 * @public
 */
export enum CameraType {
  Perspective = 'Perspective',
  Orthographic = 'Orthographic',
}

/**
 * The definition for a perspective camera.
 * @public
 */
export interface PerspectiveCameraDef {
  type: CameraType.Perspective;

  /**
   * The camera's field of view in degrees.
   */
  fov: number;

  /**
   * The aspect ratio of the camera's view.
   */
  aspect: number;
  /** Adjust projection to the viewport when resized. Default false. */
  autoAspect?: boolean;
  /** Prefer this camera over implicit or first cameras. Default false. */
  active?: boolean;

  /**
   * The near clipping plane.
   */
  near: number;

  /**
   * The far clipping plane.
   */
  far:number;
}

/**
 * The definition for an orthographic camera.
 * Defines a rectangular view frustum.
 * @public
 */
export interface OrthographicCameraDef {
  type: CameraType.Orthographic;

  /** Left boundary of the view. */
  left: number;
  /** Fit horizontal bounds to the viewport, preserving vertical span. */
  autoAspect?: boolean;
  /** Prefer this camera over implicit or first cameras. */
  active?: boolean;

  /** Right boundary of the view. */
  right: number;

  /** Top boundary of the view. */
  top: number;

  /** Bottom boundary of the view. */
  bottom: number;

  /** The near clipping plane. */
  near: number;

  /** The far clipping plane. */
  far: number;
}

/**
 * A union of all possible camera definitions.
 * @public
 */
export type CameraDef = PerspectiveCameraDef | OrthographicCameraDef;

/**
 * A component that defines a camera in the scene.
 * @public
 */
export class Camera extends Component {
  readonly type = ComponentType.Camera;

  /**
   * The definition of the camera.
   */
  definition: CameraDef;

  constructor(definition: CameraDef) {
    super();
    this.definition = definition;
  }
}

