# Epic: Internationalization (i18n) — English, Spanish & Japanese

**Status**: Planning  
**Feature Tag**: `OA-003`  
**Related Packages**: `apps/demo-react`, `apps/web`

## Abstract

Implement a professional internationalization (i18n) system across the Oroya Animate web presence — both the demo application (`apps/demo-react`) and the documentation/landing site (`apps/web`). The system must support **English (en)**, **Spanish (es)**, and **Japanese (ja)**, with a clean architecture that makes adding new languages trivial. Translations will be provided by the team; the engineering focus is on the infrastructure, tooling, and developer experience.

## Analysis of Decisions

### i18n Library for React (`apps/demo-react`)

**Decision: `react-i18next`**

| Criteria | react-i18next (recommended) | react-intl (FormatJS) | Custom / lightweight |
|---|---|---|---|
| Ecosystem | Largest React i18n ecosystem, 10M+ weekly downloads | Mature, backed by FormatJS | Manual, no community |
| TypeScript support | Excellent (typed keys, namespace inference) | Good | Manual |
| Interpolation & plurals | Built-in, ICU-compatible | ICU MessageFormat native | Manual |
| JSON translation files | Native format | Requires ICU syntax | Custom |
| Bundle size | ~12 KB gzipped (i18next + react-i18next) | ~14 KB gzipped | Minimal |
| Namespace support | Yes (split by feature/component) | Flat messages | Manual |
| Language detection | Plugin-based (`i18next-browser-languagedetector`) | Manual | Manual |
| SSR/SSG support | Excellent | Good | Manual |
| Learning curve | Low (straightforward API) | Medium (ICU format) | Low but fragile |

**Justification**: `react-i18next` is the industry standard for React applications. It provides typed translation keys, namespace splitting, lazy loading of translations, and a plugin ecosystem for language detection and caching. Its JSON-based translation files are the simplest format for non-technical translators to work with.

### i18n Strategy for Astro (`apps/web`)

**Decision: Astro's native i18n routing + manual translation utilities**

| Criteria | Astro native i18n | astro-i18next | Paraglide.js |
|---|---|---|---|
| Routing | Built-in path prefixes (`/en/`, `/es/`, `/ja/`) | Plugin-based routing | Framework adapter |
| Content Collections | Native per-locale collections | Requires config | Not designed for Astro |
| Maintenance | Core team maintained | Community maintained | Community maintained |
| Configuration | Minimal (`astro.config.mjs`) | Additional plugin config | Additional setup |
| Astro 5 support | Native | May lag behind | Adapter needed |
| Static generation | Full SSG support | Full SSG support | Full SSG support |

**Justification**: Since Astro 4, the framework includes native i18n routing with `i18n` config in `astro.config.mjs`. This provides path-prefix routing, locale detection, and fallback behavior out of the box. For content, Astro Content Collections can be organized by locale naturally. No third-party dependency is needed.

### Translation File Format

**Decision: JSON (namespaced)**

| Format | JSON | YAML | PO/gettext | ICU MessageFormat |
|---|---|---|---|---|
| Tooling | Universal (VS Code, online editors) | Good but less common | Specialized (Poedit) | Specialized |
| Nesting | Native | Native | Flat | Flat |
| Compatibility | react-i18next native, Astro-friendly | Requires parsing | Requires adapter | FormatJS native |
| Translator-friendly | Very easy | Easy | Familiar to translators | Complex syntax |
| Type generation | Easy with `i18next` tooling | Manual | Manual | Manual |

**Structure**:
```
locales/
├── en/
│   ├── common.json       # Shared: nav, footer, buttons
│   ├── demo.json          # Demo app: scenes, controls, labels
│   └── docs.json          # Documentation: headings, descriptions
├── es/
│   ├── common.json
│   ├── demo.json
│   └── docs.json
└── ja/
    ├── common.json
    ├── demo.json
    └── docs.json
```

### URL Strategy

**Decision: Path prefix**

| Strategy | Path prefix (recommended) | Subdomain | Query parameter |
|---|---|---|---|
| Example | `/es/docs/...` | `es.oroya.dev/docs/...` | `/docs?lang=es` |
| SEO | Excellent (separate URLs per language) | Excellent but requires DNS setup | Poor (single URL) |
| Astro support | Native | Manual config | Manual |
| Caching | Standard CDN rules | Per-subdomain caching | Complex |
| Complexity | Low | Medium (DNS, SSL per subdomain) | Low but bad SEO |

**Routing scheme**:
- Default language (`en`): `/docs/getting-started` (no prefix)
- Spanish: `/es/docs/getting-started`
- Japanese: `/ja/docs/getting-started`

## Scope

### 1. Shared Translation Infrastructure

```
locales/                          # Root-level shared translations
├── en/
│   ├── common.json               # Navigation, footer, buttons, shared UI
│   └── demo.json                 # Scene names, control labels, descriptions
├── es/
│   ├── common.json
│   └── demo.json
└── ja/
    ├── common.json
    └── demo.json
```

A monorepo-level `locales/` directory keeps translations centralized and reusable across both `apps/demo-react` and `apps/web`. Both apps import from the same source of truth.

### 2. Demo App i18n (`apps/demo-react`)

#### 2.1 Setup & Configuration
- Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- Configure i18next instance with:
  - Supported languages: `['en', 'es', 'ja']`
  - Default language: `en`
  - Fallback language: `en`
  - Namespace loading from `locales/`
  - Browser language auto-detection

#### 2.2 Language Switcher Component
- Dropdown/toggle in the sidebar or toolbar.
- Displays language names in their native script: **English**, **Español**, **日本語**.
- Persists selection in `localStorage`.
- Smooth transition (no full page reload).

#### 2.3 Translation Key Extraction
All hardcoded strings must be extracted to translation keys:

| Component | Current strings (examples) | Namespace |
|---|---|---|
| `Sidebar.tsx` | "Scene Graph Engine", "Próximamente" | `common` |
| `ControlPanel.tsx` | "Controles" | `common` |
| `scenes/index.ts` | Scene names and descriptions | `demo` |
| Scene files | Control labels ("Velocidad", "Tamaño", etc.) | `demo` |
| `SvgInteractive.ts` | "Haz click en las figuras..." | `demo` |
| `SvgShowcase.ts` | "SVG Showcase", filter names | `demo` |
| `SvgAnimations.ts` | Animation type labels | `demo` |
| `HoverShowcase.ts` | "Levitar", "Girar", "Crecer" | `demo` |
| `index.html` | Page title | `common` |

#### 2.4 TypeScript Integration
- Generate typed translation keys using `i18next` resource type inference.
- Compile-time safety for translation key usage.
- IDE autocomplete for `t('namespace:key')` calls.

### 3. Web/Docs i18n (`apps/web`)

#### 3.1 Astro i18n Configuration
```js
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'ja'],
    routing: {
      prefixDefaultLocale: false  // /docs/... for English
    }
  }
});
```

#### 3.2 Content Collections per Locale
```
src/content/
├── docs/
│   ├── en/
│   │   ├── getting-started.mdx
│   │   ├── api-reference.mdx
│   │   └── ...
│   ├── es/
│   │   ├── getting-started.mdx
│   │   ├── api-reference.mdx
│   │   └── ...
│   └── ja/
│       ├── getting-started.mdx
│       ├── api-reference.mdx
│       └── ...
```

#### 3.3 UI String Translations
- Navigation, footer, and UI chrome use translation files from `locales/common.json`.
- Helper utility `t(key, locale)` for Astro components (`.astro` files).
- React Islands receive locale as prop from Astro.

#### 3.4 Language Switcher
- Persistent switcher in the navigation bar.
- Links to the equivalent page in the selected locale.
- Flags or native language names for visual clarity.
- Respects `Accept-Language` header for initial locale suggestion.

### 4. Japanese Language Considerations

Special attention for Japanese (`ja`) support:

- **Font stack**: Include CJK-compatible fonts (`Noto Sans JP` or system fonts) in the CSS.
- **Layout**: Ensure UI components handle longer/shorter text gracefully (Japanese text can be more compact or need different spacing).
- **Date/Number formatting**: Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with locale parameter.
- **Line breaking**: CSS `word-break: keep-all` for Japanese text where appropriate.
- **Testing**: Verify rendering with actual Japanese strings, not just Latin placeholders.

## Technical Stack

| Component | Technology |
|---|---|
| React i18n | `i18next` + `react-i18next` |
| Language detection | `i18next-browser-languagedetector` |
| Astro i18n routing | Native `astro.config.mjs` i18n |
| Translation format | JSON (namespaced) |
| CJK fonts | `Noto Sans JP` (Google Fonts) |
| Type safety | `i18next` resource type inference |
| URL strategy | Path prefix (`/es/...`, `/ja/...`) |

## Dependencies

### `apps/demo-react`
```json
{
  "dependencies": {
    "i18next": "^24.x",
    "react-i18next": "^15.x",
    "i18next-browser-languagedetector": "^8.x"
  }
}
```

### `apps/web`
No additional dependencies required — Astro's native i18n is sufficient.

## Work Breakdown

### Phase 1: Foundation & Shared Infrastructure
- [ ] Create `locales/` directory structure at monorepo root
- [ ] Define translation key schema and naming conventions
- [ ] Create initial `en/common.json` with all shared UI strings
- [ ] Create `en/demo.json` with all demo app strings
- [ ] Create placeholder `es/` and `ja/` files (keys only, pending translations)
- [ ] Document translation workflow and contribution guide

### Phase 2: Demo App i18n (`apps/demo-react`)
- [ ] Install and configure `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- [ ] Create i18n initialization module (`src/i18n.ts`)
- [ ] Extract all hardcoded strings from `Sidebar.tsx` to translation keys
- [ ] Extract all hardcoded strings from `ControlPanel.tsx`
- [ ] Extract scene names and descriptions from `scenes/index.ts`
- [ ] Extract control labels from individual scene files
- [ ] Extract strings from `SvgInteractive.ts`, `SvgShowcase.ts`, `SvgAnimations.ts`, `HoverShowcase.ts`
- [ ] Build `<LanguageSwitcher />` component
- [ ] Integrate language switcher into `Sidebar.tsx`
- [ ] Configure TypeScript type inference for translation keys
- [ ] Test with all 3 locales (en, es, ja)

### Phase 3: Web/Docs i18n (`apps/web`)
- [ ] Configure Astro i18n in `astro.config.mjs`
- [ ] Create translation utility for `.astro` components
- [ ] Reorganize Content Collections by locale
- [ ] Add locale-aware routing to documentation pages
- [ ] Update navigation and footer with translations
- [ ] Build `<LanguageSwitcher />` Astro component
- [ ] Pass locale to React Islands as props
- [ ] Update `<head>` with `hreflang` tags for SEO
- [ ] Add CJK font support (Noto Sans JP)

### Phase 4: Translation & Polish
- [ ] Fill in Spanish (`es`) translations for all keys
- [ ] Fill in Japanese (`ja`) translations for all keys
- [ ] Review Japanese layout and typography
- [ ] Verify RTL/LTR and text overflow handling
- [ ] Test language switching persistence across sessions
- [ ] Test SEO: `hreflang` tags, locale-specific sitemaps
- [ ] Lighthouse audit per locale

## Translation Key Naming Convention

Keys follow a dot-separated hierarchy:

```
namespace:section.element.variant
```

Examples:
```json
{
  "nav.home": "Home",
  "nav.docs": "Documentation",
  "nav.examples": "Examples",
  "footer.copyright": "© 2026 Oroya Animate",
  "sidebar.subtitle": "Scene Graph Engine",
  "sidebar.comingSoon": "Coming soon",
  "controls.title": "Controls",
  "scenes.interactiveDemo.name": "Interactive Demo",
  "scenes.interactiveDemo.description": "Try interacting with the shapes",
  "controls.labels.speed": "Speed",
  "controls.labels.size": "Size",
  "controls.labels.color": "Color"
}
```

## Acceptance Criteria

1. The demo app (`apps/demo-react`) renders correctly in English, Spanish, and Japanese.
2. The web/docs site (`apps/web`) serves localized content at path-prefixed URLs.
3. Language switcher is accessible and persists the user's preference.
4. No hardcoded user-facing strings remain in component code — all use translation keys.
5. Adding a new language requires only adding a new locale directory with JSON/MDX files (no code changes).
6. Japanese text renders correctly with appropriate CJK font support.
7. SEO `hreflang` tags are present on all localized pages.
8. TypeScript provides autocomplete and type safety for translation keys in the React app.
9. Lighthouse score remains > 90 across all locales.
