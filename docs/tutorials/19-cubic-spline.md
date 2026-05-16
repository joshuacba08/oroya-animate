# Tutorial 19: Animaciones suaves con Cubic Spline 🔴

> **Nivel:** Avanzado  
> **Tiempo estimado:** 25 minutos  
> **Qué aprenderás:** Crear animaciones fluidas usando interpolación cubic spline (Hermite), entender las tangentes, comparar con linear/step, y usar el `AnimationMixer` con tracks cubic spline.

---

## ¿Por qué Cubic Spline?

La interpolación determina **cómo** se calcula el valor entre dos keyframes:

```
Posición Y
  │
  ●━━━━━━━━━━━━━●          ← STEP: salto brusco
  │               │
  │   ╱────────╲  │          ← LINEAR: línea recta
  │  ╱          ╲ │
  │ ╱    ⌒⌒⌒⌒    ╲│          ← CUBIC SPLINE: curva suave
  ●╱              ╲●
  └────────────────────── Tiempo
  t=0             t=1
```

| Modo | Movimiento | Caso de uso |
|------|------------|-------------|
| `step` | Salto instantáneo | Sprites, estados discretos |
| `linear` | Línea recta | Movimiento mecánico, simple |
| `cubicspline` | **Curva suave** | Animación natural, orgánica |

Cubic spline usa **tangentes** para controlar la aceleración y desaceleración, produciendo movimiento con *ease-in/ease-out* natural.

---

## Paso 1: La matemática (simplificada)

La función `cubicSpline` implementa un **spline de Hermite cúbico**:

```
h(t) = (2t³ - 3t² + 1) · p0      // Valor inicial
     + (t³ - 2t² + t)  · m0       // Tangente de salida
     + (-2t³ + 3t²)    · p1       // Valor final
     + (t³ - t²)       · m1       // Tangente de entrada
```

Donde:
- `t` → Progreso entre 0 y 1
- `p0` → Valor en el keyframe actual
- `p1` → Valor en el siguiente keyframe
- `m0` → Tangente de salida (velocidad al salir del keyframe actual)
- `m1` → Tangente de entrada (velocidad al llegar al siguiente keyframe)

```typescript
import { cubicSpline } from '@joroya/core';

// Ejemplo: interpolar entre 0 y 10 con tangentes
const t = 0.5; // Mitad del camino
const value = cubicSpline(
  t,
  0,    // p0: valor inicial
  5,    // m0: tangente de salida (impulso hacia arriba)
  10,   // p1: valor final
  -2,   // m1: tangente de entrada (frena al llegar)
);
console.log(value); // ~6.875 (no es 5, porque las tangentes lo curvan)
```

---

## Paso 2: Hermite para vectores 3D

Para animar posición, rotación y escala, usa `hermite` que trabaja con vectores `Vec3`:

```typescript
import { hermite } from '@joroya/core';

const position = hermite(
  0.5,                           // t
  { x: 0, y: 0, z: 0 },        // p0: posición inicial
  { x: 0, y: 10, z: 0 },       // m0: tangente → lanzar hacia arriba
  { x: 5, y: 0, z: 0 },        // p1: posición final
  { x: 0, y: -5, z: 0 },       // m1: tangente → caer suavemente
);
console.log(position); // { x: 2.5, y: 3.125, z: 0 }
```

---

## Paso 3: KeyframeTrack con Cubic Spline

En el sistema de animación de Oroya, un `KeyframeTrack` con interpolación `'cubicspline'` almacena los datos en un formato especial:

```
Para cada keyframe: [in-tangent, value, out-tangent]
```

### Formato para posición/escala (3 componentes × 3 = 9 valores por keyframe)

```typescript
import type { KeyframeTrack } from '@joroya/core';

const positionTrack: KeyframeTrack = {
  targetNodeName: 'ball',
  property: 'position',
  times: new Float32Array([0, 1, 2]),  // 3 keyframes
  values: new Float32Array([
    // Keyframe 0 (t=0):
    0, 0, 0,     // in-tangent  (ignorado en el primer KF)
    0, 0, 0,     // value       → posición (0, 0, 0)
    0, 5, 0,     // out-tangent → lanza hacia arriba

    // Keyframe 1 (t=1):
    0, 0, 0,     // in-tangent  → llega con velocidad 0
    0, 3, 0,     // value       → posición (0, 3, 0)
    0, 0, 0,     // out-tangent → sale con velocidad 0

    // Keyframe 2 (t=2):
    0, -5, 0,    // in-tangent  → cae rápido
    0, 0, 0,     // value       → posición (0, 0, 0)
    0, 0, 0,     // out-tangent (ignorado en el último KF)
  ]),
  interpolation: 'cubicspline',
};
```

### Visualización del layout de datos

```
values array: [it₀ᵢ, v₀, ot₀, it₁, v₁, ot₁, it₂, v₂, ot₂]
               ╰──KF 0──╯  ╰──KF 1──╯  ╰──KF 2──╯

Cada grupo (it, v, ot) tiene N componentes:
  - position/scale: 3 (x, y, z) → 9 valores/KF
  - rotation: 4 (x, y, z, w) → 12 valores/KF
```

---

## Paso 4: Ejemplo completo — Bola rebotando

```typescript
import {
  Scene, Node, Camera, CameraType,
  createSphere, Material, AnimationMixer,
} from '@joroya/core';
import type { AnimationClip, KeyframeTrack } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const scene = new Scene();

// Cámara
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
cam.transform.position = { x: 0, y: 3, z: 8 };
scene.add(cam);

// Esfera que rebota
const ball = new Node('ball');
ball.addComponent(createSphere(0.5, 32, 32));
ball.addComponent(new Material({ color: { r: 1.0, g: 0.4, b: 0.2 } }));
scene.add(ball);
```

---

## Paso 5: Definir la animación cubic spline

```typescript
// Track de posición: rebote suave con ease-in/ease-out
const bounceTrack: KeyframeTrack = {
  targetNodeName: 'ball',
  property: 'position',
  times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
  values: new Float32Array([
    // KF 0 (t=0): En el suelo
    0, 0, 0,       // in-tangent
    0, 0, 0,       // value: suelo
    0, 8, 0,       // out-tangent: impulso fuerte hacia arriba

    // KF 1 (t=0.5): Punto más alto
    0, 0, 0,       // in-tangent: llega desacelerando
    0, 4, 0,       // value: punto más alto
    0, 0, 0,       // out-tangent: empieza a caer

    // KF 2 (t=1.0): Rebote en el suelo
    0, -8, 0,      // in-tangent: impacta rápido
    0, 0, 0,       // value: suelo
    0, 5, 0,       // out-tangent: rebote más bajo

    // KF 3 (t=1.5): Segundo punto alto (más bajo)
    0, 0, 0,       // in-tangent
    0, 2, 0,       // value: más bajo que antes
    0, 0, 0,       // out-tangent

    // KF 4 (t=2.0): Reposo
    0, -3, 0,      // in-tangent
    0, 0, 0,       // value: suelo
    0, 0, 0,       // out-tangent
  ]),
  interpolation: 'cubicspline',
};

// Track de escala: "squash & stretch"
const squashTrack: KeyframeTrack = {
  targetNodeName: 'ball',
  property: 'scale',
  times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
  values: new Float32Array([
    // KF 0: Squash al despegar
    0, 0, 0,
    1.2, 0.8, 1.2,   // Aplastada
    0, 0, 0,

    // KF 1: Stretch en el aire
    0, 0, 0,
    0.85, 1.3, 0.85, // Estirada
    0, 0, 0,

    // KF 2: Squash al aterrizar
    0, 0, 0,
    1.3, 0.7, 1.3,   // Muy aplastada
    0, 0, 0,

    // KF 3: Stretch menor
    0, 0, 0,
    0.9, 1.15, 0.9,
    0, 0, 0,

    // KF 4: Normal
    0, 0, 0,
    1, 1, 1,          // Forma original
    0, 0, 0,
  ]),
  interpolation: 'cubicspline',
};

// Crear el clip de animación
const bounceClip: AnimationClip = {
  name: 'bounce',
  duration: 2.0,
  tracks: [bounceTrack, squashTrack],
};
```

---

## Paso 6: Reproducir con AnimationMixer

```typescript
const mixer = new AnimationMixer(scene);
mixer.play(bounceClip);

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let lastTime = performance.now();

function animate() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  mixer.update(dt);
  renderer.render();
  requestAnimationFrame(animate);
}
animate();
```

---

## Paso 7: Comparación visual — Linear vs Cubic Spline

Crea tres esferas con la misma trayectoria pero diferente interpolación:

```typescript
// Esfera con step
const stepBall = new Node('step-ball');
stepBall.addComponent(createSphere(0.3, 16, 16));
stepBall.addComponent(new Material({ color: { r: 0.8, g: 0.3, b: 0.3 } }));
stepBall.transform.position.x = -3;
scene.add(stepBall);

// Esfera con linear
const linearBall = new Node('linear-ball');
linearBall.addComponent(createSphere(0.3, 16, 16));
linearBall.addComponent(new Material({ color: { r: 0.3, g: 0.8, b: 0.3 } }));
scene.add(linearBall);

// Esfera con cubic spline
const cubicBall = new Node('cubic-ball');
cubicBall.addComponent(createSphere(0.3, 16, 16));
cubicBall.addComponent(new Material({ color: { r: 0.3, g: 0.5, b: 1.0 } }));
cubicBall.transform.position.x = 3;
scene.add(cubicBall);

// Mismos keyframes, distinta interpolación
const makeTrack = (name: string, interp: 'step' | 'linear' | 'cubicspline'): KeyframeTrack => {
  if (interp === 'cubicspline') {
    return {
      targetNodeName: name,
      property: 'position',
      times: new Float32Array([0, 1, 2]),
      values: new Float32Array([
        0, 0, 0,   0, 0, 0,   0, 5, 0,   // KF 0
        0, 0, 0,   0, 3, 0,   0, 0, 0,   // KF 1
        0, -5, 0,  0, 0, 0,   0, 0, 0,   // KF 2
      ]),
      interpolation: 'cubicspline',
    };
  }
  return {
    targetNodeName: name,
    property: 'position',
    times: new Float32Array([0, 1, 2]),
    values: new Float32Array([0, 0, 0, 0, 3, 0, 0, 0, 0]),
    interpolation: interp,
  };
};

const comparisonClip: AnimationClip = {
  name: 'comparison',
  duration: 2,
  tracks: [
    makeTrack('step-ball', 'step'),
    makeTrack('linear-ball', 'linear'),
    makeTrack('cubic-ball', 'cubicspline'),
  ],
};

mixer.play(comparisonClip);
```

### Resultado visual

- **Roja (step):** Teletransporta entre posiciones — saltos discretos.
- **Verde (linear):** Se mueve en línea recta — cambios de dirección bruscos.
- **Azul (cubic spline):** Curva suave — desacelera al subir, acelera al bajar.

---

## Paso 8: Control de tangentes

Las tangentes determinan la "forma" de la curva:

| Tangente de salida (out) | Efecto |
|--------------------------|--------|
| `(0, 0, 0)` | Sale lento (ease-out) |
| `(0, 10, 0)` | Sale rápido hacia arriba |
| `(5, 0, 0)` | Sale rápido hacia la derecha |

| Tangente de entrada (in) | Efecto |
|--------------------------|--------|
| `(0, 0, 0)` | Llega suave (ease-in) |
| `(0, -10, 0)` | Llega rápido desde arriba |

> **Tip:** Para movimiento natural, usa tangentes **simétricas** (in-tangent ≈ -out-tangent). Para efectos dramáticos, usa tangentes **asimétricas**.

---

## Rotaciones con Cubic Spline

Para rotaciones (quaterniones), el formato tiene **4 componentes** (x, y, z, w) → **12 valores por keyframe**:

```typescript
const rotationTrack: KeyframeTrack = {
  targetNodeName: 'ball',
  property: 'rotation',
  times: new Float32Array([0, 1]),
  values: new Float32Array([
    // KF 0:
    0, 0, 0, 0,     // in-tangent (4 componentes)
    0, 0, 0, 1,     // value: quaternion identidad
    0, 1, 0, 0,     // out-tangent

    // KF 1:
    0, -1, 0, 0,    // in-tangent
    0, 0.707, 0, 0.707, // value: 90° en Y
    0, 0, 0, 0,     // out-tangent
  ]),
  interpolation: 'cubicspline',
};
```

> **Nota:** El `AnimationMixer` usa SLERP para interpolar quaterniones, incluso en modo cubic spline, para evitar artefactos de normalización.

---

## Referencia: funciones de interpolación

```typescript
// Escalar
import { cubicSpline } from '@joroya/core';
const y = cubicSpline(t, p0, m0, p1, m1);

// Vectorial (Vec3)
import { hermite } from '@joroya/core';
const pos = hermite(t, p0, m0, p1, m1);
```

---

## Código completo

```typescript
import {
  Scene, Node, Camera, CameraType,
  createSphere, createBox, Material, AnimationMixer,
} from '@joroya/core';
import type { AnimationClip, KeyframeTrack } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const scene = new Scene();

// Cámara
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
cam.transform.position = { x: 0, y: 3, z: 10 };
scene.add(cam);

// Suelo
const ground = new Node('ground');
ground.addComponent(createBox(15, 0.05, 5));
ground.addComponent(new Material({ color: { r: 0.25, g: 0.25, b: 0.3 } }));
ground.transform.position.y = -0.5;
scene.add(ground);

// Bola con cubic spline bounce
const ball = new Node('ball');
ball.addComponent(createSphere(0.5, 32, 32));
ball.addComponent(new Material({ color: { r: 1.0, g: 0.4, b: 0.2 } }));
scene.add(ball);

const bounceTrack: KeyframeTrack = {
  targetNodeName: 'ball',
  property: 'position',
  times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
  values: new Float32Array([
    0,0,0,  0,0,0,  0,8,0,
    0,0,0,  0,4,0,  0,0,0,
    0,-8,0, 0,0,0,  0,5,0,
    0,0,0,  0,2,0,  0,0,0,
    0,-3,0, 0,0,0,  0,0,0,
  ]),
  interpolation: 'cubicspline',
};

const bounceClip: AnimationClip = {
  name: 'bounce',
  duration: 2.0,
  tracks: [bounceTrack],
};

const mixer = new AnimationMixer(scene);
mixer.play(bounceClip);

// Renderer
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let lastTime = performance.now();
function animate() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  mixer.update(dt);
  renderer.render();
  requestAnimationFrame(animate);
}
animate();
```

---

## ¿Qué sigue?

Has completado el tutorial de cubic spline y ya estás usando APIs disponibles en v1.0. Ahora puedes:

- Combinar **luces** (Tutorial 18) con **modelos glTF** (Tutorial 16) para escenas realistas.
- Usar **CSG** (Tutorial 17) con animaciones cubic spline para efectos avanzados.
- Renderizar en **Canvas2D** (Tutorial 15) para experiencias 2D de alto rendimiento.
- Exportar escenas animadas con `serialize(scene)` para persistencia.

⬅️ [Volver al índice de tutoriales](./README.md)
