import {
    Scene,
    Node,
    Material,
    Camera,
    CameraType,
    Geometry,
    GeometryPrimitive,
    CSGOperation,
    createBox,
    BoxGeometryDef,
    SphereGeometryDef,
} from '@joroya/core';
import type { ControlDef, ParamValues } from '../types';

export const csgControls: ControlDef[] = [
    {
        type: 'select',
        key: 'operation',
        label: 'Operation',
        options: [
            { value: 'Subtract', label: 'Subtract' },
            { value: 'Union', label: 'Union' },
            { value: 'Intersect', label: 'Intersect' }
        ],
        defaultValue: 'Subtract',
        rebuild: true
    },
    {
        type: 'slider',
        key: 'modifierX',
        label: 'Modifier X',
        min: -2,
        max: 2,
        step: 0.1,
        defaultValue: 0
    },
];

/**
 * CSG (Boolean Operations) Demo
 */
export function createCSGDemoScene(params: ParamValues) {
    const scene = new Scene();

    // Camera
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100,
    }));
    cameraNode.transform.position = { x: 0, y: 0, z: 6 };
    scene.add(cameraNode);

    // Lights (Simulated by standard material environment in ThreeRenderer)

    // Rotating CSG Object
    const csgNode = new Node('csg-node');

    // Define base and modifier geometries
    const boxDef = {
        type: GeometryPrimitive.Box,
        width: 2,
        height: 2,
        depth: 2
    } as BoxGeometryDef;

    const sphereDef = {
        type: GeometryPrimitive.Sphere,
        radius: 1.3,
        widthSegments: 32,
        heightSegments: 32
    } as SphereGeometryDef;

    // Map string param to enum
    let operation = CSGOperation.Subtract;
    if (params.operation === 'Union') operation = CSGOperation.Union;
    if (params.operation === 'Intersect') operation = CSGOperation.Intersect;

    // Create CSG Geometry
    const csgGeo = new Geometry({
        type: GeometryPrimitive.CSG,
        operation,
        base: boxDef,
        modifier: sphereDef,
        modifierTransform: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            params.modifierX as number, 0, 0, 1
        ] // Column-major matrix with translation
    });

    csgNode.addComponent(csgGeo);

    // Material
    csgNode.addComponent(new Material({
        color: { r: 0.2, g: 0.6, b: 1.0 },
        metalness: 0.2,
        roughness: 0.1,
    }));

    scene.add(csgNode);

    // Wireframe reference for base box
    const wireframeNode = new Node('wireframe');
    wireframeNode.addComponent(createBox(2, 2, 2));
    wireframeNode.addComponent(new Material({
        color: { r: 1, g: 1, b: 1 },
        opacity: 0.1, // Transparent
    }));
    scene.add(wireframeNode);

    // Animation loop
    function animate(time: number) {
        // Rotate the CSG object
        const angle = time * 0.5;
        const s = Math.sin(angle * 0.5);
        const c = Math.cos(angle * 0.5);

        // Rotate around Y axis
        csgNode.transform.rotation = { x: 0, y: s, z: 0, w: c };
        csgNode.transform.updateLocalMatrix();

        wireframeNode.transform.rotation = csgNode.transform.rotation;
        wireframeNode.transform.updateLocalMatrix();
    }

    return { scene, animate };
}
