import { Component, ComponentType } from './Component';

/**
 * An enumeration of the available camera types.
 */
export enum CameraType {
  Perspective = 'Perspective',
  Orthographic = 'Orthographic',
}

/**
 * The definition for a perspective camera.
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
 */
export interface OrthographicCameraDef {
  type: CameraType.Orthographic;

  /** Left boundary of the view. */
  left: number;

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
 */
export type CameraDef = PerspectiveCameraDef | OrthographicCameraDef;

/**
 * A component that defines a camera in the scene.
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

