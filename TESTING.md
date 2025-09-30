# Testing Guide

This project now uses [Vitest](https://vitest.dev/) with a JSDOM environment to exercise the browser scripts in isolation. The configuration lives in `vitest.config.js` and the test files are stored under `tests/`.

## Getting Started

1. Install dependencies (first run only):
   ```bash
   npm install
   ```
2. Execute the entire test suite:
   ```bash
   npm test
   ```
3. Generate a coverage report (outputs both text summary and HTML under `coverage/`):
   ```bash
   npm run test:coverage
   ```

## Current Coverage

- `app.js` is exercised end-to-end to ensure the XMLHttpRequest instrumentation stays intact even when the page tries to override it.
- `content.js` utilities are validated via direct extraction tests that assert the existing minified logic without needing to run the full content script.

## Adding New Tests

- Create files in `tests/` with the `*.test.js` suffix so Vitest will pick them up automatically.
- Prefer exercising real code paths. When a module is hard to load in Node (for example, because it depends on the Twitter DOM), consider extracting the pure helper into a small module first, then test that helper in isolation.
- Update `coverage.exclude` in `vitest.config.js` when you start covering additional files (for example, once `content.js` gets refactored into importable modules).

## Tips for Browser APIs

- The global `chrome` object and minimal `crypto` implementation are stubbed in `vitest.setup.js`. Extend those stubs only as-needed for new tests.
- JSDOM provides a browser-like `window` and `document`. If a feature needs additional globals (such as `MutationObserver`), set them up in a dedicated helper before importing the module under test.

## Next Steps

- Break large scripts (e.g., `content.js`, `options.js`) into smaller modules to make them loadable in tests without mocking the entire Twitter UI.
- Add integration-style tests that simulate user workflows (mass follow/like flows) once the underlying logic is modularised.
