# OA-004: SVG Interactivity & Advanced Generative Features

**Goal**: Elevate `@joroya/renderer-svg` to a powerful generative art tool by implementing advanced probability distributions, structured layout utilities, and robust interactivity patterns.

## Context

Generative art requires more than just drawing shapes; it needs controlled randomness (Gaussian, Pareto), structured layouts (grids, clipping), and interactivity to engage users. This Epic covers the implementation and verification of these advanced features, inspired by classic generative algorithms.

## Features

### 1. Probability Distributions & Math Helpers
Implement and verify mathematical utilities for natural-looking randomness.

- **Gaussian Distribution**: `Gen.gaussian(mean, sd)` for bell-curve distribution.
- **Pareto Distribution**: `Gen.pareto(min)` for "80-20 rule" distribution (e.g., city skylines).
- **Random Utilities**: Enhanced `Gen.random` (ranges, arrays, floats) and `Gen.chance` (probability booleans).
- **Math Helpers**: `map`, `constrain`, `interp`, `dist`.

> *Status*: Mostly implemented in `Gen.ts`. Needs verification via demos.

### 2. Structured Layouts & Clipping
Tools for organizing shapes into grids and complex compositions.

- **Grid Systems**: Nested loop patterns with `moveTo(x, y)` and `getCentre()` for cell positioning.
- **Clip Paths**: Support for `clipPath` with unique ID generation for isolating render regions.
- **Pattern Generation**: Utilities or patterns for repeating visual elements (rect grids, radial distributions).

### 3. SVG Interactivity
Enable rich user interaction within SVG scenes.

- **Event Handling**: Robust wrappers for `addEventListener` (click, pointer events).
- **Cursor Tracking**: `trackCursor` for real-time mouse/touch position.
- **Interactive Demos**: Scenes that respond to user input (e.g., mouse position affecting generative parameters).

## User Stories

- As a **Generative Artist**, I want to use **Gaussian and Pareto distributions** so that my art looks organic and not just purely random.
- As a **Developer**, I want to easily **clip content** within grid cells so that I can create complex tiled designs without overflow.
- As a **User**, I want to **interact** with the generative art (e.g., move mouse to change patterns) so that the experience feels alive.

## Implementation Tasks

- [ ] **Verify `Gen` Module**: clear up any edge cases in `gaussian`, `pareto`, `chance`.
- [ ] **Verify Layout Methods**: Ensure `moveTo` and `getCentre` work correctly on Groups `<g>`.
- [ ] **Implement Interactive Utilities**: Review `SvJs` event listener wrappers and `trackCursor`.
- [ ] **Create Demos**:
    - `PortoPareto`: Cityscape using Pareto distribution.
    - `GaussianDist`: Visualizing bell curves with random lines.
    - `ColourfulGrids`: Grid system with clip paths and random palettes.
    - `InteractiveGalaxy`: Particle system following cursor.

## Acceptance Criteria

1.  `Gen` module functions (`gaussian`, `pareto`, etc.) behave as expected mathematically.
2.  `SvJs` correctly handles `clipPath` creation and application.
3.  `moveTo` accurately positions elements/groups based on their center.
4.  Demos run smoothly and demonstrate the respective features.
