import { Component, ComponentType } from './Component';

/**
 * Definition for the Interactive component.
 */
export interface InteractiveDef {
    /**
     * Whether interaction is enabled. Default: `true`.
     * Set to `false` to temporarily disable without removing the component.
     */
    enabled?: boolean;

    /**
     * CSS cursor to display when the pointer is over this node.
     * Default: `'pointer'`.
     */
    cursor?: string;

    /**
     * Whether this node blocks raycasts to nodes behind it.
     * Default: `true`.
     */
    blocksRaycast?: boolean;
}

/**
 * Marks a node as interactive, enabling it to receive pointer events.
 *
 * A node must have this component to participate in hit-testing and receive
 * interaction events like `click`, `pointerdown`, `pointerenter`, etc.
 *
 * @example
 * ```ts
 * const node = new Node('button');
 * node.addComponent(new Interactive({ cursor: 'pointer' }));
 * node.on('click', (e) => console.log('Clicked!', e.target.name));
 * ```
 */
export class Interactive extends Component {
    readonly type = ComponentType.Interactive;

    /**
     * The definition controlling interactivity behavior.
     */
    definition: Required<InteractiveDef>;

    constructor(definition: InteractiveDef = {}) {
        super();
        this.definition = {
            enabled: definition.enabled ?? true,
            cursor: definition.cursor ?? 'pointer',
            blocksRaycast: definition.blocksRaycast ?? true,
        };
    }
}
