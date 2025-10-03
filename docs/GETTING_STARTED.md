# Getting Started

This guide walks through installing dependencies, running the extension in a browser, and confirming everything works on macOS, Linux, or Windows.

## 1. Prerequisites
- **Node.js**: version 18 LTS or newer (bundled npm ≥ 9).
- **Git**: to clone the repository. On Windows you can use Git Bash, Command Prompt, or PowerShell.
- **Chrome or Chromium**: any channel that supports Manifest V3 (Chrome 115+, Edge 115+, Brave, etc.).

## 2. Clone the Repository
```bash
git clone https://github.com/osbornesec/xflow.git
cd xflow
```

## 3. Install Dependencies
Use npm to install dev dependencies required for the Vitest harness.
```bash
npm install
```
> Tip: Use `npm ci` instead when running in CI or when you need reproducible installs.

## 4. Run the Test Suite
```bash
npm test
```
- Runs Vitest in the default jsdom environment.
- Provides fast feedback that the repo is healthy before loading it into a browser.

Optional coverage report:
```bash
npm run test:coverage
```
- Produces a text summary and HTML report under `coverage/`.

## 5. Load the Extension Locally
1. Open `chrome://extensions` (or `edge://extensions` for Edge).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Choose the cloned `xflow` directory (the folder containing `manifest.json`).
5. Verify that "XFlow" appears in the extension list.

## 6. Open the Options Page
- From the extension card, click **Details → Extension options** or visit `chrome-extension://<extension-id>/options.html`.
- Configure autopilot actions and limits. Values persist via `chrome.storage.sync` with local fallbacks.

## 7. Start Experimenting on X (Twitter)
- Navigate to `https://x.com/`.
- Ensure the content script is active by checking DevTools → Console for `XFlow` log entries.
- Autopilot controls appear in the UI once configured.

## 8. Cleaning Up
- Disable or remove the unpacked extension when you finish testing to avoid accidental bulk actions on personal accounts.
- Delete the `coverage/` folder if you no longer need reports (it's excluded via `.gitignore`).

## Need Help?
- Read `docs/ARCHITECTURE.md` to understand script flow.
- Consult `docs/TESTING.md` for advanced testing scenarios and DOM stubs.
- Open an issue in GitHub with browser version, reproduction steps, and console output.
