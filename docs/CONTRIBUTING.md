# Contributing Guide

Thank you for helping improve Superpowers for Twitter. This document outlines the expectations for contributors and reviewers.

## Development Workflow
1. **Fork & clone** the repository.
2. Create a feature branch: `git switch -c feat/short-description` (use kebab-case or slash-delimited prefixes).
3. Install dependencies with `npm install` (or `npm ci`).
4. Run `npm test` before opening a pull request.
5. Keep changes focused—prefer additive commits (docs, tests, configuration) over bulk refactors.

## Commit Messages
- Use concise, imperative titles (`Add Vitest test harness and initial coverage`).
- Group related changes in a single commit; include extra context in the body when necessary.
- Reference issues using `Fixes #123` / `Refs #123` syntax.

## Pull Requests
Include the following in every PR:
- Summary of the change and rationale.
- Testing evidence (`npm test`, `npm run test:coverage`, manual extension checks).
- Screenshots or screen recordings for UI changes (options page, injected UI).
- Notes on permissions, storage, or API surface changes.

Template checklist (copy into PR description):
- [ ] Ran `npm test`
- [ ] Ran `npm run test:coverage`
- [ ] Updated docs (`README`, `docs/*`) as needed
- [ ] Included screenshots for UI changes
- [ ] Referenced related issues or discussions

## Code Style
- JavaScript: aim for readable ES2015+ with two-space indentation when adding new modules.
- Keep filenames camelCase where existing patterns dictate (`followIntervalMin`).
- Add JSDoc or inline comments only when clarifying complex logic (no redundant commentary).

## Documentation
- Update relevant markdown files when user-facing behaviour changes.
- Architecture decisions should be captured in `docs/ARCHITECTURE.md` or linked ADRs.

## Questions & Support
- Open a GitHub Discussion or issue for design proposals.
- Security concerns? Email the maintainer listed in `docs/SECURITY.md` rather than filing a public issue.
