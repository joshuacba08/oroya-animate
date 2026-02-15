# Build Errors Postmortem

Este documento detalla los errores de configuración encontrados en el monorepo, sus causas raíz, consecuencias, y las mejores prácticas para evitarlos en el futuro.

---

## 1. Barrel file faltante en `components/`

### Error

```
X [ERROR] Could not resolve "../components"
    src/geometry/primitives.ts:1:98
    src/nodes/Node.ts:2:52
    src/serialization/json.ts:3:72
```

### Causa

Los archivos `primitives.ts`, `Node.ts` y `json.ts` importaban desde `'../components'` (un directorio), pero no existía un archivo `index.ts` dentro de `components/` que re-exportara los módulos. Node.js y los bundlers como esbuild no resuelven directorios automáticamente sin un barrel file.

### Consecuencia

El build de `@oroya/core` fallaba completamente — ni CJS, ni ESM, ni las declaraciones de tipos podían generarse.

### Solución aplicada

Se creó `packages/core/src/components/index.ts`:

```typescript
export { Component, ComponentType } from './Component';
export { Transform } from './Transform';
export type { Vec3, Quat } from './Transform';
export { Geometry, GeometryPrimitive } from './Geometry';
export type { BoxGeometryDef, SphereGeometryDef, ... } from './Geometry';
export { Material } from './Material';
export { Camera, CameraType } from './Camera';
```

### Cómo evitarlo

- **Regla**: Cada directorio que sea importado como módulo (`from '../components'`) **debe** tener un `index.ts`.
- **Alternativa**: Usar imports explícitos a archivos individuales:
  ```typescript
  // En lugar de:
  import { Component } from '../components';
  // Usar:
  import { Component } from '../components/Component';
  ```
- **Automatización**: Configurar un linter como [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import) con la regla `no-unresolved` para detectar imports que no se pueden resolver.

---

## 2. Extensiones de archivos incorrectas en `package.json`

### Error

```
X [ERROR] Failed to resolve entry for package "@oroya/core".
The package may have incorrect main/module/exports specified in its package.json.
```

### Causa

Los 4 `package.json` de los paquetes declaraban:

```json
{
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs"
    }
  }
}
```

Pero **tsup**, cuando el paquete tiene `"type": "module"`, genera:
- ESM → `index.js` (no `.mjs`)
- CJS → `index.cjs`

El archivo `./dist/index.mjs` nunca existía.

### Consecuencia

Vite no podía resolver los paquetes del workspace al escanear dependencias, rompiendo por completo el dev server de la demo.

### Solución aplicada

Corregir los campos `module` y `exports.".".import` en los 4 `package.json`:

```diff
- "module": "./dist/index.mjs",
+ "module": "./dist/index.js",
  "exports": {
    ".": {
-     "import": "./dist/index.mjs",
+     "import": "./dist/index.js",
    }
  }
```

### Cómo evitarlo

- **Regla**: Verificar qué archivos genera tu bundler. Ejecutá `tsup` una vez y revisá el contenido de `dist/` antes de configurar `package.json`.
- **Tabla de referencia de tsup**:

  | `"type"` del package | Formato | Extensión de salida |
  |---------------------|---------|-------------------|
  | `"module"` | ESM | `.js` |
  | `"module"` | CJS | `.cjs` |
  | `"commonjs"` o sin tipo | ESM | `.mjs` |
  | `"commonjs"` o sin tipo | CJS | `.js` |

- **Automatización**: Usar el plugin [publint](https://publint.dev/) en CI para validar que los campos de `package.json` apunten a archivos que existen.

---

## 3. `composite: true` incompatible con tsup DTS worker

### Error

```
DTS Build error
    at Worker.emit (node:events:508:28)
    at MessagePort.<anonymous> (node:internal/worker:332:53)
```

El worker de generación de tipos crasheaba silenciosamente sin un mensaje de error claro.

### Causa

El `tsconfig.base.json` del monorepo tenía `"composite": true`, y los tsconfigs de cada paquete lo heredaban vía `"extends"`. La opción `composite` es necesaria para TypeScript project references, pero entra en conflicto con el worker de DTS de tsup (especialmente con TypeScript 5.9+), que crea su propio programa TypeScript para generar declaraciones.

### Consecuencia

Los builds de CJS y ESM se completaban correctamente, pero la generación de tipos (`.d.ts`) fallaba, impidiendo que los consumidores del paquete tuvieran autocompletado y type-checking.

### Solución aplicada

Override de `composite: false` en los tsconfigs de cada paquete:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "composite": false
  }
}
```

También se eliminaron los campos `"references"` ya que son innecesarios cuando tsup resuelve dependencias vía `node_modules` (workspace links de pnpm).

### Cómo evitarlo

- **Regla**: Si usás tsup para generar `.d.ts`, no uses `composite: true` en ese tsconfig.
- **Alternativa**: Tener dos tsconfigs:
  - `tsconfig.json` — para el IDE y `tsc --build` (con `composite: true`)
  - `tsconfig.build.json` — para tsup (con `composite: false`)
  
  ```typescript
  // tsup.config.ts
  export default defineConfig({
    tsconfig: 'tsconfig.build.json',
  });
  ```

---

## 4. Orden incorrecto de condiciones en `exports`

### Warning

```
▲ [WARNING] The condition "types" here will never be used as it comes after
  both "import" and "require"
```

### Causa

El campo `exports` tenía `types` como última condición:

```json
{
  "exports": {
    ".": {
      "require": "./dist/index.cjs",
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"  // ← nunca se alcanza
    }
  }
}
```

Node.js evalúa las condiciones de `exports` en orden, y `import` ya matchea todas las sentencias `import`, por lo que `types` nunca se usa.

### Consecuencia

TypeScript podría no encontrar las declaraciones de tipos del paquete, causando errores de tipado en los consumidores.

### Solución aplicada

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Cómo evitarlo

- **Regla**: `types` siempre debe ser la **primera** condición en `exports`.
- **Referencia**: [TypeScript docs — Bundler Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)
- **Automatización**: [Are The Types Wrong?](https://arethetypeswrong.github.io/) analiza paquetes publicados y detecta estos problemas.

---

## 5. Import no utilizado con `noUnusedLocals`

### Error

```
error TS6133: 'Matrix4Identity' is declared but its value is never read.
```

### Causa

En `packages/core/src/nodes/Node.ts`, se importaba `Matrix4Identity` pero no se usaba en ninguna parte del archivo.

### Consecuencia

Con `"noUnusedLocals": true` en el tsconfig (que es lo correcto para mantener código limpio), TypeScript rechaza compilar el archivo.

### Solución aplicada

Se removió el import no utilizado:

```diff
- import { Matrix4, Matrix4Identity, multiplyMatrices } from '../math/Matrix4';
+ import { Matrix4, multiplyMatrices } from '../math/Matrix4';
```

### Cómo evitarlo

- Usar la extensión de editor "Organize Imports on Save".
- Configurar ESLint con `@typescript-eslint/no-unused-vars`.

---

## 6. Propiedades faltantes en interfaz `MaterialDef`

### Error

```
error TS2339: Property 'fill' does not exist on type 'MaterialDef'.
error TS2339: Property 'stroke' does not exist on type 'MaterialDef'.
```

### Causa

El renderer SVG (`@oroya/renderer-svg`) usaba propiedades `fill`, `stroke` y `strokeWidth` del material, pero la interfaz `MaterialDef` en `@oroya/core` solo definía `color` y `opacity`.

### Consecuencia

El paquete del renderer SVG no compilaba, haciendo imposible usarlo.

### Solución aplicada

Se extendió `MaterialDef` con las propiedades faltantes:

```typescript
export interface MaterialDef {
  color?: ColorRGB;
  opacity?: number;
  fill?: ColorRGB;      // nuevo
  stroke?: ColorRGB;    // nuevo
  strokeWidth?: number;  // nuevo
}
```

### Cómo evitarlo

- **Regla**: Al diseñar interfaces compartidas, definirlas **antes** de implementar los consumidores.
- **Práctica**: Usar un approach "contract-first" — cuando un paquete downstream necesita nuevas propiedades, actualizar primero la interfaz en el paquete core y luego implementar.
- **Automatización**: Compilar siempre todos los paquetes juntos (`pnpm build`) para detectar inconsistencias entre paquetes.

---

## 7. Template literal roto en `renderSVG.ts`

### Error

```
error TS1161: Unterminated regular expression literal.
```

### Causa

En `renderSVG.ts`, se usaba un salto de línea real dentro de un `join()` en un template literal:

```typescript
// ❌ Salto de línea literal dentro de comillas simples
${paths.join('
      ')}
```

### Consecuencia

Error de sintaxis que impedía la compilación del paquete `@oroya/renderer-svg`.

### Solución aplicada

```typescript
// ✅ Usar escape sequence
${paths.join('\n      ')}
```

### Cómo evitarlo

- Usar secuencias de escape (`\n`, `\t`) dentro de strings normales (`'...'`).
- Los saltos de línea literales solo son válidos dentro de template literals (`` ` ``), no dentro de strings regulares.

---

## 8. Dependencia de tipos faltante (`@types/three`)

### Error

```
error TS7016: Could not find a declaration file for module 'three'.
error TS7006: Parameter 'child' implicitly has an 'any' type.
```

### Causa

El paquete `@oroya/loader-gltf` dependía de `three` pero no tenía `@types/three` en `devDependencies`. El paquete hermano `@oroya/renderer-three` sí lo tenía, pero en un monorepo las dependencias no se comparten automáticamente entre paquetes.

### Consecuencia

TypeScript no podía inferir tipos para las APIs de three.js, causando errores de tipo implícito `any` que bloquean la compilación con `strict: true`.

### Solución aplicada

```diff
  "devDependencies": {
+   "@types/three": "^0.165.0",
    "tsup": "^8.1.0",
    "typescript": "^5.4.5"
  }
```

### Cómo evitarlo

- **Regla**: Cada paquete en el monorepo debe declarar **todas** sus dependencias, incluyendo `@types/*`.
- **Herramienta**: Usar [syncpack](https://jamiemason.github.io/syncpack/) para mantener versiones consistentes de dependencias compartidas en el monorepo.
- **CI check**: Agregar `pnpm build` como step obligatorio en CI para detectar paquetes que no compilan.

---

## Checklist de prevención

| # | Verificación | Herramienta sugerida |
|---|-------------|---------------------|
| 1 | Cada directorio importado tiene un `index.ts` | `eslint-plugin-import` |
| 2 | Las extensiones en `package.json` coinciden con la salida del bundler | `publint` |
| 3 | `composite: false` en tsconfigs usados por tsup | Revisar manualmente |
| 4 | `types` es la primera condición en `exports` | `arethetypeswrong` |
| 5 | No hay imports sin usar | `noUnusedLocals` + organize imports |
| 6 | Las interfaces compartidas están completas antes de usarse | `pnpm build` en CI |
| 7 | Strings usan escape sequences para caracteres especiales | Linter / prettier |
| 8 | Cada paquete declara todas sus `@types/*` | `syncpack` |

> **Recomendación general**: Configurar `pnpm build` como un paso obligatorio en CI/CD (GitHub Actions, etc.) para que estos errores se detecten antes de hacer merge.
