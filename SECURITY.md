# Security Policy

## Supported versions

Security fixes are issued for the latest minor of each supported major.

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Yes             |
| 0.12.x  | ⚠️ Critical fixes only — please upgrade to 1.x |
| < 0.12  | ❌ No              |

## Reporting a vulnerability

**Do not open a public issue for security reports.** Use one of the
following private channels:

- **GitHub Security Advisories**: <https://github.com/joshuacba08/oroya-animate/security/advisories/new>
- **Email**: security disclosures can be sent to the maintainer via the
  contact details on the [organization profile](https://github.com/joshuacba08).

When you report, please include:

1. A description of the issue and its impact.
2. Steps to reproduce (a minimal repro repo or gist if possible).
3. The affected version(s).
4. Any suggested fix or mitigation, if you have one.

## Triage timeline

- **Initial response**: within 5 business days.
- **Confirmation or rejection**: within 14 business days.
- **Fix release**: target 30 days for high severity; lower-severity
  issues are bundled into the next regular minor.
- **Public disclosure**: coordinated with the reporter; usually after a
  patched release is available and a reasonable upgrade window has
  passed.

## Scope

Reports are in scope for any of the published `@joroya/*` packages and
the demo applications under `apps/`. Out of scope:

- Vulnerabilities in upstream dependencies (`three`, `cannon-es`, etc.) —
  report those to the upstream project. We will track and patch our
  consumption once the upstream fix lands.
- Issues that require attacker control of the build pipeline or local
  developer environment.
- Findings against the **content** of a scene file (intentional WebGL
  shader behavior, etc.) rather than the library code itself.

## Hardening notes

- The library does **not** evaluate scene content as code. Scenes are
  pure data (JSON via the v0.10+ serializer).
- `loadGLTF` and `AssetManager` fetch URLs with the standard browser
  `fetch` / `Image` / `AudioContext.decodeAudioData` pipelines and do
  not extend their attack surface beyond what the browser already
  permits.
- The `Inspector` and visual editor add no network endpoints; they are
  pure client-side DOM.

Thank you for helping keep Oroya Animate safe.
