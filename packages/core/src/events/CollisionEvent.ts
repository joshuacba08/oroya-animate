import type { Node } from '../nodes/Node';
import type { Vec3 } from '../components/Transform';

/**
 * Emitted on a `Node` when the physics system detects a contact with another
 * rigid body.
 *
 * Fired in three flavors:
 * - `collide-begin`: first frame two bodies are in contact
 * - `collide`: every frame the contact persists
 * - `collide-end`: first frame after the bodies separate
 *
 * Trigger colliders (`Collider.isTrigger === true`) emit `trigger-enter`,
 * `trigger-stay`, `trigger-exit` instead — same payload shape, no impulse
 * information because triggers don't generate a contact response.
 */
export interface CollisionEvent {
    /** The other node involved in the collision. */
    other: Node;
    /** World-space contact point (when available). */
    contactPoint?: Vec3;
    /** Contact normal pointing from `this` node toward `other`. */
    contactNormal?: Vec3;
    /** Impulse magnitude applied along the normal (only for non-trigger collisions). */
    impulse?: number;
}

/**
 * Event names appended to the Node event map by the physics system.
 */
export interface PhysicsEventMap {
    'collide-begin': CollisionEvent;
    'collide': CollisionEvent;
    'collide-end': CollisionEvent;
    'trigger-enter': CollisionEvent;
    'trigger-stay': CollisionEvent;
    'trigger-exit': CollisionEvent;
}
