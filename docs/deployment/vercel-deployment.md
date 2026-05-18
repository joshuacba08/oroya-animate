# Vercel Deployment Guide

Last verified: May 18, 2026.

This guide explains how to deploy the Oroya Animate documentation website to Vercel.
The website is the Astro app in `apps/web`, but it depends on workspace packages from
`packages/*`, so deployment must install and build from the monorepo root.

## Current Project Shape

- App: `apps/web`
- Framework: Astro 5
- Output mode: static
- Static output directory: `apps/web/dist`
- Production URL: `https://oroya-animate.oroyajs.com`
- Root package manager: `pnpm@9.1.0`
- Root build script for the site: `pnpm build:web`

The site is static Astro, so it does not need `@astrojs/vercel`. Add that adapter only
if the site later moves to SSR, server endpoints, or Vercel Functions.

## Recommended Deployment Model

Use Vercel as a linked project and deploy from GitHub Actions with the Vercel CLI.
This keeps deployment gated by the same CI steps we run for packages:

1. Install dependencies from the monorepo root.
2. Build all workspace packages.
3. Build the Astro site.
4. Deploy to Vercel.

The current workflow is `.github/workflows/deploy-web.yml`.

Production deploys happen on pushes to `main` when files under these paths change:

- `apps/web/**`
- `packages/**`
- `pnpm-lock.yaml`

Preview deploys happen on pull requests to `main` for changes under:

- `apps/web/**`
- `packages/**`

## Vercel Project Setup

Create or link a Vercel project for the docs site.

```bash
npm i -g vercel@latest
vercel login
vercel link
```

When prompted, link the repository to a project named something like `oroya-animate`.
Run the command from the repository root, not from `apps/web`.

After linking, Vercel creates:

```text
.vercel/project.json
```

That file contains:

```json
{
  "orgId": "...",
  "projectId": "..."
}
```

Do not commit `.vercel/`. Use those values as GitHub Actions secrets instead.

## Required GitHub Secrets

In GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

| Secret | Source |
|---|---|
| `VERCEL_TOKEN` | Vercel account/team token |
| `VERCEL_ORG_ID` | `.vercel/project.json` -> `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` -> `projectId` |

Create the token in Vercel:

```text
Vercel Dashboard -> Account Settings -> Tokens -> Create Token
```

Use a name like `oroya-animate-github-actions`. Give it access to the team/project
that owns `oroya-animate`.

## Root `vercel.json`

Keep Vercel config at the repository root so the CLI can deploy from the same place
GitHub Actions builds the monorepo.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "oroya-animate",
  "framework": "astro",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build:web",
  "outputDirectory": "apps/web/dist",
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
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
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
  ]
}
```

Important: do not use `cd ../..` in a root-level `vercel.json`. Commands in this
file are evaluated for the Vercel project root. For this repository, the intended
project root is the monorepo root.

## GitHub Actions Workflow

The current workflow deploys from source:

```yaml
- name: Deploy to Vercel (Production)
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npx vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }} --yes
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Preview deploys are the same without `--prod`.

This is acceptable for this repo. Vercel receives the source, runs the configured
build, and serves the static `apps/web/dist` output.

### Optional: Prebuilt Deployments

If you want GitHub Actions to build the exact artifact and then upload only the
Vercel build output, use Vercel's prebuilt flow:

```yaml
- name: Pull Vercel project settings
  run: npx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

- name: Build Vercel output
  run: npx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

- name: Deploy prebuilt output
  run: npx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Use this only if you specifically want CI-built artifacts to be uploaded. For this
static Astro site, either source deploys or prebuilt deploys are valid. If the site
starts depending on Vercel System Environment Variables at build time, prefer Git
deployments or source deploys over `--prebuilt`.

## Local Commands

Run from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build:web
```

Preview locally after build:

```bash
pnpm --filter web preview
```

Deploy a preview from the CLI:

```bash
vercel deploy
```

Deploy production from the CLI:

```bash
vercel deploy --prod
```

Useful CLI checks:

```bash
vercel ls
vercel inspect <deployment-url>
vercel logs <deployment-url>
vercel rollback <deployment-url>
```

## Vercel Dashboard Settings

If configuring through the dashboard, use these values:

| Setting | Value |
|---|---|
| Framework Preset | Astro |
| Project Root Directory | repository root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build:web` |
| Output Directory | `apps/web/dist` |
| Node.js Version | 20.x |

Do not set the root directory to `apps/web` unless you also rewrite build commands
to jump back to the monorepo root. The root setup is simpler and matches the
repository scripts.

## Environment Variables

The current site does not require custom Vercel environment variables.

For public browser values in Astro, use the `PUBLIC_` prefix:

```text
PUBLIC_SITE_URL=https://oroya-animate.oroyajs.com
PUBLIC_NPM_SCOPE=@joroya
```

For server-only values, do not use `PUBLIC_`.

Vercel can automatically expose system variables such as `VERCEL_URL`,
`VERCEL_BRANCH_URL`, and `VERCEL_PROJECT_PRODUCTION_URL`. Enable this in:

```text
Vercel Project -> Settings -> Environment Variables ->
Automatically expose System Environment Variables
```

The code currently uses the Astro `site` value in `apps/web/astro.config.mjs` and
fallbacks in layouts, so no Vercel system variable is required for normal static
deployments.

## Custom Domain

Add domains in:

```text
Vercel Project -> Settings -> Domains
```

General DNS values as of May 18, 2026:

```text
A     @    76.76.21.21
CNAME www  cname.vercel-dns-0.com
```

Vercel may show project-specific DNS instructions. Prefer the values shown in the
dashboard or verify with:

```bash
vercel domains inspect your-domain.com
```

If you add a custom production domain, update:

- `apps/web/astro.config.mjs`
- `apps/web/public/robots.txt`
- package `homepage` fields if the docs URL changes

## Troubleshooting

### `Command not found: pnpm`

Use the root `packageManager` field and keep the install command explicit:

```json
"packageManager": "pnpm@9.1.0"
```

```text
pnpm install --frozen-lockfile
```

### Workspace packages cannot be resolved

Build from the monorepo root:

```bash
pnpm build:web
```

The web app imports workspace packages such as `@joroya/core`, so packages must be
available through the workspace install and built before `astro build`.

### Vercel deploys but the page is stale

Check that the deploy-web workflow ran for the commit. The workflow has path filters,
so docs-only changes outside `apps/web/**`, `packages/**`, or `pnpm-lock.yaml` do not
trigger a web deployment.

### Production deploy did not run

Production deploys only run on pushes to `main`. Pull requests create preview
deployments.

### `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` missing

Run:

```bash
vercel link
```

Then copy values from:

```text
.vercel/project.json
```

into GitHub Actions secrets.

### `--prebuilt` deployment has missing build-time values

Vercel documents that System Environment Variables are not present at build time for
prebuilt deploys. Use source deploys or Git-based deployments if the build requires
those values.

## Official References

- Vercel Astro framework guide: <https://vercel.com/docs/frameworks/frontend/astro>
- Vercel monorepo guide: <https://vercel.com/docs/monorepos>
- Vercel build settings: <https://vercel.com/docs/builds/configure-a-build>
- Vercel CLI deploy: <https://vercel.com/docs/cli/deploy>
- Vercel GitHub Actions guide: <https://vercel.com/guides/how-can-i-use-github-actions-with-vercel>
- Vercel custom domains: <https://vercel.com/docs/domains/set-up-custom-domain>
- Vercel system environment variables: <https://vercel.com/docs/environment-variables/system-environment-variables>
