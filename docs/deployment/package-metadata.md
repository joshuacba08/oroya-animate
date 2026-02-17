# Package Metadata Configuration

This guide explains how to properly configure package metadata for better visibility on NPM and documentation sites.

## 搭 Essential Metadata Fields

Each package should have these fields in `package.json`:

```json
{
  "name": "@joroya/package-name",
  "version": "0.3.0",
  "description": "Clear, concise description of what this package does",
  "keywords": [
    "graphics",
    "3d",
    "2d",
    "webgl",
    "svg",
    "scene-graph",
    "animation",
    "typescript"
  ],
  "author": {
    "name": "Your Name or Organization",
    "email": "contact@example.com",
    "url": "https://github.com/joshuacba08"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/joshuacba08/oroya-animate.git",
    "directory": "packages/core"
  },
  "homepage": "https://oroya-animate.vercel.app",
  "bugs": {
    "url": "https://github.com/joshuacba08/oroya-animate/issues"
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/joshuacba08"
  }
}
```

## 逃 Package-Specific Metadata

### @joroya/core

```json
{
  "description": "Core scene graph and component system for Oroya Animate - an engine-agnostic 2D/3D graphics library",
  "keywords": [
    "oroya",
    "scene-graph",
    "component-system",
    "3d",
    "2d",
    "graphics",
    "webgl",
    "svg",
    "typescript",
    "node-system",
    "transform",
    "engine-agnostic"
  ]
}
```

### @joroya/renderer-three

```json
{
  "description": "Three.js (WebGL) renderer for Oroya Animate scene graphs",
  "keywords": [
    "oroya",
    "three",
    "threejs",
    "webgl",
    "3d",
    "renderer",
    "graphics",
    "typescript"
  ],
  "peerDependencies": {
    "@joroya/core": "^0.3.0",
    "three": "^0.165.0"
  }
}
```

### @joroya/renderer-svg

```json
{
  "description": "Lightweight SVG renderer for Oroya Animate scene graphs",
  "keywords": [
    "oroya",
    "svg",
    "2d",
    "renderer",
    "graphics",
    "vector",
    "typescript",
    "generative-art"
  ],
  "peerDependencies": {
    "@joroya/core": "^0.3.0"
  }
}
```

### @joroya/loader-gltf

```json
{
  "description": "glTF/GLB 3D model loader for Oroya Animate scene graphs",
  "keywords": [
    "oroya",
    "gltf",
    "glb",
    "3d",
    "loader",
    "model",
    "import",
    "three",
    "typescript"
  ],
  "peerDependencies": {
    "@joroya/core": "^0.3.0",
    "three": "^0.165.0"
  }
}
```

## 統 README.md for Each Package

Each package should have its own `README.md` with:

### Template Structure

```markdown
# @joroya/[package-name]

> Short tagline describing the package

[![NPM Version](https://img.shields.io/npm/v/@joroya/[package-name])](https://www.npmjs.com/package/@joroya/[package-name])
[![License](https://img.shields.io/npm/l/@joroya/[package-name])](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Installation

\`\`\`bash
npm install @joroya/[package-name]
\`\`\`

## Quick Example

\`\`\`typescript
// Minimal example showing key functionality
\`\`\`

## Documentation

- [Full Documentation](https://oroya-animate.vercel.app)
- [API Reference](https://oroya-animate.vercel.app/docs/api-reference)
- [Getting Started Guide](https://oroya-animate.vercel.app/docs/getting-started)

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

### Basic Usage

\`\`\`typescript
// More detailed examples
\`\`\`

### Advanced Usage

\`\`\`typescript
// Advanced examples
\`\`\`

## API

Link to full API documentation or provide brief overview.

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT ﾂｩ [joshuacba08](https://github.com/joshuacba08)
```

## 耳 NPM Package Page Optimization

### 1. Package Description

Make it:
- **Clear:** What does it do?
- **Concise:** Max 140 characters (shows fully on NPM)
- **Searchable:** Include relevant keywords naturally

**Good Examples:**
- 笨・"Core scene graph and component system for building 2D/3D graphics with any rendering backend"
- 笶・"A package for Oroya" (too vague)
- 笶・"This is a really amazing super cool graphics library that does everything you could ever want" (too long, fluff)

### 2. Keywords

Choose 5-12 keywords that:
- Describe what the package does
- Match what users search for
- Relate to ecosystem (e.g., "three", "webgl", "svg")
- Include your brand ("oroya")

**Priority Keywords:**
- Generic terms: "graphics", "3d", "2d"
- Technology: "webgl", "svg", "canvas"
- Framework: "threejs", "three"
- Concept: "scene-graph", "component-system", "renderer"
- Language: "typescript"

### 3. Links

Ensure all links work:
- Homepage 竊・Documentation site
- Repository 竊・GitHub repo
- Issues 竊・GitHub issues
- Funding 竊・(Optional) GitHub Sponsors or other

## 投 NPM Profile Optimization

### Organization Profile (@oroya)

Set up at https://www.npmjs.com/settings/oroya/profile:

```json
{
  "name": "Oroya Animate",
  "description": "Engine-agnostic 2D/3D graphics library for the web",
  "website": "https://oroya-animate.vercel.app",
  "twitter": "@oroya_animate",
  "github": "joshuacba08"
}
```

### Organization README

Create a README for the organization (shows on org page):

```markdown
# Oroya Animate

Professional, engine-agnostic 2D/3D graphics library for the web.

## Packages

- [@joroya/core](https://www.npmjs.com/package/@joroya/core) - Core scene graph
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three) - Three.js renderer
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg) - SVG renderer
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf) - glTF loader

## Resources

- [Documentation](https://oroya-animate.vercel.app)
- [GitHub](https://github.com/joshuacba08/oroya-animate)
- [Tutorials](https://oroya-animate.vercel.app/docs/tutorials)
```

## 捷・・Version Tags

Use NPM tags for different release channels:

```bash
# Latest stable (default)
pnpm publish --tag latest

# Beta releases
pnpm publish --tag beta

# Next/canary releases
pnpm publish --tag next

# Legacy versions
pnpm publish --tag legacy
```

Users install with:
```bash
npm install @joroya/core@beta
npm install @joroya/core@next
```

## 嶋 Discoverability Tips

### 1. Complete package.json

Fill all optional fields - they improve searchability.

### 2. Write Good Documentation

- Clear README with examples
- Code comments and JSDoc
- Separate getting started guide
- API reference

### 3. Use TypeScript

- Provides better autocomplete
- Improves DX significantly
- Shows TypeScript badge on NPM

### 4. Badges in README

```markdown
[![NPM Version](https://img.shields.io/npm/v/@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![NPM Downloads](https://img.shields.io/npm/dm/@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@joroya/core)](https://bundlephobia.com/package/@joroya/core)
[![License](https://img.shields.io/npm/l/@joroya/core)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
```

### 5. Examples and Demos

Link to:
- CodeSandbox examples
- CodePen demos
- Live documentation site
- GitHub demo apps

### 6. Social Proof

- GitHub stars
- Download counts
- Used by (list notable users)
- Testimonials

### 7. SEO-Friendly Documentation Site

Your documentation site should:
- Have good meta tags
- Load fast
- Be mobile-friendly
- Have clear navigation
- Include search functionality

## 肌 Automation Script

Update all packages at once:

```javascript
// scripts/update-metadata.js
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const packages = globSync('./packages/*/package.json');

const commonMetadata = {
  author: {
    name: "Oroya AI Collaborator",
    url: "https://github.com/joshuacba08"
  },
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/joshuacba08/oroya-animate.git"
  },
  homepage: "https://oroya-animate.vercel.app",
  bugs: {
    url: "https://github.com/joshuacba08/oroya-animate/issues"
  }
};

packages.forEach(path => {
  const pkg = JSON.parse(readFileSync(path, 'utf-8'));
  
  // Add directory field to repository
  const dir = path.match(/packages\/([^/]+)/)[1];
  commonMetadata.repository.directory = `packages/${dir}`;
  
  // Merge metadata
  Object.assign(pkg, commonMetadata);
  
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`笨・Updated ${pkg.name}`);
});
```

Run with:
```bash
node scripts/update-metadata.js
```

## 答 Related Documentation

- [NPM Publishing Guide](./npm-publishing.md)
- [CDN Setup](./cdn-setup.md)
- [Contributing Guide](../contributing.md)
