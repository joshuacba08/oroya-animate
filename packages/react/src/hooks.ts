import { useEffect, useRef } from 'react';
import type { Node, Scene } from '@joroya/core';
import { useOroya, type FrameCallback } from './context';

/**
 * Per-frame callback. Receives `dt` in seconds. The callback identity is
 * snapshotted into a ref so the underlying registration is stable across
 * renders — apps don't have to memoize their callbacks.
 *
 * @example
 * useFrame((dt) => {
 *   nodeRef.current.transform.position.x += speed * dt;
 * });
 *
 * @experimental
 */
export function useFrame(callback: FrameCallback): void {
    const { registerFrameCallback } = useOroya();
    const ref = useRef<FrameCallback>(callback);
    ref.current = callback;
    useEffect(() => {
        const cb: FrameCallback = (dt) => ref.current(dt);
        return registerFrameCallback(cb);
    }, [registerFrameCallback]);
}

/**
 * Access to the underlying Oroya `Scene`. Stable for the canvas's lifetime.
 *
 * @experimental
 */
export function useScene(): Scene {
    return useOroya().scene;
}

/**
 * Access to the JSX parent node — the node child components attach to.
 *
 * @experimental
 */
export function useParentNode(): Node {
    return useOroya().parentNode;
}
