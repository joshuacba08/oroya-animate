# Deployment & Publishing - Complete Guide

This directory contains comprehensive guides for deploying and publishing Oroya Animate.

## 📚 Documentation

### Core Guides
- **[NPM Publishing](./npm-publishing.md)** - Complete guide to publishing packages to NPM
- **[CDN Setup](./cdn-setup.md)** - Using Oroya Animate directly from CDN
- **[Vercel Deployment](./vercel-deployment.md)** - Deploy the documentation website to Vercel
- **[Package Metadata](./package-metadata.md)** - Optimize package discoverability on NPM
- **[Deployment Checklist](./CHECKLIST.md)** - Comprehensive release checklist

## 🚀 Quick Start

### Publish Packages to NPM

```bash
# 1. Update versions
node scripts/sync-versions.js 0.4.0

# 2. Build and test
pnpm build
pnpm test

# 3. Commit and tag
git commit -am "Release v0.4.0"
git tag v0.4.0

# 4. Push (GitHub Actions will auto-publish)
git push && git push --tags
```

### Deploy Website to Vercel

```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy
vercel --prod
```

## ⚙️ Configuration Files Created

All configuration files are ready to use:

- [`/.github/workflows/ci.yml`](../../.github/workflows/ci.yml) - Continuous Integration
- [`/.github/workflows/publish.yml`](../../.github/workflows/publish.yml) - NPM Publishing
- [`/.github/workflows/deploy-web.yml`](../../.github/workflows/deploy-web.yml) - Vercel Deployment
- [`/vercel.json`](../../vercel.json) - Vercel configuration
- [`/.npmrc`](../../.npmrc) - NPM configuration
- [`/scripts/sync-versions.js`](../../scripts/sync-versions.js) - Version synchronization

## 📦 Package Updates

All 4 packages now include:
- ✅ Complete metadata (keywords, author, repository, homepage)
- ✅ README.md with examples and badges
- ✅ Peer dependencies configuration
- ✅ SEO-optimized descriptions

Updated packages:
- `packages/core/package.json` + README.md
- `packages/renderer-three/package.json` + README.md
- `packages/renderer-svg/package.json` + README.md
- `packages/loader-gltf/package.json` + README.md

## 🔐 Required Secrets

### For NPM Publishing

Add to GitHub Secrets (Settings → Secrets → Actions):

- `NPM_TOKEN` - NPM authentication token
  ```bash
  npm token create --read-write
  ```

### For Vercel Deployment

Add to GitHub Secrets:

- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Organization ID
- `VERCEL_PROJECT_ID` - Project ID

Get these values:
```bash
vercel link
cat .vercel/project.json
```

## 📊 Automated Deployment Flow

```
Developer
   ↓
Push code or create tag
   ↓
GitHub Actions
   ↓
├─ CI Tests (on every push/PR)
├─ NPM Publish (on version tag)
└─ Vercel Deploy (on main branch)
   ↓
Published & Deployed
   ↓
├─ NPM Registry
├─ CDN (unpkg, jsDelivr, esm.sh)
└─ Vercel (oroya-animate.vercel.app)
```

## 🎯 First-Time Setup Checklist

### NPM Publishing
- [ ] Create NPM account at [npmjs.com](https://www.npmjs.com)
- [ ] Create `@joroya` organization
- [ ] Generate NPM token: `npm token create --read-write`
- [ ] Add `NPM_TOKEN` to GitHub Secrets
- [ ] Test build: `pnpm build && pnpm test`
- [ ] Create test tag to verify automation

### Vercel Deployment
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Install CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Link project: `vercel link`
- [ ] Get secrets: `cat .vercel/project.json`
- [ ] Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub Secrets
- [ ] Push to main to test automatic deployment

## 📝 New Package.json Scripts

The root `package.json` now includes:

```json
{
  "build:web": "Build packages and web app",
  "dev:web": "Run web app in development",
  "sync-versions": "Synchronize package versions",
  "publish:packages": "Build and publish all packages",
  "deploy:web": "Build and deploy website to Vercel"
}
```

## 🔄 Normal Release Workflow

1. **Develop** - Make changes, add features
2. **Test** - `pnpm test && pnpm typecheck`
3. **Version** - `node scripts/sync-versions.js X.Y.Z`
4. **Commit** - `git commit -am "Release vX.Y.Z"`
5. **Tag** - `git tag vX.Y.Z`
6. **Push** - `git push && git push --tags`
7. **Monitor** - Watch GitHub Actions complete
8. **Verify** - Check NPM, CDN, and Vercel

## ✅ Success Indicators

Everything is working correctly when:

- ✅ CI passes on every PR
- ✅ Tags trigger NPM publish automatically
- ✅ Packages appear on npmjs.com within minutes
- ✅ CDN links work immediately (unpkg, jsDelivr)
- ✅ Website deploys on push to main
- ✅ PR previews are created automatically
- ✅ All README badges show correct status

## 🐛 Troubleshooting

See detailed troubleshooting in each guide:
- [NPM Publishing Issues](./npm-publishing.md#-troubleshooting)
- [CDN Issues](./cdn-setup.md#-limitations--considerations)
- [Vercel Issues](./vercel-deployment.md#-troubleshooting)

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [NPM Documentation](https://docs.npmjs.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

## 📞 Support

- GitHub Issues: https://github.com/joshuacba08/oroya-animate/issues
- Discussions: https://github.com/joshuacba08/oroya-animate/discussions

---

**Last Updated:** 2026-02-16  
**Documentation Version:** 1.0.0

