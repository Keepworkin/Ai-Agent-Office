# Agent Office

An animated isometric office dashboard for a demo AI team. Inspect agent characters, assign simulated tasks, review finished work, and switch to a manager workload view.

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
- `dist/navigation.js` — walkable floor polygons, furniture footprints and obstacle-aware A* routing. Coordinates are normalized to the office artwork.
- `scripts/check-navigation.cjs` — desk/lounge/hallway reachability and segment-clearance checks.
- `AGENTS.md` — shared instructions for coding agents.
- `CLAUDE.md` — Claude Code entry point.
- `docs/COLLABORATION.md` — implementation and independent review workflow.
- `.github/` — automatic checks and a pull request handoff template.
- `.openai/hosting.json` — Sites identity and static publishing configuration; no secrets.

## Demo boundaries

The dashboard in `dist/` still runs its simulated demo: six specialists, simulated progress and illustrative completion counts, held in browser memory. The server in `server/` runs the same six teammates on real models. Connecting the two is the next milestone (see `docs/HANDOFF.md`). The shared repository supports development collaboration; it does not automatically orchestrate Codex and Claude Code.

## Next integration milestone

Agree on the agent runner and authentication before adding live activity. Put provider calls behind a server; normalize agent/task events; replace the demo timer; retain explicit connection and error states. Never put provider secrets into browser JavaScript.

Office art was generated for this project. The map and robot sprite sheet were generated for this project; roster icons use platform emoji. Friendly robot teammates use directional walking frames with their shoes anchored to the floor. Routes avoid mapped furniture and walls. Working agents walk to desks; idle and review-state agents lounge and wander. Two vacant suites are reserved for future platforms. Department labels do not imply live provider connections. Google Fonts are optional external font requests with local fallbacks.
