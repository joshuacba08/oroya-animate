<!--
Thanks for the PR! Please fill in the sections below.
Delete the bracketed prompts — the headings should remain.
-->

## Summary

<!-- One or two sentences on what this PR does and why. -->

## Type of change

- [ ] Bug fix (non-breaking, fixes an issue)
- [ ] New feature (non-breaking, adds capability)
- [ ] Breaking change (changes a `@public` API — requires major bump)
- [ ] Docs / chore (no source change)

## Stability impact

<!--
For source changes, identify the stability tier of the touched APIs.
See docs/api-stability.md.
-->

- [ ] Touches `@public` APIs → I have followed the deprecation policy
- [ ] Touches `@experimental` APIs only
- [ ] No public-API impact

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds for every workspace package
- [ ] CHANGELOG updated (en + es + ja for shipping changes)
- [ ] If this is a breaking change, an EPIC under `docs/features/` documents it
- [ ] If this touches the editor or demos, I ran `pnpm dev:web` (or the relevant dev command) and verified the behavior in a browser

## Test plan

<!--
What did you do to convince yourself this works? Steps + commands.
-->
