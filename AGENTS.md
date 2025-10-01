# Repository Guidelines

## Project Structure & Module Organization
- Browser extension entrypoints live at the root: `app.js` (network instrumentation), `content.js` (timeline automation), and `options.js` (settings UI). Styles (`*.css`), HTML (`options.html`), and SVG assets sit alongside them.
- Shared static assets reside in `images/`, while developer documentation stays in `TESTING.md` and this guide. Tests are collected in `tests/` and use flat `*.test.js` filenames.

## Build, Test, and Development Commands
- `npm install` – install project dependencies (Vitest, Testing Library, jsdom stubs).
- `npm test` – run the Vitest suite in watch-friendly mode.
- `npm run test:coverage` – execute tests once and emit coverage reports to `coverage/` (text + HTML).

## Coding Style & Naming Conventions
- JavaScript files are currently minified; when adding new modules prefer readable ES modules, two-space indentation, and descriptive function names (e.g., `formatDuration`).
- Keep filenames kebab- or snake-free; stick with camelCase where consistent (`followIntervalMin`). Avoid introducing new bundlers unless necessary.
- If you add formatting tools, wire them into `npm run lint` and document usage in `TESTING.md`.

## Testing Guidelines
- Vitest with a JSDOM environment is configured in `vitest.config.js`; global stubs for `chrome` and `crypto` live in `vitest.setup.js`.
- Place new tests under `tests/` and suffix files with `.test.js`. Use Testing Library helpers for DOM workflows; extract helpers from minified bundles before testing.
- Maintain or raise current coverage thresholds (80% statements/lines/functions, 70% branches after excluding legacy bundles).

## Commit & Pull Request Guidelines
- Follow the existing conventional tone: short imperative commits (e.g., "Add Vitest test harness and initial coverage").
- Pull requests should describe intent, list manual/automated verification (`npm test`, `npm run test:coverage`), and include before/after screenshots for UI changes.
- Reference related issues using `Fixes #ID` or `Refs #ID` where applicable and call out any configuration or permission changes.
