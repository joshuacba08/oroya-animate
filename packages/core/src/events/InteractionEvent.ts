import type { Node } from '../nodes/Node';
import type { Vec3 } from '../components/Transform';

/**
 * All supported interaction event types.
 */
export enum InteractionEventType {
    Click = 'click',
    PointerDown = 'pointerdown',
    PointerUp = 'pointerup',
    PointerMove = 'pointermove',
    PointerEnter = 'pointerenter',
    PointerLeave = 'pointerleave',
    Wheel = 'wheel',
    DragStart = 'dragstart',
    Drag = 'drag',
    DragEnd = 'dragend',
}

/**
 * An interaction event that flows through the scene graph.
 *
 * Modeled after DOM events but adapted for 3D/2D scene graphs:
 * - `target` is the node where the event originated.
 * - `currentTarget` changes as the event bubbles up the hierarchy.
 * - Call `stopPropagation()` to prevent further bubbling.
 */
export interface InteractionEvent {
    /** The type of interaction. */
    readonly type: InteractionEventType;

    /** The node that the event was originally dispatched on. */
    readonly target: Node;

    /** The node currently handling the event during propagation. */
    currentTarget: Node;

    /** The intersection point in world space (3D raycasting). */
    point?: Vec3;

    /** The intersection point in local space of the target node. */
    localPoint?: Vec3;

    /** Screen-space position of the pointer. */
    screenPosition: { x: number; y: number };

    /** The original DOM event (typed as `unknown` in core; renderers provide the actual type). */
    nativeEvent: unknown;

    /** Delta movement for drag events. */
    delta?: Vec3;

    /** Whether propagation has been stopped. */
    propagationStopped: boolean;

    /** Prevent the event from bubbling further up the scene graph. */
    stopPropagation(): void;
}

/**
 * Maps event type strings to their payload type for generic typing.
 */
export interface InteractionEventMap {
    click: InteractionEvent;
    pointerdown: InteractionEvent;
    pointerup: InteractionEvent;
    pointermove: InteractionEvent;
    pointerenter: InteractionEvent;
    pointerleave: InteractionEvent;
    wheel: InteractionEvent;
    dragstart: InteractionEvent;
    drag: InteractionEvent;
    dragend: InteractionEvent;
}

/**
 * Factory to create an InteractionEvent with sensible defaults.
 */
export function createInteractionEvent(
    type: InteractionEventType,
    target: Node,
    nativeEvent: unknown,
    screenPosition: { x: number; y: number },
    options: {
        point?: Vec3;
        localPoint?: Vec3;
        delta?: Vec3;
    } = {},
): InteractionEvent {
    const event: InteractionEvent = {
        type,
        target,
        currentTarget: target,
        screenPosition,
        nativeEvent,
        point: options.point,
        localPoint: options.localPoint,
        delta: options.delta,
        propagationStopped: false,
        stopPropagation() {
            this.propagationStopped = true;
        },
    };
    return event;
}
