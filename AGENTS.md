# Agent Office — shared development instructions

Build an interactive office dashboard where AI teammates have visible tasks and an office manager can inspect and review their work.

## Current implementation
- Dependency-free static site. `dist/` is the authored source, not disposable build output.
- `dist/index.html`: page structure. `dist/style.css`: responsive theme. `dist/app.js`: demo state and interactions. `dist/office.png`: generated office illustration.
- All tasks are simulated, held in memory, and reset on reload. No real agent integrations or credentials exist.
- Keep demo labeling honest. Do not imply an agent performed real work when it did not.

## Working agreement for Codex and Claude Code
- Read this file and README.md before editing.
- Use separate branches/checkouts for simultaneous work. Branch naming: `codex/<topic>` or `claude/<topic>`.
- One agent implements a given change; the other reviews the exact commit and diff. Do not edit the same working tree concurrently.
- Keep changes focused. Preserve other people's uncommitted work.
- Implementer records behavior changes, checks and limitations in the pull request template.
- Reviewer independently reproduces the main flow and reports findings with file/line, impact and reproduction. Do not claim review by the other agent unless it actually happened.
- Address findings before handing the change back to the user for merging. No automatic merges or paid AI CI calls.
- Never commit API keys, tokens, local .env files, or private task data.

## Validation
Run `npm run check`. Serve with `npm run dev` and verify the affected interactions in a browser.
For task changes, cover available → working → needs review → approved/available; rejection/revision; stopped tasks; and invalid assignments. Keep keyboard, touch and narrow-screen behavior usable.
