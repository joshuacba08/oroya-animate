import { Scene as OroyaScene, Node as OroyaNode, createBox, Material as OroyaMaterial } from '@oroya/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Justification: Using three's loader is robust. The key is to translate, not to expose three.js types.
 * This is a simplified translator. A real implementation would need to handle materials,
 * custom geometries, and animations by converting them to the @oroya/core format.
 */
export async function loadGLTF(url: string): Promise<OroyaScene> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  
  const oroyaScene = new OroyaScene();

  // The root of a gltf scene might have multiple children
  gltf.scene.children.forEach(child => {
    oroyaScene.root.add(translateNode(child));
  });

  return oroyaScene;
}

function translateNode(threeNode: THREE.Object3D): OroyaNode {
  const oroyaNode = new OroyaNode(threeNode.name || 'gltf-node');

  // 1. Translate Transform
  oroyaNode.transform.position = { ...threeNode.position };
  oroyaNode.transform.rotation = { ...threeNode.quaternion };
  oroyaNode.transform.scale = { ...threeNode.scale };

  // 2. Translate Geometry & Material (simplified)
  if (threeNode instanceof THREE.Mesh) {
    // TODO: This is a placeholder. A real implementation would inspect `threeNode.geometry`
    // and create a corresponding `BufferGeometryDef` in @oroya/core. For now, we use a box.
    oroyaNode.addComponent(createBox(1, 1, 1));

    // TODO: A real implementation would translate `threeNode.material` into an @oroya/core `MaterialDef`.
    if (Array.isArray(threeNode.material)) {
        // For now, just take the first material
        const mat = threeNode.material[0] as THREE.MeshStandardMaterial;
        if (mat.color) {
            oroyaNode.addComponent(new OroyaMaterial({ color: { r: mat.color.r, g: mat.color.g, b: mat.color.b }}));
        }
    } else if ('color' in threeNode.material) {
        const mat = threeNode.material as THREE.MeshStandardMaterial;
        if (mat.color) {
            oroyaNode.addComponent(new OroyaMaterial({ color: { r: mat.color.r, g: mat.color.g, b: mat.color.b }}));
        }
    }
  }
  
  // 3. Recursively translate children
  threeNode.children.forEach(child => {
    oroyaNode.add(translateNode(child));
  });

  return oroyaNode;
}
