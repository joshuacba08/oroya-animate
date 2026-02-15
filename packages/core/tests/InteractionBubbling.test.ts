import { describe, it, expect, vi } from 'vitest';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';
import { InteractionEventType, createInteractionEvent } from '../src/events/InteractionEvent';

describe('Interaction Bubbling', () => {
    it('should dispatch event to the target node', () => {
        const node = new Node('target');
        const handler = vi.fn();

        node.on('click', handler);

        const event = createInteractionEvent(
            InteractionEventType.Click,
            node,
            null, // no native event in tests
            { x: 100, y: 200 },
        );
        node.dispatchInteraction(event);

        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].target).toBe(node);
    });

    it('should bubble events from child to parent', () => {
        const parent = new Node('parent');
        const child = new Node('child');
        parent.add(child);

        const parentHandler = vi.fn();
        const childHandler = vi.fn();

        parent.on('click', parentHandler);
        child.on('click', childHandler);

        const event = createInteractionEvent(
            InteractionEventType.Click,
            child,
            null,
            { x: 0, y: 0 },
        );
        child.dispatchInteraction(event);

        expect(childHandler).toHaveBeenCalledOnce();
        expect(parentHandler).toHaveBeenCalledOnce();
        // target should remain the original child
        expect(parentHandler.mock.calls[0][0].target).toBe(child);
        // currentTarget should be the parent when handled by parent
        expect(parentHandler.mock.calls[0][0].currentTarget).toBe(parent);
    });

    it('should bubble through multiple levels (grandchild → child → parent → root)', () => {
        const scene = new Scene();
        const parent = new Node('parent');
        const child = new Node('child');
        const grandchild = new Node('grandchild');

        scene.add(parent);
        parent.add(child);
        child.add(grandchild);

        const rootHandler = vi.fn();
        const parentHandler = vi.fn();
        const childHandler = vi.fn();
        const grandchildHandler = vi.fn();

        scene.root.on('click', rootHandler);
        parent.on('click', parentHandler);
        child.on('click', childHandler);
        grandchild.on('click', grandchildHandler);

        const event = createInteractionEvent(
            InteractionEventType.Click,
            grandchild,
            null,
            { x: 0, y: 0 },
        );
        grandchild.dispatchInteraction(event);

        expect(grandchildHandler).toHaveBeenCalledOnce();
        expect(childHandler).toHaveBeenCalledOnce();
        expect(parentHandler).toHaveBeenCalledOnce();
        expect(rootHandler).toHaveBeenCalledOnce();
    });

    it('stopPropagation should prevent further bubbling', () => {
        const parent = new Node('parent');
        const child = new Node('child');
        parent.add(child);

        const parentHandler = vi.fn();
        child.on('click', (e) => {
            e.stopPropagation();
        });
        parent.on('click', parentHandler);

        const event = createInteractionEvent(
            InteractionEventType.Click,
            child,
            null,
            { x: 0, y: 0 },
        );
        child.dispatchInteraction(event);

        expect(parentHandler).not.toHaveBeenCalled();
    });

    it('should not throw when dispatching on a node with no parent', () => {
        const node = new Node('orphan');
        const handler = vi.fn();
        node.on('click', handler);

        const event = createInteractionEvent(
            InteractionEventType.Click,
            node,
            null,
            { x: 0, y: 0 },
        );

        expect(() => node.dispatchInteraction(event)).not.toThrow();
        expect(handler).toHaveBeenCalledOnce();
    });
});
