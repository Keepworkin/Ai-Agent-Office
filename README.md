# Agent Office

An animated isometric office dashboard for a demo AI team. Inspect agent characters, assign simulated tasks, review finished work, and switch to a manager workload view.

## Run locally

Requires Node.js and Python 3. No package installation is needed.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` for JavaScript syntax and local asset checks.

## Project layout

- `dist/` — authored HTML, CSS, JavaScript and office artwork; keep it tracked.
- `dist/navigation.js` — walkable floor polygons, furniture footprints and obstacle-aware A* routing. Coordinates are normalized to the office artwork.
- `scripts/check-navigation.cjs` — desk/lounge/hallway reachability and segment-clearance checks.
- `AGENTS.md` — shared instructions for coding agents.
- `CLAUDE.md` — Claude Code entry point.
- `docs/COLLABORATION.md` — implementation and independent review workflow.
- `.github/` — automatic checks and a pull request handoff template.
- `.openai/hosting.json` — Sites identity and static publishing configuration; no secrets.

## Demo boundaries

Six fictional specialists, simulated progress, and illustrative completion counts. Tasks are in browser memory and reset on refresh. No Codex or Claude sessions are launched or tracked. The shared repository supports development collaboration; it does not automatically orchestrate the two agents.

## Next integration milestone

Agree on the agent runner and authentication before adding live activity. Put provider calls behind a server; normalize agent/task events; replace the demo timer; retain explicit connection and error states. Never put provider secrets into browser JavaScript.

Office art was generated for this project. The map and robot sprite sheet were generated for this project; roster icons use platform emoji. Friendly robot teammates use directional walking frames with their shoes anchored to the floor. Routes avoid mapped furniture and walls. Working agents walk to desks; idle and review-state agents lounge and wander. Two vacant suites are reserved for future platforms. Department labels do not imply live provider connections. Google Fonts are optional external font requests with local fallbacks.
