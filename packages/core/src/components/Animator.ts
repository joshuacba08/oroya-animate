import { Component, ComponentType } from './Component';

export interface AnimatorDef {
    // For now, we might just reference animation by name if loaded via GLTF
    // Or simply a flag to enable the system?
    playing?: boolean;
    loop?: boolean;
    timeScale?: number;
    currentAnimation?: string;
    animations?: Record<string, any>; // Placeholder for actual clips
}

export class Animator extends Component {
    readonly type = ComponentType.Animator;

    definition: Required<AnimatorDef>;

    constructor(definition: AnimatorDef = {}) {
        super();
        this.definition = {
            playing: true,
            loop: true,
            timeScale: 1.0,
            currentAnimation: '',
            animations: {},
            ...definition,
        };
    }
}
