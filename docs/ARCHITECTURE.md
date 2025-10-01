# Architecture Overview

Superpowers for Twitter is a Manifest V3 browser extension that orchestrates automation flows across three primary surfaces: the background/page context, the injected content script, and the options UI.

## High-Level Components

| Component | File(s) | Responsibility |
|-----------|---------|----------------|
| Manifest | `manifest.json` | Declares MV3 metadata, matches X (`https://x.com/*`), exposes `app.js` as a web-accessible resource, and registers the options page. |
| Background/Page Helper | `app.js` | Wraps `XMLHttpRequest` methods to capture request metadata and posts telemetry to the page context. Loaded via `<script>` injection from the content script. |
| Content Script | `content.js`, `content.css` | Injected at `document_end`; manages autopilot execution, timeline parsing, randomised delays, and in-product promotions. |
| Options UI | `options.html`, `options.js`, `options.css`, `images/*.svg` | Provides configuration controls for autopilot actions with live storage syncing and status messaging. |
| Tests | `tests/*.test.js`, `vitest.config.js`, `vitest.setup.js` | Unit tests covering XHR instrumentation and helper utilities using Vitest + jsdom. |

## Execution Flow
1. **Extension load**: Chrome reads `manifest.json`, enabling the options page and injecting `content.js` on matching X pages.
2. **Content script bootstrap**:
   - Appends DOM containers for ads/status bars.
   - Injects `app.js` into the page to instrument network calls.
   - Initializes autopilot state from `sessionStorage`/`chrome.storage.sync`.
3. **User configuration**:
   - Options page writes to `chrome.storage.sync` (with local fallback). Icon animations (`spinner.svg`, `check.svg`) provide status feedback.
   - Autopilot actions (follow/unfollow/like/retweet) are stored as ordered tasks with limits and idle timers.
   - Feature unlock happens locally; the UI surfaces a read-only status field for backward compatibility.
4. **Automation loop**:
   - Helpers such as `formatDuration` and `parseTimelineTweets` calculate throttle windows and collect timeline entries.
   - Focus management (`D`, `C` helpers) iterates over DOM nodes, performing actions with randomised pauses to mimic human behaviour.
   - `app.js` telemetry broadcasts XHR payloads, enabling monitoring or downstream analytics.
5. **Persistence & recovery**:
   - Action types persist in `sessionStorage` (`SuperpowersForTwitterSuspendedAutopilotActionTypes`) to resume after reloads.
   - No remote activation checks are performed; configuration lives entirely in extension storage.

## Data Storage Responsibilities
- `sessionStorage`: Tracks suspended autopilot actions and temporary state.
- `chrome.storage.sync`: Primary storage for options and autopilot queues.
- `chrome.storage.local`: Fallback when sync quota is exceeded or offline.

## Extending the Architecture
- **New actions**: Add schema to `options.js`, extend autopilot handlers in `content.js`, and ensure telemetry instrumentation captures new endpoints.
- **Modularity**: Future refactors should break large IIFEs into modules to improve testability (update `vitest.config.js` include paths accordingly).
- **Cross-browser**: Firefox support would involve replacing `chrome.*` calls with `browser.*` or a shim.

Refer to `docs/TESTING.md` for guidelines on validating new automation flows and `docs/SECURITY.md` for permission rationale.
