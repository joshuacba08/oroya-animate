// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComponentType, type Node, type Geometry, type Material } from '@joroya/core';
import { Box, Group, OroyaCanvas } from '../src';

const hosts = vi.hoisted(() => ({ disposed: 0, created: 0 }));
vi.mock('@joroya/renderer-three', () => ({ ThreeRenderer: class {
  constructor() { hosts.created++; }
  mount() {} render() {} setSize() {} dispose() { hosts.disposed++; }
} }));

afterEach(() => { vi.unstubAllGlobals(); });
describe('React committed props and ownership', () => {
  it('updates geometry, material, names and transforms and survives StrictMode remounts', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    hosts.created = 0; hosts.disposed = 0;
    const element = document.createElement('div'); document.body.append(element);
    const root = createRoot(element); const group = { current: null as Node | null }; const box = { current: null as Node | null };
    const render = (size: number, name: string) => <StrictMode><OroyaCanvas><Group nodeRef={group}><Box nodeRef={box} size={size} name={name} color={{ r: size / 4, g: 0, b: 0 }} position={{ x: size }} /></Group></OroyaCanvas></StrictMode>;
    await act(async () => root.render(render(1, 'first')));
    const identity = box.current!;
    expect(group.current!.children).toEqual([identity]);
    await act(async () => root.render(render(2, 'second')));
    expect(box.current).toBe(identity); expect(identity.name).toBe('second'); expect(identity.transform.position.x).toBe(2);
    expect(identity.getComponent<Geometry>(ComponentType.Geometry)!.definition).toMatchObject({ width: 2 });
    expect(identity.getComponent<Material>(ComponentType.Material)!.definition.color!.r).toBe(0.5);
    await act(async () => root.unmount());
    expect(box.current).toBeNull(); expect(group.current).toBeNull();
    expect(hosts.disposed).toBe(hosts.created); element.remove();
  });
});
