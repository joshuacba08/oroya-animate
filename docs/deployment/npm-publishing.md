# NPM Publishing Guide

Oroya JS 1.2 distributes eleven packages: core, renderer-three, renderer-svg,
renderer-canvas2d, loader-gltf, physics, assets, input, inspector, react and vue.
They share one version and are released together.

## Authentication and permissions

Configure a trusted publisher for `publish.yml` on every package in npm.
Allow both direct publication and dist-tag management. The workflow uses a
GitHub-hosted runner, `id-token: write`, Node 24 and pinned npm 11.21.0.
OIDC tag management requires that npm version or newer; publishing permission
alone does not grant tag permission. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Local `npm login` / `npm whoami` concern interactive credentials and do not
prove that GitHub's trusted publisher has been configured. No token is committed
to the repository.
The configured `NPM_TOKEN` repository secret is also passed as `NODE_AUTH_TOKEN`
to the publish step, allowing token authentication when trusted publishing is
not configured. It needs publication and tag permissions for all eleven packages.

## Required evidence

Build libraries before applications, since applications import compiled dist.
The reusable CI checks Windows/Linux, Node 18/20/24 libraries, React 18 and
Node 24 applications. Before release, the publishing job also checks all package
manifests and declarations, external consumers, browsers and 30-minute endurance.
Accepted endurance evidence is reused when its digest matches the newly built
SDK; stale evidence is refreshed in CI before publication.

`validation/performance-latest.json` must pass the 10% budget on the reference's
own machine and match the built SDK digest. Do not compare unrelated CI hardware
or overwrite a baseline to hide a regression. Stable release additionally needs
physical Safari/iOS and Chrome/Android evidence with the exact release version
and matching digest.

`pnpm release:check --candidate` reports candidate evidence gaps;
`pnpm release:check` includes physical acceptance. These commands do not publish.

## Candidate first

Dispatch **Publish to NPM** with version `1.2.0-rc.0` and channel `next`.
The workflow aligns root/packages/internal peer versions, updates the lockfile,
builds and validates everything before running the coordinated publisher.

Packaging uses `pnpm pack`, which resolves workspace dependency protocols.
The publisher creates every tarball first, publishes in dependency order under
`release-staging`, verifies every registry version, then updates all `next`
tags. Consumers can install `@joroya/core@next` and matching renderer/binding
packages. An existing version is verified rather than overwritten on retry.

The local aliases `pnpm publish:release next` and `pnpm publish:packages next`
also run acceptance first and require an aligned prerelease version. Prefer
Actions for provenance and trusted authentication.

## Stable release and recovery

After candidate acceptance, prepare version `1.2.0`, collect physical evidence
for that version, and dispatch channel `latest`. Stable acceptance remains
blocking. npm versions are immutable; never attempt to overwrite a version.
The publisher also checks that every package's `next` tag names the same
candidate of this stable version before allowing promotion, and verifies the
requested tags after updating them.

The coordinated script changes requested tags only after all package versions
exist. Tag updates are separate registry operations, not an atomic transaction.
If a tag update fails, retry the same release after fixing permissions; existing
versions are verified and the remaining tag updates are reapplied.

After completion verify each package/version and dist-tag, then test clean
consumer installation. The repository's `verify:packages` checks packed
ESM/CJS JavaScript plus strict NodeNext ESM/CJS declarations outside the monorepo.

## Related documentation

- [Package metadata](package-metadata.md)
- [Deployment checklist](CHECKLIST.md)
- [Documentation deployment and rollback](vercel-deployment.md)
- [Capabilities and acceptance](../stability-1.2.md)
