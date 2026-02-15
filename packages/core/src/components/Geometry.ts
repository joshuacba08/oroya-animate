import { Component, ComponentType } from './Component';

export enum GeometryPrimitive {
  Box = 'Box',
  Sphere = 'Sphere',
  Path2D = 'Path2D',
}

export interface BoxGeometryDef {
  type: GeometryPrimitive.Box;
  width: number;
  height: number;
  depth: number;
}

export interface Path2DCommand {
  command: 'moveTo' | 'lineTo' | 'closePath';
  args: number[];
}

export interface Path2DGeometryDef {
  type: GeometryPrimitive.Path2D;
  path: Path2DCommand[];
}

export type GeometryDef = BoxGeometryDef | Path2DGeometryDef;

export class Geometry extends Component {
  readonly type = ComponentType.Geometry;
  definition: GeometryDef;

  constructor(definition: GeometryDef) {
    super();
    this.definition = definition;
  }
}
