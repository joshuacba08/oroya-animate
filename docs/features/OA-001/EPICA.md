# Epic: Implement SvJs-like Generative SVG Module

**Status**: Planning
**Feature Tag**: `OA-001`
**Related Package**: `@joroya/renderer-svg`

## Abstract
The goal is to enhance the `@joroya/renderer-svg` package by implementing a lightweight, object-oriented wrapper for SVG elements, inspired by the [SvJs library](https://github.com/davidmatthew-ie/svjs/).
**Crucially, this will not be a direct copy.** We will modernize and simplify the API to take advantage of TypeScript and modern DX patterns, offering a more fluent and expressive way to create generative art.

## Scope

### 1. Core SVG Functions (`SvJs` Class)
A modernized wrapper around `SVGElement` with a fluent API.

#### 1.1 Creation Shortcuts (Modern API)
Instead of verbose `create('rect')`, we enable:
- `rect(width, height, x?, y?)`
- `circle(r, cx?, cy?)`
- `ellipse(rx, ry, cx?, cy?)`
- `line(x1, y1, x2, y2)`
- `polyline(points)`
- `text(content, x?, y?)`
- `group()` / `g()`

#### 1.2 Fluent Styling & Transforms
Chainable methods for common attributes to avoid stringly-typed `set()` calls (though `set` will remain for flexibility):
- `.fill(color, opacity?)`
- `.stroke(color, width?, opacity?)`
- `.move(x, y)` (alias to `moveTo`)
- `.rotate(angle, cx?, cy?)`
- `.scale(sx, sy?)`

#### 1.3 Smart Definitions
- `createFilter(id)`: Returns a typed wrapper for filters.
- `createGradient(id, ...)`: Auto-appends to `<defs>`.
- `createPattern(id, ...)`: Easy pattern creation.

#### 1.4 Utilities
- `save()`: Download SVG.
- `trackCursor()`: Mouse tracking in SVG coordinates.
- `noise(x, y)`: Direct access to valid Perlin noise.

### 2. Generative Functions (`Gen` Module)
Utility functions for generative algorithms, fully typed.
- **Randomness**: `random(min, max)`, `chance(n)`, `gaussian(mean, sigma)`, `pareto(min)`
- **Math**: `map(value, ...)`
- **Integration**: Helper to use `Gen` directly in attribute setting where possible (future).

## Implementation Strategy
- **TypeScript First**: Strict types for all methods.
- **Fluent & Chainable**: Every method that modifies the element should return `this`.
- **Minimal Overhead**: Direct DOM manipulation.

## Work Breakdown
1.  **Refactor Core**: Update `SvJs.ts` to include the new shortcut methods (`rect`, `circle`, etc.).
2.  **Refactor Styling**: Add fluent style methods (`fill`, `stroke`).
3.  **Modernize Gen**: Ensure `Gen.ts` utilizes modern TS features.
4.  **Demo**: Update `demo-react` to showcase the *new* API syntax (e.g. `svg.rect(...)` instead of `svg.create('rect')`).
