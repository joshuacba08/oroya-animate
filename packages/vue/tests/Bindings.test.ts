// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Scene } from '@joroya/core';
import { useOroyaCanvas, useNode, useFrame } from '../src';

const hosts = vi.hoisted(() => ({ disposed: 0, created: 0 }));
vi.mock('@joroya/renderer-three', () => ({ ThreeRenderer: class {
  constructor() { hosts.created++; }
  mount() {} render() {} setSize() {} dispose() { hosts.disposed++; }
} }));
afterEach(() => vi.unstubAllGlobals());
describe('Vue host context and canvas lifecycle', () => {
  it('supports composables in the host setup and removes cameras on canvas replacement', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const canvas = shallowRef<HTMLCanvasElement>(); let scene!: Scene;
    const app = createApp(defineComponent({ setup() {
      scene = useOroyaCanvas(canvas).scene;
      useNode((node) => { node.name = 'host-node'; }); useFrame(() => {});
      return () => h('div');
    } }));
    const target = document.createElement('div'); document.body.append(target); app.mount(target);
    expect(scene.findNodeByName('host-node')).toBeDefined();
    canvas.value = document.createElement('canvas'); await nextTick();
    expect(scene.root.children.filter((node) => node.name === '__oroya_default_camera')).toHaveLength(1);
    canvas.value = document.createElement('canvas'); await nextTick();
    expect(scene.root.children.filter((node) => node.name === '__oroya_default_camera')).toHaveLength(1);
    app.unmount(); expect(scene.root.children).toHaveLength(0); expect(hosts.disposed).toBe(hosts.created); target.remove();
  });
});
