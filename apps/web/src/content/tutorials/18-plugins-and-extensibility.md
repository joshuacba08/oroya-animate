---
title: "Plugins: extend the renderer without forking"
description: "Register a ComponentHandler that intercepts a custom component type and ships your own backend objects."
order: 18
level: "advanced"
duration: "20 min"
---
# Tutorial 18: Plugins: stable lifecycle

Plugins and handlers are public from 1.2.0. The latest registered handler wins; unregister restores the preceding handler. A null result falls back to built-in translation.

Use an existing ComponentType for a typed core node. Registering a custom string in PluginRegistry alone does not widen Node.components or Component.type. Application-specific component schemas need their own adapters.

```ts
import { ComponentType, Geometry, GeometryPrimitive, type ComponentHandler, type Plugin } from '@joroya/core';
import * as THREE from 'three';

const handler: ComponentHandler<THREE.Mesh> = {
  componentType: ComponentType.Geometry,
  create(node) {
    const geometry = node.getComponent<Geometry>(ComponentType.Geometry);
    if (!geometry || geometry.definition.type !== GeometryPrimitive.Box) return null;
    const definition = geometry.definition;
    return new THREE.Mesh(new THREE.BoxGeometry(definition.width, definition.height, definition.depth),
      new THREE.MeshBasicMaterial({ color: 0xff8844 }));
  },
  dispose(_node, mesh) {
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
  },
};

export const boxPlugin: Plugin = { name: 'custom-box', handlers: [handler] };
// renderer.usePlugin(boxPlugin);
// renderer.removePlugin(boxPlugin);
```

Handlers run after scene update and before matrix synchronization. advanceScene: false passes zero delta. Handler dispose precedes plugin dispose; the handler owns backend resources.
