# Security Notes

This project automates account actions on X (Twitter). Please handle credentials and automation carefully.

## Reporting Vulnerabilities
- Email **security@osbornesec.dev** with details. Include reproduction steps, browser version, and whether the issue affects stored data, API usage, or automation behaviour.
- Do not open public issues for sensitive findings. You will receive acknowledgement within five business days.

## Data & Permissions
- The extension requests `storage` and `unlimitedStorage` to persist autopilot queues and execution counters.
- No external host permissions are declared; automation operates solely on `https://x.com/*` and does not perform remote license checks.
- Telemetry posted via `window.postMessage` stays within the page context; no remote logging is performed by default.

## Threat Model Highlights
- **Account safety**: Bulk actions risk triggering platform anti-spam controls. Respect idle timers and limits configured in the options page.
- **Local storage**: Configuration is stored in Chrome sync; compromise of the host machine can expose automation settings.
- **Script injection**: The content script injects `app.js` as a web-accessible resource. Keep this file free from third-party dependencies and review changes carefully.

## Hardening Recommendations
- Enable Chrome's Site Isolation features when testing automation to limit cross-origin leakage.
- Use disposable or test accounts when trialling bulk operations.
- Review changelog entries for breaking changes before updating the extension.

For broader guidance on contribution practices, see [`docs/CONTRIBUTING.md`](./CONTRIBUTING.md).
