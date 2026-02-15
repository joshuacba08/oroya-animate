# Principios de Programación — Oroya Animate

Principios y convenciones que guían el desarrollo del monorepo. Nacen de lecciones aprendidas durante la evolución del proyecto.

---

## 1. Arquitectura

### 1.1 Dependencias en una sola dirección

```
@oroya/core ← renderers ← loaders ← apps
```

- `@oroya/core` **nunca** importa de renderers, loaders ni de librerías externas de rendering (Three.js, etc.).
- Los renderers solo importan de `@oroya/core`.
- Las apps importan de cualquier paquete.

> **Por qué:** Mantener el core desacoplado permite que funcione en cualquier entorno (browser, Node.js, WebWorkers) y que se puedan agregar nuevos renderers sin tocar el core.

### 1.2 Contract-first para interfaces compartidas

Antes de que un paquete downstream use una propiedad nueva, esa propiedad **debe existir primero** en la interfaz del paquete upstream.

```typescript
// ✅ Primero definir en @oroya/core
export interface MaterialDef {
  fill?: ColorRGB;
}

// ✅ Luego usar en @oroya/renderer-svg
const fill = material.definition.fill;
```

```typescript
// ❌ Nunca usar propiedades que no están en la interfaz
const fill = (material.definition as any).fill;
```

> **Por qué:** Evita errores de compilación silenciosos y asegura que la API del core sea la fuente de verdad.

---

## 2. Módulos y exports

### 2.1 Barrel files obligatorios

Cada directorio que se importe como módulo **debe** tener un `index.ts` que re-exporte todo lo público.

```
components/
├── index.ts          ← obligatorio si se importa como '../components'
├── Component.ts
├── Transform.ts
└── Geometry.ts
```

```typescript
// components/index.ts
export { Component, ComponentType } from './Component';
export { Transform } from './Transform';
export { Geometry } from './Geometry';
```

> **Por qué:** Sin barrel file, esbuild y TypeScript no pueden resolver imports a directorios.

### 2.2 Extensiones de `package.json` deben coincidir con la salida real

Verificar qué archivos genera tsup **antes** de escribir `exports` en `package.json`:

| `"type"` del package | Formato | Extensión |
|---------------------|---------|-----------|
| `"module"` | ESM | `.js` |
| `"module"` | CJS | `.cjs` |
| sin `"type"` | ESM | `.mjs` |
| sin `"type"` | CJS | `.js` |

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 2.3 `types` siempre primero en `exports`

La condición `types` debe ser la **primera** en el objeto de exports. Node.js evalúa las condiciones en orden, y si `import` o `require` vienen antes, `types` nunca se alcanza.

---

## 3. TypeScript

### 3.1 Strict mode siempre

El `tsconfig.base.json` tiene `"strict": true`. Nunca desactivar flags individuales de strictness. Esto incluye:

- `noImplicitAny` — todo debe tener tipo explícito o inferido.
- `noUnusedLocals` — no dejar imports o variables sin usar.
- `noUnusedParameters` — no dejar parámetros sin usar.

### 3.2 No usar `any` como escape

```typescript
// ❌
const data = response as any;

// ✅
interface ApiResponse { ... }
const data = response as ApiResponse;
```

Si TypeScript no puede inferir un tipo, crear una interfaz. Si es un tipo externo, instalar `@types/*`.

### 3.3 Cada paquete declara sus propias `@types/*`

En un monorepo, las dependencias de tipos **no se comparten** entre paquetes. Si `renderer-three` tiene `@types/three`, `loader-gltf` igual necesita declararlo por separado.

```json
// ❌ "Ya está instalado en otro paquete"
// ✅ Declararlo explícitamente
{
  "devDependencies": {
    "@types/three": "^0.165.0"
  }
}
```

### 3.4 `composite: false` para paquetes que usan tsup

tsup maneja la generación de `.d.ts` con su propio worker. La opción `composite: true` (heredada del base) entra en conflicto. Cada paquete debe sobreescribirla:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": false
  }
}
```

---

## 4. Código limpio

### 4.1 No dejar imports sin usar

Eliminar imports que no se usen. Configura tu editor para organizar imports al guardar.

### 4.2 Usar escape sequences en strings

Nunca insertar saltos de línea literales dentro de strings con comillas simples/dobles:

```typescript
// ❌ Salto de línea literal rompe la compilación
paths.join('
    ')

// ✅ Usar escape sequence
paths.join('\n    ')
```

### 4.3 Un componente, una responsabilidad

Cada `Component` en el sistema ECS debe representar **un solo aspecto** del nodo:

- `Transform` → posición, rotación, escala
- `Geometry` → forma geométrica
- `Material` → apariencia visual
- `Camera` → proyección y viewport

No mezclar datos de geometría con datos de material en un mismo componente.

---

## 5. Monorepo

### 5.1 Siempre `pnpm build` antes de `pnpm dev`

Los paquetes del workspace se resuelven a través de sus `dist/`. Si no hay build previo, el dev server falla.

**Workflow recomendado:**

```bash
pnpm build         # compilar todos los paquetes
pnpm dev:react     # ahora sí, iniciar la demo
```

Para desarrollo continuo, usar `tsup --watch` en los paquetes:

```bash
# Terminal 1: watch en paquetes
pnpm --filter "./packages/**" dev

# Terminal 2: dev server
pnpm dev:react
```

### 5.2 Dependencias explícitas por paquete

Cada paquete en el workspace debe declarar **todas** sus dependencias en su propio `package.json`. No asumir que algo está disponible porque otro paquete lo tiene instalado.

### 5.3 Versiones consistentes

Todas las instancias de una misma dependencia en el monorepo deben usar la misma versión. Usar herramientas como [syncpack](https://jamiemason.github.io/syncpack/) para verificar esto.

---

## 6. Validación

### 6.1 Build completo como gate de calidad

Antes de hacer commit o pull request, ejecutar:

```bash
pnpm build      # ¿compila todo?
pnpm test       # ¿pasan los tests?
pnpm typecheck  # ¿los tipos son correctos?
```

### 6.2 Herramientas recomendadas

| Qué valida | Herramienta |
|------------|-------------|
| Exports de `package.json` apuntan a archivos reales | [publint](https://publint.dev/) |
| Tipos se resuelven correctamente para consumidores | [arethetypeswrong](https://arethetypeswrong.github.io/) |
| Imports se resuelven correctamente | `eslint-plugin-import` |
| Versiones consistentes en el monorepo | `syncpack` |
| Imports no usados | `noUnusedLocals` + editor auto-organize |

---

## Resumen rápido

| Principio | Regla clave |
|-----------|-------------|
| Dependencias unidireccionales | Core → Renderers → Apps. Nunca al revés. |
| Barrel files | Directorio importado = necesita `index.ts` |
| Extensiones correctas | Verificar la salida real de tsup |
| `types` primero | Siempre primera condición en `exports` |
| Strict mode | Nunca usar `any` ni desactivar checks |
| Tipos propios | Cada paquete declara sus `@types/*` |
| Build antes de dev | `pnpm build` antes de `pnpm dev:*` |
| Contract-first | Definir la interfaz antes de usarla |
