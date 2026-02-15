# Renderers

Los renderers de Oroya Animate son **traductores** que convierten el scene graph agnóstico en salida visual. El core no conoce a los renderers — cada uno lee el scene graph y produce su propia representación.

---

## Visión general

```mermaid
graph TD
    SG["Scene Graph\n(@oroya/core)"]
    R3["ThreeRenderer\n(@oroya/renderer-three)"]
    RS["renderToSVG\n(@oroya/renderer-svg)"]
    WEBGL["WebGL Canvas (3D)"]
    SVG["SVG String (2D)"]

    SG -->|"mount + render"| R3
    SG -->|"function call"| RS
    R3 --> WEBGL
    RS --> SVG
```

| Aspecto | `ThreeRenderer` | `renderToSVG` |
|---------|----------------|---------------|
| **Paradigma** | Instancia con estado (class) | Función pura (stateless) |
| **Output** | Dibuja en un `<canvas>` | Retorna un `string` SVG |
| **Requiere DOM** | ✅ Sí (`HTMLCanvasElement`) | ❌ No (funciona en Node.js) |
| **3D** | ✅ Perspectiva, luces, sombras | ❌ Solo 2D |
| **Vectorial** | ❌ Rasterizado | ✅ Infinitamente escalable |

---

## `@oroya/renderer-three` — Three.js (WebGL)

El renderer principal para visualización 3D interactiva.

### Setup

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: window.devicePixelRatio,  // opcional
});
```

### Opciones del constructor

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `canvas` | `HTMLCanvasElement` | *(requerido)* | Elemento canvas destino |
| `width` | `number` | *(requerido)* | Ancho del viewport |
| `height` | `number` | *(requerido)* | Alto del viewport |
| `dpr` | `number` | `window.devicePixelRatio` | Device pixel ratio (HiDPI) |

### Métodos

| Método | Descripción |
|--------|-------------|
| `mount(scene)` | Conecta una escena. Reconstruye la escena Three.js, detecta la cámara activa, agrega luces |
| `render()` | Sincroniza transforms, propaga matrices y dibuja un frame |
| `dispose()` | Libera recursos WebGL |

### Ciclo de vida

```mermaid
sequenceDiagram
    participant U as User Code
    participant TR as ThreeRenderer
    participant TS as THREE.Scene

    Note over U,TS: Montaje
    U->>TR: mount(scene)
    TR->>TS: clear + add lights
    TR->>TR: traverse → create Mesh/Group/Camera per node
    TR->>TR: Set first Camera as activeCamera

    Note over U,TS: Render loop
    loop requestAnimationFrame
        U->>TR: render()
        TR->>TR: updateWorldMatrices()
        TR->>TS: sync worldMatrix → Three.js objects
        TR->>TR: webglRenderer.render()
    end
```

### Traducción de componentes

| Nodo Oroya | Objeto Three.js |
|------------|-----------------|
| Node sin Geometry ni Camera | `THREE.Group` |
| Node + `Geometry(Box)` | `THREE.Mesh(BoxGeometry)` |
| Node + `Geometry(Sphere)` | `THREE.Mesh(SphereGeometry)` |
| Node + `Geometry(Path2D)` | ❌ Ignorado |
| Node + `Camera(Perspective)` | `THREE.PerspectiveCamera` |
| `Material` con `color` | `MeshStandardMaterial({ color })` |
| `Material` con `opacity < 1` | `MeshStandardMaterial({ transparent: true })` |
| Sin `Material` | `MeshStandardMaterial({ color: 0xcccccc })` |

### Iluminación automática

| Tipo | Config |
|------|--------|
| `AmbientLight` | Blanco, intensidad `0.5` |
| `DirectionalLight` | Blanco, intensidad `1.5`, posición `(2, 5, 3)` |

### Resolución de cámaras

```mermaid
flowchart TD
    START["mount(scene)"] --> TRAVERSE["Traverse scene graph"]
    TRAVERSE --> FOUND{"¿Encontró Camera?"}
    FOUND -->|"Sí"| USE["Usar primera como activa"]
    FOUND -->|"No"| FALLBACK["Fallback: PerspectiveCamera, FOV 75, z=5"]
```

### Ejemplo completo

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

const scene = new Scene();

const cam = new Node('cam');
cam.addComponent(new Camera({
  type: CameraType.Perspective, fov: 75,
  aspect: window.innerWidth / window.innerHeight, near: 0.1, far: 1000,
}));
cam.transform.position.z = 5;
scene.add(cam);

const box = new Node('box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 0.2, g: 0.6, b: 1.0 } }));
scene.add(box);

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth, height: window.innerHeight,
});
renderer.mount(scene);

function loop() {
  box.transform.rotation.y = performance.now() * 0.001;
  box.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## `@oroya/renderer-svg` — SVG (2D)

Renderer ligero que genera markup SVG. Ideal para arte generativo, exportación vectorial y server-side rendering.

### API

```typescript
import { renderToSVG } from '@oroya/renderer-svg';

const svg: string = renderToSVG(scene, { width: 400, height: 300 });
```

### Opciones

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `width` | `number` | *(requerido)* | Ancho del SVG |
| `height` | `number` | *(requerido)* | Alto del SVG |
| `viewBox` | `string` | `"0 0 {width} {height}"` | viewBox personalizado |

### Pipeline

```mermaid
flowchart TD
    START["renderToSVG(scene, opts)"] --> TRAVERSE["scene.traverse()"]
    TRAVERSE --> CHECK{"¿Geometry(Path2D)?"}
    CHECK -->|"No"| SKIP["Ignorar"]
    CHECK -->|"Sí"| PATH["Generar path d='...'"]
    PATH --> MAT{"¿Material?"}
    MAT -->|"Sí"| STYLE["fill + stroke + stroke-width"]
    MAT -->|"No"| NONE["fill='none'"]
    STYLE --> COLLECT["→ array"]
    NONE --> COLLECT
    COLLECT -->|"Fin"| BUILD["Construir svg string"]
```

### Propiedades del material para SVG

| Campo | Tipo | Efecto SVG | Si ausente |
|-------|------|-----------|------------|
| `fill` | `ColorRGB` | `fill="rgb(R,G,B)"` | `fill="none"` |
| `stroke` | `ColorRGB` | `stroke="rgb(R,G,B)"` | Sin stroke |
| `strokeWidth` | `number` | `stroke-width="N"` | `1` |

### Ejemplo

```typescript
const triangle = new Node('triangle');
triangle.addComponent(createPath2D([
  { command: 'M', args: [200, 50] },
  { command: 'L', args: [350, 250] },
  { command: 'L', args: [50, 250] },
  { command: 'Z', args: [] },
]));
triangle.addComponent(new Material({
  fill: { r: 0.2, g: 0.8, b: 0.4 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2,
}));
scene.add(triangle);

const svg = renderToSVG(scene, { width: 400, height: 300 });
```

### Casos de uso

| Caso | Ventaja |
|------|---------|
| Exportar a .svg | Abrir en Figma, Illustrator, Inkscape |
| Server-side rendering | Node.js sin DOM |
| Arte generativo | Patrones procedurales como vectores |
| Impresión | Escalable sin pérdida |

---

## Comparación entre renderers

### Soporte de geometrías

| Geometría | Three.js | SVG |
|-----------|----------|-----|
| `Box` | ✅ | ❌ |
| `Sphere` | ✅ | ❌ |
| `Path2D` | ❌ | ✅ |

### Soporte de material

| Propiedad | Three.js | SVG |
|-----------|----------|-----|
| `color` | ✅ | ❌ |
| `opacity` | ✅ | ❌ |
| `fill` | ❌ | ✅ |
| `stroke` | ❌ | ✅ |
| `strokeWidth` | ❌ | ✅ |

---

## Crear un renderer personalizado

El contrato es simple — implementar `mount`, `render` y `dispose`:

```typescript
import { Scene, ComponentType, Geometry, Material, GeometryPrimitive } from '@oroya/core';

export class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;
  private scene: Scene | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  mount(scene: Scene): void { this.scene = scene; }

  render(): void {
    if (!this.scene) return;
    this.scene.updateWorldMatrices();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.scene.traverse(node => {
      const geo = node.getComponent<Geometry>(ComponentType.Geometry);
      if (!geo) return;
      const mat = node.getComponent<Material>(ComponentType.Material);
      const wm = node.transform.worldMatrix;

      this.ctx.save();
      this.ctx.translate(wm[12], wm[13]);

      if (geo.definition.type === GeometryPrimitive.Box) {
        const { width, height } = geo.definition;
        if (mat?.definition.color) {
          const c = mat.definition.color;
          this.ctx.fillStyle = `rgb(${c.r*255},${c.g*255},${c.b*255})`;
        }
        this.ctx.fillRect(-width/2, -height/2, width, height);
      }
      this.ctx.restore();
    });
  }

  dispose(): void { this.scene = null; }
}
```

### Checklist

| Paso | Descripción |
|------|-------------|
| 1 | Crear paquete en `packages/renderer-xxx/` |
| 2 | Agregar `@oroya/core` como dependencia |
| 3 | Implementar `mount()` — recorrer árbol y crear objetos |
| 4 | Implementar `render()` — sincronizar transforms y dibujar |
| 5 | Implementar `dispose()` — liberar recursos |
| 6 | Documentar geometrías y materiales soportados |
