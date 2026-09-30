# Agent Office

An animated isometric office dashboard for an AI team. Inspect robot teammates, assign server tasks, review streamed output, and switch to a manager workload view.

## Run locally

Requires Node.js 20+.

```sh
npm install
cp .env.example .env   # optional: add ANTHROPIC_API_KEY / OPENAI_API_KEY
npm run dev
```

Open http://localhost:8787. With no keys, the teammates run in mock mode. The dashboard alone, with no server, still runs via `npm run dev:static` (Python 3, http://127.0.0.1:4173).

Run `npm run check` for the dashboard's syntax, asset and navigation checks, and `npm run check:server` for server typecheck + tests.

**Codex and Claude Code take turns building this project. Start with `docs/HANDOFF.md`.**

## Project layout

- `dist/` — authored HTML, CSS, JavaScript and office artwork; keep it tracked.
- `server/` — Node/TypeScript server that runs the teammates on Claude and ChatGPT and streams live events; see `server/README.md`.
- `docs/HANDOFF.md` — relay baton between Codex and Claude Code: last session, next steps, how to verify.
- `docs/RELAY.md` — how Codex and Claude Code hand work to each other without the owner relaying messages. Live claims and handoffs are on the relay board, issue #6.
- `docs/PROGRESS.md` — what's done, in progress and remaining, plus a log of every pull request and its UI changes.
- `dist/navigation.js` — walkable floor polygons, furniture footprints and obstacle-aware A* routing. Coordinates are normalized to the office artwork.
- `scripts/check-navigation.cjs` — desk/lounge/hallway reachability and segment-clearance checks.
- `AGENTS.md` — shared instructions for coding agents.
- `CLAUDE.md` — Claude Code entry point.
- `docs/COLLABORATION.md` — implementation and independent review workflow.
- `.github/` — automatic checks and a pull request handoff template.
- `.openai/hosting.json` — Sites identity and static publishing configuration; no secrets.

## Live feed and static demo

With `npm run dev`, the dashboard receives server-sent events and sends task assignments, approvals, revision notes and cancellations to the server. Robots use server status and task progress. Output streams into the task dialog. Providers without keys are tagged **MOCK**; configured providers can make real, billable API calls. Provider secrets never enter browser JavaScript.

With `npm run dev:static`, the dashboard stays in **DEMO MODE** with simulated tasks. Once connected to a live server, a dropped connection retains the last known state and disables task changes until a fresh snapshot arrives. Pause controls only animation in live mode. Tasks are currently held in server memory and disappear on restart.

The shared repository supports relay development; it does not automatically orchestrate Codex and Claude Code. See `docs/HANDOFF.md` for the next step and review instructions.

Office art was generated for this project. The map and robot sprite sheet were generated for this project; roster icons use platform emoji. Friendly robot teammates use directional walking frames with their shoes anchored to the floor. Routes avoid mapped furniture and walls. Working agents walk to desks; idle and review-state agents lounge and wander. Two vacant suites are reserved for future platforms. Department labels do not imply live provider connections. Google Fonts are optional external font requests with local fallbacks.
