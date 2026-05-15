# Epic: Landing Page & Sitio Web de la Plataforma Oroya Animate

**Status**: Planning
**Feature Tag**: `OA-002`
**Related Package**: `apps/web` (nuevo)

## Abstract

Crear el sitio web público de Oroya Animate: una landing page + documentación interactiva que sirva como carta de presentación de la librería, con demos en vivo embebidas y documentación técnica. El sitio se desplegará en **Vercel** y vivirá dentro del monorepo existente.

## Análisis de Decisiones

### ¿Dentro del monorepo o repositorio separado?

**Decisión: Dentro del monorepo** como `apps/web`.

| Criterio | Monorepo (recomendado) | Repo separado |
|---|---|---|
| Acceso a paquetes workspace | Importa `@joroya/core`, renderers directamente via `workspace:*` | Necesita publicar a npm primero |
| Demos interactivas | Usa los paquetes reales en vivo | Depende de versiones publicadas |
| CI/CD | Pipeline unificado, un solo deploy | Pipeline independiente, más infra |
| Consistencia | Misma config TS, linting, formato | Duplicación de configs |
| Vercel | Soporte nativo de monorepos (root directory config) | Sin problema |
| Complejidad repo | Incrementa levemente | Repo más limpio pero fragmentado |

**Justificación**: Al ser ya un monorepo con `pnpm-workspace.yaml` configurado para `apps/*`, agregar `apps/web` es natural. La mayor ventaja es poder importar los paquetes reales de la librería para demos interactivas en la landing page, sin depender de versiones publicadas en npm.

### Tecnología: ¿Astro, Next.js u otra?

**Decisión: Astro**

| Criterio | Astro | Next.js | Vite + React (SPA) |
|---|---|---|---|
| Tipo de sitio | Landing + docs (contenido estático) | Apps dinámicas full-stack | SPAs interactivas |
| SEO | Excelente (SSG por defecto, zero JS) | Bueno (SSR/SSG) | Pobre (CSR) |
| Performance | Óptima (Islands Architecture, zero JS base) | Buena (pero bundle mayor) | Depende del bundle |
| Demos interactivas | Islands: hidrata solo componentes React necesarios | Todo es React | Todo es React |
| Peso del bundle | Mínimo (solo JS donde se necesita) | Mayor (framework runtime) | Mayor |
| Documentación/MDX | Soporte nativo, colecciones de contenido | Requiere config adicional | Manual |
| Vercel deploy | Adapter oficial `@astrojs/vercel` | Soporte nativo | Static hosting |
| Curva de aprendizaje | Baja (HTML-first, familiar) | Media (RSC, App Router) | Baja |
| Integración React | `@astrojs/react` - usa componentes existentes | Nativo | Nativo |

**Justificación**: Astro es la opción ideal porque:

1. **Rendimiento óptimo**: Genera HTML estático por defecto, sin JavaScript innecesario. Perfecto para una landing page donde el contenido es rey.
2. **Islands Architecture**: Permite embeber componentes React interactivos (demos de la librería) solo donde se necesitan, sin penalizar el resto de la página.
3. **MDX nativo**: Facilita migrar/reutilizar la documentación existente en Markdown.
4. **React compatible**: El proyecto ya tiene componentes React en `apps/demo-react` que pueden reutilizarse para demos embebidas.
5. **Vercel**: Adapter oficial con soporte completo para SSG y SSR on-demand.
6. **Ligero**: Next.js sería excesivo para un sitio mayormente estático sin necesidad de API routes, autenticación ni server-side rendering dinámico.

## Scope

### 1. Estructura del Proyecto (`apps/web`)

```
apps/web/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
━E  ├── favicon.svg
━E  ├── og-image.png
━E  └── assets/
├── src/
━E  ├── layouts/
━E  ━E  ├── BaseLayout.astro      # Layout base (head, nav, footer)
━E  ━E  └── DocsLayout.astro      # Layout para documentación
━E  ├── pages/
━E  ━E  ├── index.astro           # Landing page principal
━E  ━E  ├── docs/
━E  ━E  ━E  └── [...slug].astro   # Páginas de documentación dinámicas
━E  ━E  └── examples/
━E  ━E      └── index.astro       # Galería de ejemplos
━E  ├── components/
━E  ━E  ├── Hero.astro            # Hero section
━E  ━E  ├── Features.astro        # Grid de características
━E  ━E  ├── CodeExample.astro     # Bloques de código con syntax highlight
━E  ━E  ├── LiveDemo.tsx          # Componente React (island) para demos en vivo
━E  ━E  ├── Navigation.astro      # Navbar
━E  ━E  └── Footer.astro          # Footer
━E  ├── content/
━E  ━E  ├── config.ts             # Content collections config
━E  ━E  └── docs/                 # Documentación en MDX
━E  └── styles/
━E      └── global.css            # Estilos globales (Tailwind)
```

### 2. Landing Page

Secciones de la página principal:

- **Hero**: Nombre, tagline ("Engine-agnostic 2D/3D graphics for the web"), CTA a docs y npm.
- **Features**: Grid con las capacidades clave (engine-agnostic, TypeScript-first, múltiples renderers, scene graph, etc.)
- **Demo interactiva**: Island React con un canvas Three.js + SVG side-by-side usando `@joroya/core` real.
- **Code Examples**: Snippets de código mostrando la API simple.
- **Getting Started**: Quick start con `pnpm add @joroya/core`.
- **Renderers**: Comparación visual Three.js vs SVG.
- **Footer**: Links a GitHub, npm, documentación.

### 3. Documentación

- Migrar los docs existentes (`docs/*.md`) como content collections de Astro.
- Sidebar de navegación.
- Syntax highlighting para TypeScript.
- Soporte MDX para embeber componentes interactivos.

### 4. Demos Interactivas (React Islands)

- Reutilizar escenas de `apps/demo-react` como Islands de Astro.
- Componente `<LiveDemo />` que renderiza una escena Oroya con `@joroya/renderer-three` o `@joroya/renderer-svg`.
- Lazy loading para no impactar el tiempo de carga inicial.

### 5. Infraestructura & Deploy

- Configurar `@astrojs/vercel` adapter.
- Configurar Vercel para apuntar al directorio `apps/web`.
- Dominio personalizado (configurar DNS en Vercel).
- Open Graph meta tags para compartir en redes sociales.

## Stack Técnico

| Componente | Tecnología |
|---|---|
| Framework | Astro 5.x |
| Integración UI | `@astrojs/react` |
| Estilos | Tailwind CSS 4.x |
| Contenido | Astro Content Collections + MDX |
| Demos | React 18 + `@joroya/core` + renderers |
| Deploy | Vercel (adapter `@astrojs/vercel`) |
| Iconos | Lucide (ya usado en el proyecto) |

## Dependencias Workspace

```json
{
  "name": "web",
  "dependencies": {
    "@joroya/core": "workspace:*",
    "@joroya/renderer-three": "workspace:*",
    "@joroya/renderer-svg": "workspace:*",
    "astro": "^5.x",
    "@astrojs/react": "^4.x",
    "@astrojs/vercel": "^8.x",
    "@astrojs/tailwind": "^6.x",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.165.0"
  }
}
```

## Work Breakdown

### Fase 1: Setup & Scaffolding
- [ ] Inicializar proyecto Astro en `apps/web`
- [ ] Configurar `@astrojs/react`, `@astrojs/tailwind`, `@astrojs/vercel`
- [ ] Verificar resolución de paquetes workspace (`@joroya/*`)
- [ ] Configurar Vercel project apuntando a `apps/web`
- [ ] Layout base con navbar y footer

### Fase 2: Landing Page
- [ ] Hero section con animación sutil
- [ ] Grid de features
- [ ] Code examples con syntax highlighting
- [ ] Sección "Getting Started"
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support

### Fase 3: Demos Interactivas
- [ ] Componente `<LiveDemo />` como React Island
- [ ] Demo Three.js embebida (ej: Hello Cube)
- [ ] Demo SVG embebida (ej: Generative Art)
- [ ] Demo side-by-side (mismo scene graph, dos renderers)

### Fase 4: Documentación
- [ ] Configurar Content Collections para docs
- [ ] Migrar documentación existente a MDX
- [ ] Layout de documentación con sidebar
- [ ] Search (opcional: Pagefind o similar)

### Fase 5: Polish & Deploy
- [ ] SEO: meta tags, Open Graph, sitemap
- [ ] Performance: lighthouse audit
- [ ] Analytics (opcional: Vercel Analytics)
- [ ] Dominio personalizado
- [ ] CI: build check en PR

## Criterios de Aceptación

1. El sitio se despliega correctamente en Vercel desde el monorepo.
2. La landing page carga con Lighthouse score > 90 en todas las categorías.
3. Las demos interactivas funcionan correctamente usando los paquetes reales del workspace.
4. La documentación es navegable y tiene syntax highlighting.
5. El sitio es responsive y soporta dark mode.
6. Los paquetes workspace se resuelven correctamente en el build de Astro.
