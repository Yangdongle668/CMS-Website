// ESLint flat config.
//
// Deliberately narrow: this is being added to a codebase of ~11k lines that
// was written without it, so a maximalist ruleset would produce thousands of
// findings nobody reads. The rules here are the ones that catch bugs that
// reach production — chief among them no-undef, which would have caught a
// middleware referencing a module it had never required and returning 500 on
// every homepage request.
//
// Style is left entirely to Prettier (eslint-config-prettier turns off the
// rules that would fight it).

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'public/dist/**',
      'uploads/**',
      'data/**',
      'coverage/**',
    ],
  },

  // ----- Server, scripts: CommonJS on Node -----
  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,

      // The bug class this config exists for.
      'no-undef': 'error',

      // Unused code is usually a leftover or a typo, but an unused function
      // argument is often deliberate (Express error handlers need four).
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        varsIgnorePattern: '^_',
      }],

      // `catch (_) {}` is this codebase's idiom for "this failure is genuinely
      // not actionable" and appears ~40 times, usually around best-effort
      // filesystem work. Flagging all of them would be noise, not signal.
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Matching control characters is the entire point of the upload and URL
      // sanitizers in services/upload-guard.js and services/image-render.js.
      'no-control-regex': 'off',

      // Flags `let x = <default>` immediately before a try that assigns x on
      // every path. That is this codebase's defensive-initialisation style, not
      // a defect, and rewriting it inside the inquiry pipeline to satisfy a
      // style rule is a worse trade than leaving it.
      'no-useless-assignment': 'off',

      // Correctness rules that are cheap and have no false-positive tax here.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-return-await': 'error',
      'require-atomic-updates': 'off', // too noisy against Express handlers
      'no-console': 'off',             // the server logs to stdout by design
    },
  },

  // ----- Tests: same, plus the node:test globals -----
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // ----- Browser-side: public/ and admin/ -----
  {
    files: ['public/**/*.js', 'admin/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Cross-file globals this codebase sets on window.
        AdminAPI: 'readonly',
        Quill: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-assignment': 'off', // same defensive-init style as the server
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  prettier,
];
