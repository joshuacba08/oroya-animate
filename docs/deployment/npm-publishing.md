# NPM Publishing Guide

This guide explains how to publish Oroya Animate packages to NPM.

## 📦 Publishable Packages

The monorepo contains 4 publishable packages:

- `@oroya/core` - Core scene graph and components
- `@oroya/renderer-three` - Three.js (WebGL) renderer
- `@oroya/renderer-svg` - SVG renderer
- `@oroya/loader-gltf` - glTF model loader

## 🔧 Prerequisites

### 1. NPM Account & Authentication

Create an NPM account at [npmjs.com](https://www.npmjs.com/) if you don't have one.

Login to NPM:
```bash
npm login
```

### 2. NPM Organization (Recommended)

Create an organization `@oroya` on NPM:
- Go to https://www.npmjs.com/org/create
- Create organization named `oroya`
- This allows scoped packages like `@oroya/core`

### 3. Package Configuration

All packages are already configured with:
- ✅ Correct `name` field with `@oroya/` scope
- ✅ `version` field (currently 0.3.0)
- ✅ `license` field (MIT)
- ✅ `main`, `module`, `types` exports
- ✅ `files` array specifying dist folder
- ✅ Proper `exports` field for dual ESM/CJS support

## 🚀 Publishing Process

### Option 1: Manual Publishing (Development)

#### Step 1: Build All Packages
```bash
pnpm build
```

#### Step 2: Test Before Publishing
```bash
# Run tests
pnpm test

# Typecheck
pnpm typecheck

# Test in demo apps
pnpm dev:react
pnpm dev:vanilla
```

#### Step 3: Update Version
```bash
# From root, update all package versions
pnpm --filter "./packages/**" exec npm version patch
# or: minor, major, prepatch, preminor, premajor

# Manual: Edit package.json in each package
```

#### Step 4: Publish Each Package
```bash
# Publish all packages
pnpm --filter "./packages/**" publish --access public

# Or publish individually
cd packages/core
pnpm publish --access public

cd ../renderer-three
pnpm publish --access public

cd ../renderer-svg
pnpm publish --access public

cd ../loader-gltf
pnpm publish --access public
```

> **Note:** `--access public` is required for scoped packages to be publicly available.

### Option 2: Automated Publishing (Recommended)

Use GitHub Actions to automate publishing (see `.github/workflows/publish.yml`).

#### Trigger Publishing:
```bash
# Create and push a version tag
git tag v0.3.0
git push origin v0.3.0
```

The GitHub Action will:
1. ✅ Run tests
2. ✅ Build packages
3. ✅ Publish to NPM
4. ✅ Create GitHub Release

## 📝 Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Version numbers updated in all packages
- [ ] CHANGELOG.md updated (if exists)
- [ ] README.md is up to date
- [ ] All demos work correctly
- [ ] Git working directory is clean
- [ ] You're on the `main` branch

## 🔐 NPM Token for CI/CD

To enable automated publishing via GitHub Actions:

### 1. Generate NPM Token
```bash
npm token create --read-write
```

### 2. Add to GitHub Secrets
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste the token from step 1
5. Save

## 📋 Version Management

### Semantic Versioning

Oroya Animate follows [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Version Update Commands

```bash
# Patch (0.3.0 → 0.3.1)
pnpm --filter "./packages/**" exec npm version patch

# Minor (0.3.0 → 0.4.0)
pnpm --filter "./packages/**" exec npm version minor

# Major (0.3.0 → 1.0.0)
pnpm --filter "./packages/**" exec npm version major

# Pre-release (0.3.0 → 0.3.1-beta.0)
pnpm --filter "./packages/**" exec npm version prerelease --preid=beta
```

### Keeping Versions in Sync

All packages should share the same version number. Use this script:

```bash
# Update all package.json files to version 0.4.0
node scripts/sync-versions.js 0.4.0
```

Create `scripts/sync-versions.js`:
```javascript
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('Usage: node sync-versions.js <version>');
  process.exit(1);
}

const packagePaths = glob.sync('./packages/*/package.json');
packagePaths.forEach(path => {
  const pkg = JSON.parse(readFileSync(path, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated ${path} to ${newVersion}`);
});
```

## 🏷️ Publishing Beta/Alpha Versions

For pre-release versions:

```bash
# Set version to beta
pnpm --filter "./packages/**" exec npm version 0.4.0-beta.0

# Publish with beta tag
pnpm --filter "./packages/**" publish --access public --tag beta
```

Install beta versions:
```bash
npm install @oroya/core@beta
```

## 📊 Post-Publishing Verification

After publishing, verify:

### 1. Check NPM Registry
Visit:
- https://www.npmjs.com/package/@oroya/core
- https://www.npmjs.com/package/@oroya/renderer-three
- https://www.npmjs.com/package/@oroya/renderer-svg
- https://www.npmjs.com/package/@oroya/loader-gltf

### 2. Test Installation
```bash
# Create a test project
mkdir test-oroya && cd test-oroya
npm init -y
npm install @oroya/core @oroya/renderer-three

# Test import
node -e "import('@oroya/core').then(m => console.log(Object.keys(m)))"
```

### 3. Test CDN Links
```html
<!-- Test on unpkg.com -->
<script type="module">
  import { Scene } from 'https://unpkg.com/@oroya/core@0.3.0/dist/index.js';
  console.log(Scene);
</script>
```

## 🚨 Troubleshooting

### Error: 403 Forbidden
- Ensure you're logged in: `npm whoami`
- Check organization access
- Verify `--access public` flag

### Error: Version Already Published
- NPM doesn't allow re-publishing same version
- Bump version and try again

### Error: Package Not Found (workspace:*)
- Build packages first: `pnpm build`
- Dependencies with `workspace:*` are resolved during publish

### TypeScript Errors After Publishing
- Ensure `types` field points to correct `.d.ts` file
- Check that declaration files are in `dist/` folder
- Verify `files` array includes `dist`

## 🎯 Recommended Workflow

1. Develop and test locally
2. Update version in all packages
3. Build: `pnpm build`
4. Test: `pnpm test`
5. Commit changes: `git commit -m "Release v0.4.0"`
6. Create tag: `git tag v0.4.0`
7. Push: `git push && git push --tags`
8. GitHub Actions automatically publishes to NPM
9. Verify on npmjs.com
10. Announce release on GitHub

## 📚 Related Documentation

- [CDN Setup](./cdn-setup.md) - Using packages via CDN
- [Vercel Deployment](./vercel-deployment.md) - Deploy documentation website
- [GitHub Actions](./.github/workflows/publish.yml) - CI/CD configuration
