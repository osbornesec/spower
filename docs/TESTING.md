# Testing Guide

Vitest powers the automated checks for this extension. Tests run in a jsdom environment with custom stubs for Chrome APIs, letting you exercise automation logic without launching a browser.

> Quick links: high-level workflow in [README.md](../README.md), contributor tips in [docs/CONTRIBUTING.md](./CONTRIBUTING.md).

## Tooling
- **Test runner**: [Vitest](https://vitest.dev/)
- **Assertion helpers**: `@testing-library/dom`, `@testing-library/jest-dom`
- **Environment**: jsdom (configured in `vitest.config.js`)
- **Setup**: `vitest.setup.js` bootstraps `chrome.storage`/`chrome.runtime` stubs and a minimal `crypto.getRandomValues`

## Commands
```bash
npm test            # Run tests in watch-aware mode (Vitest CLI default)
npm run test:watch  # Alias of npm test for explicitness
npm run test:coverage  # One-shot run with V8 coverage; reports to coverage/
```

Use `npm ci` in CI for reproducible installs. HTML coverage reports land in `coverage/index.html` (excluded from Git).

## Test Organisation
- Place new suites under `tests/` with the suffix `*.test.js`.
- Group related behaviour with `describe()` blocks; use `vi.useFakeTimers()` when exercising timer-heavy flows.
- Prefer testing pure helpers (e.g., duration formatting, timeline parsing) by extracting functions or safely evaluating existing ones, as demonstrated in `tests/content.utils.test.js`.

## Writing New Tests
1. Add or extend helper modules rather than reaching into minified blobs when possible.
2. Stub additional Chrome APIs inside `vitest.setup.js` to keep suites self-contained.
3. Reset mocks (`vi.restoreAllMocks()`) and timers in `afterEach` to avoid cross-test pollution.
4. Validate DOM changes via Testing Library queries (`screen.getByText`, `within(...)`).

## Coverage Expectations
- Global thresholds target 80% statements/lines/functions and 70% branches after excluding legacy bundles.
- Raise thresholds or remove exclusions once `content.js`/`options.js` are modularised.

## Continuous Integration
- For GitHub Actions or other CI systems, use:
  ```bash
  npm ci
  npm run test:coverage -- --run
  ```
- Publish the `coverage/coverage-final.json` artifact if deeper analytics are required.

## Troubleshooting
- **Missing Chrome APIs**: Extend the stub in `vitest.setup.js`.
- **Network fetch calls**: Mock with `vi.spyOn(global, 'fetch')` and provide JSON fixtures.
- **Unhandled timers**: Check for recursive `setTimeout` loops; use `vi.runOnlyPendingTimers()` to flush.

Legacy documentation kept in [`TESTING.md`](../TESTING.md) mirrors these instructions for compatibility with existing references.
