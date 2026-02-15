# Tutorial 6: Cámaras y Puntos de Vista 🟡

> **Nivel:** Intermedio  
> **Tiempo estimado:** 15 minutos  
> **Qué aprenderás:** Posicionar cámaras, cambiar puntos de vista dinámicamente, y entender cómo la cámara como nodo del scene graph hereda transforms.

---

## Concepto: Cámaras como nodos

En Oroya Animate, la cámara es un **nodo más** del scene graph. Esto significa:

- Puede tener un padre y heredar su transform.
- Puede moverse y animarse como cualquier otro nodo.
- Se puede cambiar de cámara activa reconstruyendo la escena.

---

## Paso 1: Crear una escena con objetos de referencia

```typescript
import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

const scene = new Scene();

// Suelo (caja plana)
const floor = new Node('floor');
floor.addComponent(createBox(20, 0.1, 20));
floor.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.35 } }));
floor.transform.position = { x: 0, y: -1, z: 0 };
scene.add(floor);

// Tres pilares como referencia
const colors = [
  { r: 0.9, g: 0.2, b: 0.2 },
  { r: 0.2, g: 0.9, b: 0.3 },
  { r: 0.2, g: 0.4, b: 0.9 },
];

for (let i = 0; i < 3; i++) {
  const pillar = new Node(`pillar-${i}`);
  const height = 1 + i;
  pillar.addComponent(createBox(0.5, height, 0.5));
  pillar.addComponent(new Material({ color: colors[i] }));
  pillar.transform.position = { x: (i - 1) * 3, y: height / 2 - 1, z: 0 };
  scene.add(pillar);
}

// Esfera central
const sphere = new Node('center-sphere');
sphere.addComponent(createSphere(0.8, 32, 32));
sphere.addComponent(new Material({ color: { r: 1.0, g: 0.8, b: 0.0 } }));
sphere.transform.position = { x: 0, y: 0.5, z: 3 };
scene.add(sphere);
```

---

## Paso 2: Definir múltiples cámaras

```typescript
// Cámara frontal
const frontCam = new Node('front-camera');
frontCam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
frontCam.transform.position = { x: 0, y: 2, z: 10 };
scene.add(frontCam);

// Cámara cenital (desde arriba)
const topCam = new Node('top-camera');
topCam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
topCam.transform.position = { x: 0, y: 15, z: 0.1 };
scene.add(topCam);

// Cámara lateral
const sideCam = new Node('side-camera');
sideCam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 45,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
sideCam.transform.position = { x: 12, y: 3, z: 4 };
scene.add(sideCam);
```

> **Nota:** `ThreeRenderer` usa la **primera** cámara que encuentra en el traverse del scene graph. Para cambiar la cámara activa, podemos reordenar las cámaras o remontarla escena.

---

## Paso 3: Cambiar de cámara con el teclado

```typescript
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});

const cameras = [frontCam, topCam, sideCam];
const cameraNames = ['Frontal', 'Cenital', 'Lateral'];
let activeCameraIndex = 0;

function switchCamera(index: number) {
  // Mover la cámara activa al inicio del árbol
  // Removemos todas las cámaras y re-agregamos con la seleccionada primero
  cameras.forEach(cam => scene.remove(cam));
  
  activeCameraIndex = index;
  scene.add(cameras[activeCameraIndex]); // Primera cámara = activa
  cameras.forEach((cam, i) => {
    if (i !== activeCameraIndex) scene.add(cam);
  });

  renderer.mount(scene); // Re-montar para que detecte la nueva cámara
  console.log(`📷 Cámara activa: ${cameraNames[activeCameraIndex]}`);
}

// Escuchar teclado
document.addEventListener('keydown', (e) => {
  if (e.key === '1') switchCamera(0);
  if (e.key === '2') switchCamera(1);
  if (e.key === '3') switchCamera(2);
});

// Render inicial
switchCamera(0);

function animate() {
  renderer.render();
  requestAnimationFrame(animate);
}
animate();
```

---

## Paso 4: Cámara animada (dolly shot)

Una cámara que se mueve suavemente en un arco:

```typescript
let time = 0;

function animate() {
  time += 0.005;

  // Mover la cámara activa en un arco
  if (activeCameraIndex === 0) {
    const cam = cameras[0];
    cam.transform.position = {
      x: Math.sin(time) * 10,
      y: 2 + Math.sin(time * 2) * 1,
      z: Math.cos(time) * 10,
    };
    cam.transform.updateLocalMatrix();
  }

  renderer.render();
  requestAnimationFrame(animate);
}

animate();
```

---

## Concepto: Cámara adjunta a un nodo

La cámara puede ser hija de un nodo en movimiento. Por ejemplo, una "cámara de seguimiento" adjunta a un personaje:

```typescript
const character = new Node('character');
character.addComponent(createBox(0.5, 1, 0.5));
character.addComponent(new Material({ color: { r: 0.3, g: 0.8, b: 0.5 } }));
scene.add(character);

// Cámara hija del personaje, desplazada hacia atrás y arriba
const followCam = new Node('follow-camera');
followCam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 70,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
followCam.transform.position = { x: 0, y: 3, z: 8 }; // Offset relativo al personaje
character.add(followCam);

// Cuando el personaje se mueve, la cámara lo sigue automáticamente
character.transform.position = { x: 5, y: 0, z: 0 };
character.transform.updateLocalMatrix();
// → La cámara ahora está en (5, 3, 8) en coordenadas del mundo
```

---

## Resultado

Una escena con múltiples puntos de vista intercambiables con el teclado (`1`, `2`, `3`) y una cámara animada que orbita la escena. 🎥

---

## Siguiente tutorial

➡️ [Tutorial 7: Ciudad Procedural](./07-procedural-city.md) — generación algorítmica.
