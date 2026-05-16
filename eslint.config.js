// Flat ESLint config (ESLint 9+).
//
// Enforces the rules from docs/programming-principles.md that the
// TypeScript compiler cannot check by itself:
//   - §3.2 "no `any` as escape"
//   - §4.1 "no dejar imports sin usar"
//   - "no @ts-ignore" (the build-errors postmortem)
//
// The TypeScript compiler already covers `noUnusedLocals` /
// `noUnusedParameters` / `strict`, so ESLint focuses on the remainder.

import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/.astro/**',
            '**/coverage/**',
            'apps/**',                  // demos use loose typing during prototyping
            'packages/*/dist/**',
        ],
    },
    ...tseslint.configs.recommended,
    {
        files: ['packages/*/src/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/ban-ts-comment': ['error', {
                'ts-ignore': true,
                'ts-nocheck': true,
                'ts-expect-error': 'allow-with-description',
            }],
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            // Allow `Function`-typed parameters in EventEmitter / framework
            // glue where the precise signature is intentionally erased.
            '@typescript-eslint/no-unsafe-function-type': 'off',
        },
    },
    {
        // Tests can use a bit more flexibility (e.g. `any` for cast workarounds).
        files: ['packages/**/tests/**/*.ts', 'packages/**/test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
