import { createContext, useContext } from 'react';
import type { Node, Scene } from '@joroya/core';

/**
 * Frame callback signature. Receives `dt` in seconds since the previous
 * frame — same convention as `ThreeRenderer.render(dt)`.
 */
export type FrameCallback = (dt: number) => void;

/**
 * Value carried by the `<OroyaCanvas>` context.
 *
 * `parentNode` walks the JSX tree as components mount/unmount, so a
 * `<Box>` rendered inside another `<Group>` is attached as a child of the
 * group. The root canvas seeds it with `scene.root`.
 *
 * `registerFrameCallback` powers the `useFrame` hook — children push into a
 * shared list that the canvas iterates each animation frame.
 */
export interface OroyaContextValue {
    scene: Scene;
    parentNode: Node;
    registerFrameCallback: (cb: FrameCallback) => () => void;
}

export const OroyaContext = createContext<OroyaContextValue | null>(null);

/**
 * Throws if used outside `<OroyaCanvas>` so misuse fails loudly at the
 * first render instead of silently dropping nodes on the floor.
 */
export function useOroya(): OroyaContextValue {
    const ctx = useContext(OroyaContext);
    if (!ctx) {
        throw new Error('@joroya/react components must be rendered inside <OroyaCanvas>.');
    }
    return ctx;
}
