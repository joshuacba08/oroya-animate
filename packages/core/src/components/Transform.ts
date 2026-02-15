import { Component, ComponentType } from './Component';
import { composeMatrix, Matrix4, Matrix4Identity } from '../math/Matrix4';

// Using simple objects for vectors/rotations to keep it dependency-free.
export interface Vec3 { x: number; y: number; z: number; }
export interface Quat { x: number; y: number; z: number; w: number; }

export class Transform extends Component {
  readonly type = ComponentType.Transform;

  position: Vec3 = { x: 0, y: 0, z: 0 };
  rotation: Quat = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vec3 = { x: 1, y: 1, z: 1 };

  localMatrix: Matrix4 = [...Matrix4Identity] as Matrix4;
  worldMatrix: Matrix4 = [...Matrix4Identity] as Matrix4;

  isDirty: boolean = true;

  updateLocalMatrix(): void {
    this.localMatrix = composeMatrix(this.position, this.rotation, this.scale);
    this.isDirty = true;
  }
}

