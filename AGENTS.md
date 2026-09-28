# Agent Office — shared development instructions

Build an interactive office dashboard where AI teammates have visible tasks and an office manager can inspect and review their work.

## Relay: Codex and Claude Code take turns
The two tools build this project in turns; whichever one has usage left works while the other waits for its limit to reset.
- **Start of every session:** read `docs/HANDOFF.md` first. Pick up the "Next up" item unless the user says otherwise.
- **Before you stop** (task done, or usage running low): commit, push your branch, and update `docs/HANDOFF.md` — what you finished, what's half-done, the exact next step, and how to verify. An unpushed change is lost to the other agent.
- Commit small and often so a sudden usage cutoff loses little.

## Current implementation
- **Frontend — `dist/`** (static, no build step). `dist/` is the authored source, not disposable build output.
  - `dist/index.html`: page structure. `dist/style.css`: responsive theme. `dist/app.js`: state and interactions. `dist/navigation.js`: walkable floor + A* routing.
  - Art in use: `dist/office-iso.png` (office map) and `dist/robot-cycle.png` (robot sprites).
  - Activity is still simulated by a timer in `dist/app.js`; wiring it to the server is the next milestone (see `docs/HANDOFF.md`).
- **Backend — `server/`** (Node + TypeScript). Runs the six teammates on real models: Atlas, Nova, Sage on ChatGPT (OpenAI Responses API); Byte, Quill, Orbit on Claude (Anthropic SDK). Ids match the robots in `dist/app.js`.
  - `server/src/office/office.ts`: orchestrator (stages, hand-offs, review/approve/revise, cancel). `server/src/providers/`: Anthropic, OpenAI and mock adapters. `server/src/types.ts`: every event and data shape.
  - Streams changes over server-sent events at `GET /api/events`; full API in `server/README.md`.
  - Providers without an API key run in mock mode. Keys live only in `.env` on the server, never in `dist/`.
- Keep demo labeling honest. Do not imply an agent performed real work when it ran in mock mode.

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
Run `npm run check` (frontend) and, after `npm install`, `npm run check:server` (typecheck + tests; no API keys or paid calls). Serve with `npm run dev` (server + dashboard on http://localhost:8787) or `npm run dev:static` (dashboard only) and verify the affected interactions in a browser.
For task changes, cover available → working → needs review → approved/available; rejection/revision; stopped tasks; and invalid assignments. Keep keyboard, touch and narrow-screen behavior usable.
