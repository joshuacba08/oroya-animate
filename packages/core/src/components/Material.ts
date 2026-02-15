import { Component, ComponentType } from './Component';

export interface ColorRGB { r: number; g: number; b: number; }

export interface MaterialDef {
  color?: ColorRGB;
  opacity?: number;
  stroke?: ColorRGB;
  strokeWidth?: number;
  fill?: ColorRGB;
}

export class Material extends Component {
  readonly type = ComponentType.Material;
  definition: MaterialDef;

  constructor(definition: MaterialDef) {
    super();
    this.definition = definition;
  }
}
