# XFlow

![License](https://img.shields.io/badge/license-ISC-brightgreen)
![Node](https://img.shields.io/badge/node-%E2%89%A518.x-blue)
![Tests](https://img.shields.io/badge/tests-vitest-purple)

Browser extension that automates high-volume actions on X (formerly Twitter): mass follow/unfollow,
like/unlike, retweet/unretweet, and configurable autopilot routines.
This repository hosts the unpacked extension source and a Vitest-powered test harness for
development and maintenance.

## Features
- **Autopilot actions**: Queue follow, unfollow, like, and retweet jobs with per-action limits.
  Idle delays and repeat intervals prevent rate-limit spikes.
- **Runtime telemetry**: Background `XMLHttpRequest` wrapper (`app.js`) emits request metadata to the
  page for debugging and throttling safeguards.
- **Configurable UI**: Options page (`options.html`, `options.js`, `options.css`) persists settings via
  Chrome storage (`chrome.storage.sync` with `chrome.storage.local` fallback) and provides live
  validation.
- **In-app promotions**: Content bundle (`dist/content.js`) renders contextual ads for related
  extensions and handles timeline parsing.
- **Unlocked feature set**: All automation capabilities are available without activation keys or
  remote license checks.

## Project Layout
```text
app.js               # Background/page-level instrumentation shared via web-accessible resource
dist/content.js      # Bundled content script injected on https://x.com/*
src/content/index.js # Content entrypoint orchestrating modular helpers
src/shared/          # Shared helpers consumed by the content script and tests
options.html         # Extension options UI markup
options.js           # Options page behaviour + storage wiring
options.css          # Options page styles
images/              # Icons & UI affordances (spinner/check)
AGENTS.md            # Contributor quick reference
docs/ARCHITECTURE.md # Architecture decisions and data flow diagrams
docs/TESTING.md      # Testing patterns and watch mode tips
docs/CONTRIBUTING.md # Contribution guidelines
docs/SECURITY.md     # Security reporting process
manifest.json        # MV3 manifest (permissions, scripts, resources)
package.json         # npm scripts and devDependencies
tests/               # Vitest suites covering xhr hooks and utility helpers
vitest.config.js     # Vitest configuration w/ jsdom environment & coverage settings
```

## Get Started Quickly
1. **Clone & install** (macOS/Linux/Windows via Git Bash or WSL):
   ```bash
   git clone https://github.com/osbornesec/xflow.git
   cd xflow
   npm install
   ```
2. **Run tests** (ensures setup works):
   ```bash
   npm test
   ```
3. **Bundle the content script**:
   ```bash
   npm run build
   ```
   _Tip_: run `npm run build:content:watch` during active development to rebuild on save.
4. **Load in Chrome/Chromium**:
   - Open `chrome://extensions`.
   - Toggle **Developer mode** (top-right).
   - Click **Load unpacked** and select the repo root (`xflow`).
   - Confirm "XFlow" appears with options page available.
5. **Optional – Coverage report**:
   ```bash
   npm run test:coverage
   ```

## Permissions & Runtime Behavior

| Permission | Why it is needed |
|------------|------------------|
| `storage`, `unlimitedStorage` | Persist autopilot state via Chrome storage with local fallback. |

Additional resources:
- Content script targets `https://x.com/*` and runs at `document_end` to access dynamic timelines safely.
- `app.js` is exposed as a web-accessible resource for injected telemetry helpers.

## Testing & Tooling
- Framework: [Vitest](https://vitest.dev/) + jsdom (`npm test`).
- Coverage: `npm run test:coverage` (V8 provider).
  Coverage currently excludes legacy minified bundles; raise thresholds as modules are refactored.
- Support libraries: `@testing-library/dom` & `@testing-library/jest-dom` for DOM assertions.
- See `docs/TESTING.md` for advanced patterns (watch mode, DOM stubs).

## Development Workflow
- Use Node.js 18 LTS or newer (tested with npm 9+).
- Use `npm run build:content:watch` when iterating on the content script to rebuild automatically.
- Modify options UX via `options.*` and keep icons in `images/`.
- Document architecture or feature decisions in `docs/ARCHITECTURE.md`.
- Follow commit/PR guidelines in `docs/CONTRIBUTING.md`.

## Troubleshooting
- **Extension fails to load**: verify `manifest.json` version is MV3 and the directory contains `manifest.json` at root.
- **Tests hang**: ensure no stray real timers; Vitest suite uses fake timers—reset stubbed globals in new tests.
- **Settings not persisting**: sync quota exceeded.
  Check console for `chrome.runtime.lastError`; storage falls back to `chrome.storage.local`.

## Contributing & Support
- Read `AGENTS.md` for quick contributor onboarding.
- File issues or feature requests via the GitHub issue tracker.
  Include browser version, reproduction steps, and whether autopilot or single-action mode was used.
- Security reporting guidance lives in `docs/SECURITY.md`.

## License
Released under the [ISC License](LICENSE); include this file in any redistributed packages.

## Assumptions & Future Work
- Assumes Chrome/Chromium distribution; Firefox compatibility is not validated.
- Testing documentation presumes npm (`npm install`); if your environment requires `npm ci`, adjust accordingly.
- Future work: factor `content.js` into modules for richer test coverage and publish release packaging steps.
