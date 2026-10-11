import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";

export function createNestedTransforms() {
  const scene = new Scene();
  const ntDepth = 3;

  const ntCam = new Node("camera");
  ntCam.addComponent(new Camera({ type: CameraType.Orthographic, left: -10, right: 10, top: -10, bottom: 10, near: 0.1, far: 100 }));
  ntCam.transform.position = { x: 0, y: 0, z: 5 };
  scene.add(ntCam);

  const ntColors = [
    { r: 0.9, g: 0.3, b: 0.3 }, { r: 0.3, g: 0.7, b: 0.9 },
    { r: 0.3, g: 0.9, b: 0.4 }, { r: 0.9, g: 0.7, b: 0.2 },
    { r: 0.8, g: 0.3, b: 0.8 },
  ];

  let currentParent: Node = scene.root;
  const ntNodes: Node[] = [];
  for (let i = 0; i < ntDepth; i++) {
    const size = 2 - i * 0.3;
    const offset = 3 - i * 0.5;
    const node = new Node(`level - ${i} `);
    node.addComponent(createBox(size, size, 0.1));
    node.addComponent(new Material({ fill: ntColors[i % ntColors.length], stroke: { r: 0.1, g: 0.1, b: 0.1 }, strokeWidth: 0.1, opacity: 0.8 }));
    node.transform.position = { x: offset, y: 0, z: 0 };
    currentParent.add(node);
    ntNodes.push(node);
    currentParent = node;
    const pivot = new Node(`pivot - ${i} `);
    pivot.addComponent(createSphere(0.2, 12, 12));
    pivot.addComponent(new Material({ fill: { r: 0.2, g: 0.2, b: 0.2 }, opacity: 0.9 }));
    node.add(pivot);
  }

  function animate(time: number) {
    ntNodes.forEach((node, i) => {
      const rotationSpeed = 0.5 * (1 + i * 0.3);
      const angle = time * rotationSpeed + i * Math.PI / 4;
      node.transform.rotation = { x: 0, y: 0, z: Math.sin(angle / 2), w: Math.cos(angle / 2) };
      node.transform.updateLocalMatrix();
    });
  }

  return { scene, animate };
}
