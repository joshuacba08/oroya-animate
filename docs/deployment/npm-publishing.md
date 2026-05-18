# NPM Publishing Guide

This guide explains how to publish the Oroya Animate 1.x package set to NPM.

## Publishable Packages

The monorepo currently publishes 11 workspace packages:

- `@joroya/core` - Core scene graph, ECS components, math, serialization, plugins
- `@joroya/renderer-three` - Three.js/WebGL renderer
- `@joroya/renderer-svg` - SVG renderer and SVG utilities
- `@joroya/renderer-canvas2d` - Canvas2D renderer
- `@joroya/loader-gltf` - glTF/GLB loader
- `@joroya/physics` - cannon-es physics integration
- `@joroya/assets` - Asset loading/cache helpers
- `@joroya/input` - Keyboard, mouse, and gamepad input manager
- `@joroya/inspector` - Debug/inspection overlay
- `@joroya/react` - React bindings
- `@joroya/vue` - Vue bindings

## Prerequisites

Create an NPM account, create or join the `@joroya` organization, then authenticate locally:

```bash
npm login
npm whoami
```

For GitHub Actions publishing, create an NPM automation token and save it as `NPM_TOKEN` in repository secrets.

Create the token from the NPM website:

1. Go to <https://www.npmjs.com/>.
2. Open your account menu, then **Access Tokens**.
3. Click **Generate New Token**.
4. Choose **Automation** for CI publishing.
5. Name it something like `oroya-animate-github-actions`.
6. Copy the token immediately.

Then add it to the GitHub repository:

1. Open the GitHub repository.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret**.
4. Name: `NPM_TOKEN`
5. Secret: paste the NPM token.

Avoid committing the token or saving it in `.npmrc`. GitHub Actions reads it from `${{ secrets.NPM_TOKEN }}` during the publish workflow.

## Package Configuration

Each package should keep:

- `version` aligned across all `packages/*/package.json` files
- `license`, `author`, `repository`, `homepage`, and `bugs`
- `main`, `module`, `types`, and an `exports` map with `types` first
- `files: ["dist"]`
- package-local `peerDependencies` and `devDependencies`

Peer dependencies on Oroya packages should point to the current stable major, for example:

```json
{
  "peerDependencies": {
    "@joroya/core": "^1.0.0"
  }
}
```

## Release Workflow

Use the root scripts from the repository root.

```bash
# 1. Sync all package versions.
node scripts/sync-versions.js 1.0.1

# 2. Run the same gates CI runs before publish.
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# 3. Commit and tag the release.
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1

# 4. Push. The publish workflow runs on v*.*.* tags.
git push origin main
git push origin v1.0.1
```

The publish workflow runs lint, typecheck, tests, build, `publint`, and `@arethetypeswrong/cli` before publishing every package with provenance.

## Manual Publishing

Manual publishing is mostly for dry runs or emergency releases. Prefer the tag-based GitHub Action for normal releases.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter "./packages/**" publish --access public --no-git-checks
```

Use `--access public` because the packages are scoped.

## Pre-release Channels

For beta, next, or canary builds, sync a prerelease version and publish with a matching dist-tag.

```bash
node scripts/sync-versions.js 1.1.0-beta.0
pnpm build
pnpm --filter "./packages/**" publish --access public --tag beta --no-git-checks
```

Consumers install prereleases by tag:

```bash
npm install @joroya/core@beta
```

## Post-publish Verification

After the workflow finishes:

```bash
npm view @joroya/core version
npm view @joroya/renderer-three version
npm view @joroya/renderer-svg version
npm view @joroya/renderer-canvas2d version
npm view @joroya/loader-gltf version
```

Test installation in a clean project:

```bash
mkdir test-oroya
cd test-oroya
npm init -y
npm install @joroya/core @joroya/renderer-three three
node -e "import('@joroya/core').then(m => console.log(Object.keys(m).length))"
```

Test CDN resolution:

```html
<script type="module">
  import { Scene } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  console.log(Scene);
</script>
```

## Troubleshooting

### 403 Forbidden

- Confirm `npm whoami` locally or that `NPM_TOKEN` exists in GitHub Secrets.
- Confirm the token has publish rights for the `@joroya` organization.
- Keep `--access public` for scoped packages.

### Version Already Published

NPM does not allow re-publishing the same version. Sync a new patch, prerelease, or next version and publish again.

### Workspace Dependencies

Workspace dependencies are resolved during publish. Always run `pnpm build` before publishing so `dist/` and `.d.ts` files exist.

### Type Resolution Issues

Check package `exports` maps, `types` fields, and the contents of `dist/`. The CI workflow runs `publint` and `@arethetypeswrong/cli` to catch this before publishing.

## Related Documentation

- [CDN Setup](./cdn-setup.md)
- [Package Metadata](./package-metadata.md)
- [Deployment Checklist](./CHECKLIST.md)
- [Vercel Deployment](./vercel-deployment.md)
