import type { Node } from '../nodes/Node';

export enum ComponentType {
  Transform = 'Transform',
  Geometry = 'Geometry',
  Material = 'Material',
}

export abstract class Component {
  abstract readonly type: ComponentType;
  node: Node | null = null;
}
