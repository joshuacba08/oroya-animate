import { Component, ComponentType } from './Component';

export enum RigidBodyType {
    Dynamic = 'Dynamic',
    Static = 'Static',
    Kinematic = 'Kinematic'
}

export interface RigidBodyDef {
    mass?: number; // 0 for static
    type?: RigidBodyType;
    linearDamping?: number;
    angularDamping?: number;
    fixedRotation?: boolean;
}

export class RigidBody extends Component {
    readonly type = ComponentType.RigidBody;

    definition: Required<RigidBodyDef>;

    constructor(definition: RigidBodyDef = {}) {
        super();
        this.definition = {
            mass: definition.type === RigidBodyType.Static ? 0 : 1,
            type: RigidBodyType.Dynamic,
            linearDamping: 0.01,
            angularDamping: 0.01,
            fixedRotation: false,
            ...definition,
        };

        // Enforce static mass 0 rule if explicit type given
        if (this.definition.type === RigidBodyType.Static) {
            this.definition.mass = 0;
        }
    }
}
