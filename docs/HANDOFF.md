# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## Codex routing review — 2026-09-29

Reviewed `d4c4767a7bb45d7c02261f323ddb3d037a86332e` on PR #1; no blocking findings. Review posted on the PR. No application code changed.

Independent checks: all 144 routes passed clearance in 100 ms; six live-state tests and ten server tests passed, as did syntax/assets and server typecheck. Seeded comparison against the parent: no differences for 20,000 walkable points or 1,000 clear segments; 40 random routes retained reachability/endpoints and clear segments. Mutating returned routes did not corrupt cached routes. Browser demo and mock live office both showed continued movement; working demo robots reached their desks. No live-page runtime errors observed.

Limits: did not independently reproduce the 20-second long-task benchmark or prove identical waypoint sequences for every route. Real providers, touch and screen readers remain unverified.

Review record branch: `codex/review-routing`. Next unfinished implementation item: remove the unused images (item 3). PR #1 remains the user's merge decision.

## Last session

- **Agent:** Claude Code, 2026-09-29
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (PR Keepworkin/Ai-Agent-Office#1). Fast-forwarded to Codex's `codex/review-routing` (`070d935`, Codex's review of the routing commit `d4c4767`: no blocking findings).
- **Done:**
  - **Item 3, unused images** (`e3cd2da`): removed `dist/office.png`, `dist/walk-cycle.png` and `dist/worker.png` (4.4 MB). `scripts/check-assets.mjs` now also follows `url(...)` in stylesheets and **fails on any file in `dist/` that nothing references**. Verified by copying `worker.png` back in: the check fails.
  - **Item 4, spawn overlap and roster** (the commit after `e3cd2da`), in `dist/app.js`:
    - Robots start at `restingSpot(a)`: their desk when working, their lounge slot otherwise. Before, they all started at the door.
    - Lounge slots fan out wider (±5% horizontally, the outer two 1.5% further back); all six spots are on walkable floor.
    - `department` and the final demo states are written on each roster entry; the patching by array index is gone.
- **Verified:** `npm run check` (all 8 `dist/` files used, 144 routes in about 0.3 s, 6 live-state tests) and `npm run check:server` (10/10). In headless Chromium, overlapping name-tag pairs at page load went from 6 to **0**, in both the static demo and live mode. Departments are unchanged (atlas, nova and sage are ChatGPT; byte, quill and orbit are Claude), and there are no page errors.
- **Noticed, not fixed:** in live mode the page first draws the demo roster, then the server snapshot arrives about 100 ms later and the robots walk to their real spots. This behavior predates these changes. Hiding the scene until the first snapshot (or a short timeout) would avoid it.
- **Half-done:** nothing.

## Next up (in order)

1. **Codex: review Claude's commits `e3cd2da` and the one after it** on PR #1 (removed images, asset guard, spawn positions, roster). Check the map at load in both `npm run dev` and `npm run dev:static`.
2. ~~Routing performance~~: done (`d4c4767`, reviewed by Codex).
3. ~~Remove the unused images~~: done (`e3cd2da`).
4. ~~Spawn at desk or lounge; departments on the roster~~: done (see Last session).
5. **Workflow picker in the Assign dialog.** Offer single-agent tasks and the server's `workflows`, such as "Head to head" (Claude vs ChatGPT side by side).
6. **Codex & Claude Code desks.** `POST /api/external/report {agentId, kind:"codex"|"claude-code", status, message}` already adds external agents to the server. Give them a spot in a vacant suite on the map, and add a small script plus hook config so each tool reports itself automatically.
7. **Persistence:** save tasks and activity to a JSON file so a server restart doesn't wipe them.

## How to verify

```sh
npm install
npm run check          # dashboard: syntax, assets, 144 navigation routes (+ time budget), live-state tests
npm run check:server   # server: typecheck + tests (fake provider, no API calls)
npm run dev            # http://localhost:8787 — works with no keys (mock mode)
```

Walk through the full cycle in the browser: available → working → needs review → approved, then a revision, a stopped task and an invalid assignment. Check at desktop and phone width.

## Starting prompts

**For Codex / Claude Code, when it's their turn:**
> Read AGENTS.md and docs/HANDOFF.md. Continue with the first unfinished "Next up" item on your own branch (`codex/<topic>` or `claude/<topic>`). Commit small and often. Before you stop, push and update docs/HANDOFF.md.

**To have one review the other's work:**
> Read AGENTS.md. Review [PR URL] at [commit SHA] against docs/HANDOFF.md's acceptance notes. Report findings with file/line, severity and repro. Don't change code.
