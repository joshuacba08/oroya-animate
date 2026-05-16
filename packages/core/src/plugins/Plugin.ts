import type { ComponentType } from '../components/Component';
import type { Scene } from '../scene/Scene';
import type { Node } from '../nodes/Node';

/**
 * Renderer-side hook for a custom component type.
 *
 * Plugins extend the rendering pipeline without forking the renderer.
 * When a renderer sees a node carrying a component whose `type` matches a
 * registered handler, it delegates object creation / per-frame sync to the
 * plugin instead of its built-in branch.
 *
 * The handler is intentionally renderer-agnostic at the type level — each
 * renderer adapts its own `BackendObject` (e.g. `THREE.Object3D` for the
 * Three.js backend, a SVG element for the SVG backend). Plugins targeting
 * a specific backend declare it via the generic.
 */
export interface ComponentHandler<BackendObject = unknown> {
    /** The component type this handler responds to. */
    readonly componentType: ComponentType | string;

    /**
     * Build the backend object for a node carrying the registered component.
     * Return `null` to fall back to the renderer's default behavior.
     */
    create(node: Node): BackendObject | null;

    /**
     * Called every frame before the render pass. Lets the plugin sync any
     * per-frame state (uniform updates, mesh deformation, etc.). Optional.
     */
    update?(node: Node, backendObject: BackendObject, dt: number): void;

    /** Release backend resources owned by the handler. Optional. */
    dispose?(node: Node, backendObject: BackendObject): void;
}

/**
 * Lifecycle of an Oroya plugin.
 *
 * A plugin is a self-contained extension that:
 *   1. Registers one or more `ComponentHandler`s on a renderer or scene.
 *   2. Optionally hooks into per-frame `update(dt, scene)` and `dispose`.
 *
 * Plugins remain valid across `renderer.mount()` calls — they are owned
 * by the plugin host (the renderer or scene), not by the scene graph.
 */
export interface Plugin {
    /** Human-readable plugin identifier. Used for telemetry / debug. */
    readonly name: string;
    /** Component handlers contributed by this plugin. */
    readonly handlers?: ComponentHandler[];
    /** Optional per-frame hook called by the plugin host. */
    update?(dt: number, scene: Scene): void;
    /** Optional teardown. */
    dispose?(): void;
}

/**
 * Registry of plugins for a single host (a renderer or a scene).
 *
 * Lookup-by-component-type is O(1). Per-frame iteration over registered
 * plugins is O(n) but `n` is the count of *active plugins*, which is
 * small in practice (single-digit) — no performance concern.
 *
 * @experimental
 */
export class PluginRegistry {
    private readonly plugins: Plugin[] = [];
    private readonly handlers = new Map<ComponentType | string, ComponentHandler>();

    /** Register a plugin and its handlers. Returns the plugin for chaining. */
    register(plugin: Plugin): Plugin {
        this.plugins.push(plugin);
        if (plugin.handlers) {
            for (const h of plugin.handlers) {
                this.handlers.set(h.componentType, h);
            }
        }
        return plugin;
    }

    /** Remove a plugin (by reference). No-op if not registered. */
    unregister(plugin: Plugin): boolean {
        const idx = this.plugins.indexOf(plugin);
        if (idx < 0) return false;
        this.plugins.splice(idx, 1);
        if (plugin.handlers) {
            for (const h of plugin.handlers) {
                if (this.handlers.get(h.componentType) === h) {
                    this.handlers.delete(h.componentType);
                }
            }
        }
        plugin.dispose?.();
        return true;
    }

    /** Look up the handler for a component type, or `null` if none registered. */
    getHandler(componentType: ComponentType | string): ComponentHandler | null {
        return this.handlers.get(componentType) ?? null;
    }

    /** Invoke every plugin's per-frame `update`, if any. */
    update(dt: number, scene: Scene): void {
        for (const p of this.plugins) {
            p.update?.(dt, scene);
        }
    }

    /** Dispose every plugin and clear the registry. */
    dispose(): void {
        for (const p of this.plugins) p.dispose?.();
        this.plugins.length = 0;
        this.handlers.clear();
    }

    /** Read-only list of registered plugins (for debug / inspector use). */
    list(): readonly Plugin[] {
        return this.plugins;
    }
}
