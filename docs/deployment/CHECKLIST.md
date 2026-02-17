# Deployment Checklist

Use this checklist to ensure all steps are completed for successful deployment and publishing.

## ✁EPre-Publishing Checklist

### 1. Code Quality
- [ ] All tests passing: `pnpm test`
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Build successful: `pnpm build`
- [ ] Demos work correctly:
  - [ ] `pnpm dev:react`
  - [ ] `pnpm dev:vanilla`
- [ ] No console errors or warnings
- [ ] Code linted and formatted

### 2. Documentation
- [ ] README.md updated
- [ ] API documentation current
- [ ] CHANGELOG.md updated (if exists)
- [ ] Version numbers documented
- [ ] Breaking changes noted
- [ ] Migration guide (if needed)

### 3. Version Management
- [ ] Decided on version number (following semver)
- [ ] Updated all package.json files: `node scripts/sync-versions.js X.Y.Z`
- [ ] Version number matches across all packages
- [ ] Git working directory clean
- [ ] On correct branch (usually `main`)

### 4. Package Configuration
- [ ] `package.json` files have correct:
  - [ ] `name` with `@joroya/` scope
  - [ ] `version` field
  - [ ] `license` field (MIT)
  - [ ] `main`, `module`, `types` exports
  - [ ] `files` array includes `dist`
  - [ ] `repository`, `author`, `homepage` fields
  - [ ] Correct dependencies (no `workspace:*` in published)

### 5. Build Artifacts
- [ ] `dist/` folders exist in all packages
- [ ] Type definitions (`.d.ts`) generated
- [ ] Both ESM (`.js`) and CJS (`.cjs`) outputs present
- [ ] No source maps or dev artifacts in `dist/`

## 🚀 NPM Publishing

### One-Time Setup
- [ ] NPM account created
- [ ] `@oroya` organization created on NPM
- [ ] Team members added to organization (if applicable)
- [ ] NPM token generated: `npm token create --read-write`
- [ ] Token added to GitHub Secrets as `NPM_TOKEN`

### Publishing Steps

#### Option A: Automated (Recommended)
- [ ] Create git commit: `git commit -am "Release vX.Y.Z"`
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push commits: `git push`
- [ ] Push tags: `git push --tags`
- [ ] Wait for GitHub Action to complete
- [ ] Verify on npmjs.com

#### Option B: Manual
- [ ] Login to NPM: `npm login`
- [ ] Publish all packages: `pnpm publish:packages`
- [ ] Verify each package on npmjs.com:
  - [ ] `@joroya/core`
  - [ ] `@joroya/renderer-three`
  - [ ] `@joroya/renderer-svg`
  - [ ] `@joroya/loader-gltf`

## 🌐 CDN Verification

After NPM publishing, verify CDN availability:

- [ ] unpkg.com:
  - [ ] https://unpkg.com/@joroya/core@X.Y.Z/
  - [ ] https://unpkg.com/@joroya/core@X.Y.Z/dist/index.js
- [ ] jsDelivr:
  - [ ] https://cdn.jsdelivr.net/npm/@joroya/core@X.Y.Z/
  - [ ] https://cdn.jsdelivr.net/npm/@joroya/core@X.Y.Z/dist/index.js
- [ ] esm.sh:
  - [ ] https://esm.sh/@joroya/core@X.Y.Z

## 📦 Vercel Deployment

### One-Time Setup
- [ ] Vercel account created
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Project linked: `vercel link`
- [ ] Environment variables configured (if needed)
- [ ] Vercel secrets added to GitHub:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`

### Deployment Steps

#### Option A: Automated (Recommended)
- [ ] Merge to `main` branch
- [ ] GitHub Action automatically deploys
- [ ] Check deployment status on Vercel dashboard
- [ ] Verify website loads correctly

#### Option B: Manual
- [ ] Build locally: `pnpm build:web`
- [ ] Deploy: `vercel --prod`
- [ ] Get deployment URL
- [ ] Test website functionality

### Post-Deployment Verification
- [ ] Website loads: https://oroya-animate.vercel.app
- [ ] All pages accessible
- [ ] Documentation readable
- [ ] Interactive demos work
- [ ] No 404 errors
- [ ] Assets loading correctly
- [ ] Mobile responsive

## 🎯 Post-Release Tasks

### Documentation Updates
- [ ] Update main README.md with:
  - [ ] New version number in badges
  - [ ] New version in CDN examples
  - [ ] New version in installation instructions
- [ ] Update website documentation
- [ ] Update package READMEs

### Communication
- [ ] Create GitHub Release with changelog
- [ ] Announce on GitHub Discussions (if applicable)
- [ ] Tweet/post on social media (if applicable)
- [ ] Update any external documentation sites
- [ ] Notify users of breaking changes (if any)

### Monitoring
- [ ] Check NPM download stats
- [ ] Monitor GitHub issues for bug reports
- [ ] Check Vercel analytics
- [ ] Review error logs (if any)

## 🔍 Verification Script

Test installation in a fresh project:

```bash
# Create test directory
mkdir test-oroya-install
cd test-oroya-install

# Initialize project
npm init -y

# Install packages
npm install @joroya/core@X.Y.Z @joroya/renderer-three@X.Y.Z

# Test import
node --input-type=module -e "import('@joroya/core').then(m => console.log('✁ECore:', Object.keys(m).length, 'exports'))"

node --input-type=module -e "import('@joroya/renderer-three').then(m => console.log('✁EThree:', Object.keys(m).length, 'exports'))"

# Test TypeScript types
echo "import { Scene } from '@joroya/core';" > test.ts
npx tsc --noEmit test.ts && echo "✁ETypeScript types OK"

# Cleanup
cd ..
rm -rf test-oroya-install
```

## 🚨 Rollback Plan

If something goes wrong:

### NPM Rollback
```bash
# Deprecate broken version
npm deprecate @joroya/core@X.Y.Z "Broken release, use X.Y.Z-1 instead"

# Publish fixed version
node scripts/sync-versions.js X.Y.Z+1
pnpm build
pnpm publish:packages
```

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback oroya-animate --target DEPLOYMENT_URL
```

### GitHub Release
- Edit release on GitHub
- Mark as "Pre-release" or delete
- Push fixed version

## 📊 Post-Release Metrics (Week 1)

Track these metrics after release:

- [ ] NPM downloads: _______
- [ ] GitHub stars: _______
- [ ] Issues opened: _______
- [ ] Issues closed: _______
- [ ] Website visits: _______
- [ ] CDN requests: _______

## 📅 Release Schedule Recommendation

- **Patch releases** (bug fixes): As needed
- **Minor releases** (new features): Monthly
- **Major releases** (breaking changes): Quarterly

## 🎓 Lessons Learned

After each release, document:

- What went well:
  - 
  - 

- What could be improved:
  - 
  - 

- Action items for next release:
  - 
  - 

---

**Last Updated:** 2026-02-16
**Template Version:** 1.0.0
