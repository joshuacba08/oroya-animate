# Vercel Deployment Guide

Updated: October 11, 2026. Deployment status is recorded in [the maintenance report](../maintenance-review.md).

The static Astro app in `apps/web` consumes compiled workspace packages.
Install and build from the monorepo root. Production is [oroya-animate.oroyajs.com](https://oroya-animate.oroyajs.com).

## Project settings

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Framework | Astro |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm build:web` |
| Output | `apps/web/dist` |
| Application/CLI Node version | 24 |
| Package manager | pnpm 9.1.0 |

The static site does not require an Astro server adapter.
The linked project's IDs live in the ignored `.vercel/project.json`; keep the existing project.

## Credentials

The linked project's credentials already live in GitHub Settings → Environments →
`Production`. The deployment job selects that environment to access its secrets:

| Secret | Value |
| --- | --- |
| VERCEL_TOKEN | A Vercel token with access to the linked project's team |
| VERCEL_ORG_ID | `orgId` from `.vercel/project.json` |
| VERCEL_PROJECT_ID | `projectId` from `.vercel/project.json` |

The credential environment is shared by this project's preview and production jobs.
The workflow's selected Vercel target (`preview` or `production`) determines where the
artifact is deployed; the GitHub environment name does not override that target.

Never commit or send the token in chat. If linking a new checkout is necessary, use
`pnpm dlx vercel@63.1.2 link` from the repository root. Project linking is setup;
deployments run exclusively through GitHub Actions.

## Preview and production

`vercel.json` sets `git.deploymentEnabled` to `false`, so Vercel's Git integration
does not create deployments alongside Actions.

1. Open a pull request to `main`. The deploy workflow calls the complete CI workflow.
2. Libraries pass lint, types, strict API audit, tests and builds on Node 18/20.
   Apps pass lint, types, documentation synchronization, links/example compilation,
   builds and browser tests on Node 24, after packages have been built.
3. Actions pulls preview settings, builds with Vercel CLI 63.1.2 and deploys
   the prebuilt output to the existing linked project.
4. HTTP checks confirm the expected commit and new guides in English, Spanish and Japanese.
   Browser checks cover navigation, WebGL, SVG interaction, gallery mount cycles and Monaco execution.
5. Integrate into `main` only after the preview succeeds. The production workflow repeats
   validation, captures the current production deployment, then builds and deploys production.
6. HTTP checks also verify the public custom domain. Verification failure rolls back to
   the captured deployment; successful deployments record their commit and URL in the run summary/artifact.

Path filters include apps, packages, docs, scripts, browser tests, workflows, README files,
dependency manifests and build/configuration files. A docs-only change triggers deployment.

For a manual rerun, dispatch the workflow, rather than a local Vercel deployment:

```bash
gh workflow run deploy-web.yml --ref main
# Equivalent repository command:
pnpm deploy:web
```

Dispatch on a feature branch for preview. Dispatch on `main` for production.
GitHub CLI must be installed and authenticated to dispatch. Package publishing is a separate
workflow; documentation maintenance does not create npm releases or version tags.

## Local verification

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm api:check:strict
pnpm test
pnpm docs:check
pnpm docs:validate
pnpm build:apps
pnpm exec playwright install chromium
pnpm test:browser
```

Windows browser checks use installed Microsoft Edge; Linux CI installs Chromium.
For a local site preview use `pnpm --filter web preview` after its build.

## Build identity and domains

Actions supplies `PUBLIC_DOCS_COMMIT` during the build. The two site layouts emit an
`oroya-commit` meta tag; HTTP verification compares it with the workflow commit.
Normal local builds omit that optional tag.

Retain the existing custom domain. For DNS changes, use the project-specific values shown
in Vercel's Domains settings. If the production domain changes, update Astro's `site`,
layout fallbacks, robots.txt and the workflow's public verification URL together.

## Troubleshooting

- Missing credentials: verify that the job selects `Production` and that its three environment secrets are present before rerunning it.
- Unresolved workspace imports: build packages before running consumers; their entry points use `dist/`.
- Synchronization drift: edit canonical `docs/` sources, run `pnpm docs:sync` and commit both copies.
- HTTP 401 on preview: inspect deployment protection for the linked project and arrange authorized
  automation access before accepting the preview.
- Unexpected commit or stale page: inspect the run's deployment URL, meta tag and HTTP verification logs.
- Production verification failure: inspect the rollback step and rerun only after correcting the cause.

## References

- [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel CLI deploy](https://vercel.com/docs/cli/deploy)
- [Vercel CLI inspect](https://vercel.com/docs/cli/inspect)
- [Vercel CLI rollback](https://vercel.com/docs/cli/rollback)
