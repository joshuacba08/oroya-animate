import { ComponentType, type Scene, type Node } from '@joroya/core';

/**
 * Aggregate counts gathered from a single scene-graph traversal.
 *
 * Cheap to compute (O(n) over nodes, no GPU calls) but expensive if invoked
 * every frame on huge scenes — the inspector throttles its refresh rate.
 *
 * @public
 */
export interface SceneStats {
    nodeCount: number;
    componentCount: number;
    perComponent: Partial<Record<ComponentType, number>>;
}

/** @public */
export function collectSceneStats(scene: Scene): SceneStats {
    let nodeCount = 0;
    let componentCount = 0;
    const perComponent: Partial<Record<ComponentType, number>> = {};

    scene.traverse((node: Node) => {
        nodeCount++;
        for (const type of node.components.keys()) {
            componentCount++;
            perComponent[type] = (perComponent[type] ?? 0) + 1;
        }
    });

    return { nodeCount, componentCount, perComponent };
}
