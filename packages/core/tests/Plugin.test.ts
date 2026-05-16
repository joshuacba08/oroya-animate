import { describe, expect, it, vi } from 'vitest';
import { PluginRegistry, type ComponentHandler, type Plugin } from '../src/plugins/Plugin';
import { ComponentType } from '../src/components/Component';
import { Scene } from '../src/scene/Scene';

describe('PluginRegistry', () => {
    it('registers a plugin and looks up its handlers by component type', () => {
        const registry = new PluginRegistry();
        const handler: ComponentHandler = {
            componentType: ComponentType.Geometry,
            create: () => null,
        };
        const plugin: Plugin = { name: 'test-plugin', handlers: [handler] };

        registry.register(plugin);
        expect(registry.getHandler(ComponentType.Geometry)).toBe(handler);
        expect(registry.getHandler(ComponentType.Material)).toBeNull();
        expect(registry.list()).toEqual([plugin]);
    });

    it('unregisters a plugin and clears its handlers', () => {
        const registry = new PluginRegistry();
        const dispose = vi.fn();
        const handler: ComponentHandler = {
            componentType: ComponentType.Light,
            create: () => null,
        };
        const plugin: Plugin = { name: 'test', handlers: [handler], dispose };

        registry.register(plugin);
        const removed = registry.unregister(plugin);
        expect(removed).toBe(true);
        expect(registry.getHandler(ComponentType.Light)).toBeNull();
        expect(dispose).toHaveBeenCalledOnce();
    });

    it('returns `false` from unregister when the plugin was not registered', () => {
        const registry = new PluginRegistry();
        expect(registry.unregister({ name: 'ghost' })).toBe(false);
    });

    it('propagates `update(dt, scene)` to every registered plugin', () => {
        const registry = new PluginRegistry();
        const updateA = vi.fn();
        const updateB = vi.fn();
        registry.register({ name: 'A', update: updateA });
        registry.register({ name: 'B', update: updateB });

        const scene = new Scene();
        registry.update(0.016, scene);
        expect(updateA).toHaveBeenCalledWith(0.016, scene);
        expect(updateB).toHaveBeenCalledWith(0.016, scene);
    });

    it('supports custom component-type strings (third-party extension)', () => {
        const registry = new PluginRegistry();
        const handler: ComponentHandler = {
            componentType: 'CustomVoxelGrid',
            create: () => null,
        };
        registry.register({ name: 'voxels', handlers: [handler] });
        expect(registry.getHandler('CustomVoxelGrid')).toBe(handler);
    });

    it('dispose() tears down every plugin and empties the registry', () => {
        const registry = new PluginRegistry();
        const d1 = vi.fn();
        const d2 = vi.fn();
        registry.register({ name: 'A', dispose: d1 });
        registry.register({ name: 'B', dispose: d2 });
        registry.dispose();
        expect(d1).toHaveBeenCalledOnce();
        expect(d2).toHaveBeenCalledOnce();
        expect(registry.list()).toEqual([]);
    });

    it('later registration of the same component type overwrites the prior handler', () => {
        const registry = new PluginRegistry();
        const first: ComponentHandler = { componentType: ComponentType.Geometry, create: () => null };
        const second: ComponentHandler = { componentType: ComponentType.Geometry, create: () => null };
        registry.register({ name: 'first', handlers: [first] });
        registry.register({ name: 'second', handlers: [second] });
        expect(registry.getHandler(ComponentType.Geometry)).toBe(second);
    });
});
