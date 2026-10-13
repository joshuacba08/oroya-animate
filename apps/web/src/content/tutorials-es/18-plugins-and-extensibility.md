---
title: "Plugins: extender el renderer sin forkearlo"
description: "Registrá un ComponentHandler que intercepta un tipo de componente custom y produce tus propios objetos backend."
order: 18
level: "advanced"
duration: "20 min"
---
# Tutorial 18: Plugins: lifecycle estable

Plugins y handlers son públicos desde 1.2.0. Gana el último registrado; al retirarlo se restaura el anterior. Devolver null usa la traducción integrada.

Usá un ComponentType existente para nodos core tipados. Registrar un string en PluginRegistry no amplía por sí solo Node.components ni Component.type. Los esquemas propios necesitan adaptadores.

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

Los hooks se ejecutan tras actualizar la escena y antes de sincronizar matrices. advanceScene: false usa delta cero. Dispose del handler precede al del plugin; el handler posee sus recursos.
