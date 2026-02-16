# Vercel Deployment Guide

This guide explains how to deploy the Oroya Animate documentation website (Astro) to Vercel.

## 🌐 Overview

The `apps/web` directory contains an Astro-based documentation and showcase website that should be deployed to Vercel.

**Recommended URL Structure:**
- Production: `https://oroya-animate.vercel.app` or custom domain
- Preview: Auto-generated for each PR

## 🚀 Quick Deployment

### Option 1: Vercel CLI (Fastest)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy from Monorepo Root
```bash
# First deployment (interactive)
vercel

# Select:
# - Scope: Your account/team
# - Link to existing project: No
# - Project name: oroya-animate
# - Directory: apps/web
# - Build command: pnpm build
# - Output directory: dist

# Production deployment
vercel --prod
```

### Option 2: Vercel Dashboard (Recommended for CI/CD)

#### 1. Import from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository `joshuacba08/oroya-animate`
3. Vercel will detect the monorepo structure

#### 2. Configure Project

**Framework Preset:** Astro

**Root Directory:** `apps/web`

**Build Command:**
```bash
cd ../.. && pnpm install && pnpm build && cd apps/web && pnpm build
```

**Output Directory:** `dist` (default for Astro)

**Install Command:**
```bash
pnpm install
```

#### 3. Environment Variables

Currently no environment variables needed. Add if you integrate:
- `PUBLIC_API_URL` - API endpoint
- `PUBLIC_GA_ID` - Google Analytics
- `PUBLIC_NPM_SCOPE` - NPM organization

#### 4. Deploy

Click **Deploy** button. Vercel will:
1. Clone repository
2. Install dependencies
3. Build packages
4. Build Astro site
5. Deploy to CDN

## ⚙️ Configuration Files

### vercel.json

Create `vercel.json` at project root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "oroya-animate",
  "buildCommand": "pnpm install && pnpm build && cd apps/web && pnpm build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "pnpm install",
  "framework": "astro",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/docs",
      "destination": "/docs/getting-started",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/apps/web/$1"
    }
  ]
}
```

### apps/web/vercel.json (Alternative)

Or place in `apps/web/` directory:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "buildCommand": "cd ../.. && pnpm install && pnpm build && cd apps/web && pnpm build",
  "outputDirectory": "dist",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "astro"
}
```

## 📂 Monorepo Setup

### Important Notes

⚠️ **Vercel needs access to workspace packages:**
- Build must run from monorepo root or include pnpm install at root
- Packages must be built before building the web app
- `workspace:*` dependencies must be resolved

### Build Script Breakdown

```bash
# Navigate to root (if in subdirectory)
cd ../..

# Install all workspace dependencies
pnpm install

# Build all packages in packages/ directory
pnpm build

# Navigate to web app
cd apps/web

# Build Astro site (uses built packages)
pnpm build
```

### package.json Build Script (Root)

Update root `package.json` to add deployment script:

```json
{
  "scripts": {
    "build": "pnpm --filter \"./packages/**\" build",
    "build:web": "pnpm build && pnpm --filter \"web\" build",
    "deploy:web": "pnpm build:web && vercel --prod"
  }
}
```

## 🔧 Vercel Project Settings

### Build & Development Settings

| Setting | Value |
|---------|-------|
| Framework | Astro |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm install && pnpm build && cd apps/web && pnpm build` |
| Output Directory | `dist` |
| Install Command | `pnpm install` |
| Node Version | 18.x or 20.x |

### Environment Variables (Optional)

Add in Vercel Dashboard → Settings → Environment Variables:

```bash
# Example variables
PUBLIC_SITE_URL=https://oroya-animate.vercel.app
PUBLIC_NPM_PACKAGE=@oroya/core
PUBLIC_GITHUB_REPO=joshuacba08/oroya-animate
```

Access in Astro:
```javascript
const siteUrl = import.meta.env.PUBLIC_SITE_URL;
```

## 🌍 Custom Domain

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `oroya-animate.com`)
3. Follow DNS configuration instructions

### 2. DNS Configuration

**Option A: Vercel Nameservers (Recommended)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Option B: CNAME Record**
```
CNAME www cname.vercel-dns.com
A @ 76.76.21.21
```

### 3. Update Astro Config

Update `apps/web/astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://oroya-animate.com',
  // ... other config
});
```

## 🚦 Deployment Workflow

### Automatic Deployments

Vercel automatically deploys:

- **Production:** Commits to `main` branch → `oroya-animate.vercel.app`
- **Preview:** Pull requests → Unique preview URL per PR

### Manual Deployment

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Deploy specific branch
vercel --prod --scope your-team
```

## 📊 GitHub Integration

### Automatic Checks on PRs

Vercel adds build status to PRs:
- ✅ Build successful → "Visit Preview"
- ❌ Build failed → See logs

### Deployment Comments

Vercel bot comments on PRs with:
- Preview URL
- Build logs
- Deployment status

### Configure in GitHub

Repository Settings → Integrations → Vercel:
- Enable status checks
- Enable preview comments
- Require build success before merge

## 🔐 Protected Deployments

### Password Protection

For staging environments:

```json
{
  "protection": {
    "password": {
      "enabled": true
    }
  }
}
```

### Authentication

Configure in Vercel Dashboard → Settings → Deployment Protection.

## 📈 Analytics & Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:

```bash
pnpm add @vercel/analytics
```

In `apps/web/src/layouts/Layout.astro`:
```astro
---
import { Analytics } from '@vercel/analytics';
---
<html>
  <head>...</head>
  <body>
    ...
    <Analytics />
  </body>
</html>
```

### Web Vitals

Enable Speed Insights:
```bash
pnpm add @vercel/speed-insights
```

## 🎯 Best Practices

### 1. Preview Deployments

Every PR gets a unique URL:
```
https://oroya-animate-pr-123.vercel.app
```

Use for:
- Testing new features
- Reviewing UI changes
- Sharing with stakeholders

### 2. Build Caching

Vercel caches:
- `node_modules/`
- `pnpm-lock.yaml`
- Build outputs

Speed up builds by keeping dependencies stable.

### 3. Output Optimization

Astro automatically optimizes:
- Image compression
- Asset minification
- Bundle splitting

### 4. Edge Functions

Use Astro SSR with Vercel Edge:

```javascript
// apps/web/astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel()
});
```

## 🐛 Troubleshooting

### Build Fails: "Package not found"

**Problem:** Workspace dependencies not resolved.

**Solution:**
```bash
# Build packages first
cd ../.. && pnpm build
```

Update Build Command:
```bash
cd ../.. && pnpm install && pnpm build && cd apps/web && pnpm build
```

### Build Fails: "Command not found: pnpm"

**Problem:** Vercel using npm instead of pnpm.

**Solution:** Add `.npmrc` or `vercel.json`:

```json
{
  "installCommand": "pnpm install"
}
```

Or create `.vercelrc`:
```json
{
  "installCommand": "pnpm install"
}
```

### Blank Page After Deploy

**Problem:** Base path or routing issue.

**Solution:** Check `astro.config.mjs`:
```javascript
export default defineConfig({
  site: 'https://oroya-animate.vercel.app',
  base: '/', // Ensure this is correct
});
```

### Assets Not Loading

**Problem:** Incorrect asset paths.

**Solution:** Use relative paths or Astro's asset imports:
```astro
---
import logo from '../assets/logo.svg';
---
<img src={logo} alt="Logo" />
```

### Slow Build Times

**Solutions:**
1. Enable build caching
2. Reduce package rebuilds (check if really needed)
3. Use `--filter` to build only changed packages
4. Split builds (packages in separate jobs)

## 📚 Related Documentation

- [NPM Publishing](./npm-publishing.md) - Publish packages referenced in docs
- [GitHub Actions CI/CD](../../.github/workflows/deploy-web.yml) - Automated deployment
- [Astro Documentation](https://docs.astro.build/) - Astro-specific configuration
- [Vercel Documentation](https://vercel.com/docs) - Vercel platform

## 🎬 Quick Reference

```bash
# First-time setup
vercel login
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs oroya-animate

# Remove deployment
vercel rm oroya-animate

# Rollback to previous deployment
vercel rollback oroya-animate
```

## 🔗 Useful Links

After deployment, update these in your repository:
- **Live Site:** `https://oroya-animate.vercel.app`
- **Vercel Dashboard:** `https://vercel.com/your-team/oroya-animate`
- **Analytics:** `https://vercel.com/your-team/oroya-animate/analytics`
