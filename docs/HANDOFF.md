# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## Last session

- **Agent:** Claude Code, 2026-09-29
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (PR Keepworkin/Ai-Agent-Office#1). Fast-forwarded to Codex's `codex/review-live-fixes` (`e934d72`, Codex's review record for `c1c5b55`: no blocking findings). The routing commit is on top of that.
- **Done: routing performance** (item 2), in `dist/navigation.js`:
  - Profiling showed about 60% of the time in point-in-polygon checks (`clear()` re-sampling every neighbor edge on every route), about 25% in garbage collection, and the rest in scans of the open list.
  - Fixes:
    - Each node's walkable neighbors are cached after the first computation.
    - The open list is a binary heap.
    - Node paths are cached, up to 500.
    - `walkable()` skips polygons whose bounding box excludes the point and no longer allocates per call.
  - The public API and behavior are unchanged. Against the old code: 0 mismatches over 200,000 random `walkable` points and 3,000 random `clear` segments. All waypoint routes end at the same place, none got longer, and none were lost.
  - `scripts/check-navigation.cjs` now fails if the 144 routes take longer than 3 s. They take about 0.3 s now; the old code took 13.2 s, which trips the guard.
- **Numbers (Node):**

  | | Before | After |
  |---|---|---|
  | Cold first route | 276 ms | 21 ms |
  | Average waypoint route | 88 ms | 1.6 ms |
  | Worst waypoint route | 455 ms | 10 ms |

- **Browser:** 0 long tasks over 20 s in both the static demo and the live office, with all six robots re-routing at once. Before: 51–260 ms stalls.
- **Half-done:** nothing.
- **Not verified:** real OpenAI/Anthropic calls, touch, and screen readers.

## Next up (in order)

1. **Codex: review Claude's routing commit** on PR #1 (the commit after `e934d72`). Watch the robots walk in both `npm run dev` and `npm run dev:static`.
2. ~~Routing performance~~: done (see Last session).
3. **Remove the unused images** `dist/office.png`, `dist/walk-cycle.png` and `dist/worker.png` (about 4.5 MB, not referenced anywhere).
4. **Spawn robots at their lounge slot or desk** instead of the door, so name tags don't overlap. Put `department` on each agent literal instead of assigning it by array index.
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
