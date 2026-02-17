import {
    Scene,
    Node,
    InstancedMesh,
    GeometryPrimitive,
    Material,
    Light,
    LightType,
    type ColorRGB,
    type Matrix4
} from '@joroya/core';
import * as THREE from 'three';

export function createInstancingScene(): { scene: Scene, animate: (time: number) => void } {
    const scene = new Scene();

    // Lights
    const ambientLight = new Node("Ambient");
    ambientLight.addComponent(new Light({ type: LightType.Ambient, intensity: 0.5 }));
    scene.add(ambientLight);

    const dirLight = new Node("Directional");
    dirLight.addComponent(new Light({
        type: LightType.Directional,
        intensity: 0.8,
        color: { r: 1, g: 0.95, b: 0.9 },
        // target needs a separate node or just direction logic, keeping it simple
    }));
    dirLight.transform.position = { x: 10, y: 20, z: 10 };
    dirLight.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.add(dirLight);

    // Instances
    const count = 2000;
    const geometry = { type: GeometryPrimitive.Box, width: 0.5, height: 0.5, depth: 0.5 } as const;
    const material = { color: { r: 1, g: 1, b: 1 }, metalness: 0.5, roughness: 0.5 };

    const instancedMesh = new InstancedMesh(geometry, material, count, true);
    scene.add(instancedMesh);

    // Initial positioning using THREE for math convenience
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const positions: { x: number, y: number, z: number }[] = [];

    for (let i = 0; i < count; i++) {
        dummy.position.x = (Math.random() - 0.5) * 40;
        dummy.position.y = (Math.random() - 0.5) * 40;
        dummy.position.z = (Math.random() - 0.5) * 40;

        positions.push({ x: dummy.position.x, y: dummy.position.y, z: dummy.position.z });

        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();

        // Convert THREE Matrix4 to array
        instancedMesh.setMatrixAt(i, dummy.matrix.toArray() as unknown as Matrix4);

        color.setHex(Math.random() * 0xffffff);
        instancedMesh.setColorAt(i, { r: color.r, g: color.g, b: color.b });
    }

    // Upload initial data
    instancedMesh.instanceMatrixNeedsUpdate();
    instancedMesh.instanceColorNeedsUpdate();

    function animate(time: number) {
        const t = time * 0.5;

        for (let i = 0; i < count; i++) {
            const { x, z } = positions[i];

            // Simple wave motion
            const y = Math.sin(x * 0.5 + t) * Math.cos(z * 0.5 + t) * 5;

            dummy.position.set(x, y, z);
            dummy.rotation.y = t + i * 0.1;
            dummy.updateMatrix();

            instancedMesh.setMatrixAt(i, dummy.matrix.toArray() as unknown as Matrix4);
        }
        instancedMesh.instanceMatrixNeedsUpdate();
    }

    return { scene, animate };
}
