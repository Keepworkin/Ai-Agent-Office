# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## Last session

- **Agent:** Claude Code, 2026-09-29
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (PR Keepworkin/Ai-Agent-Office#1). Fast-forwarded to Codex's `codex/live-office-feed` (`9ff866c`), so PR #3's changes are now part of PR #1. The fix commit is on top of that.
- **Done:** fixed the findings from Claude's review of PR #3 (the review is on that PR).
  - **Stop was unclickable while output streamed.** Every token rebuilt the dialog's markup, so a button pressed and released across a rebuild never fired. `detailContent` in `dist/live-office.js` now rebuilds only when something the buttons depend on changes: agent, task, status, connection, or a pending request. Output text and progress update in place (`updateDetailInPlace`).
  - **Full-office re-render on every token.** `delta` events now refresh only the open dialog's output, and all updates are batched to one per animation frame.
  - **Activity panel showed the oldest entries.** Snapshot activity is now reversed to newest first (`dist/live-state.js`).
  - **The dialog jumped to another task** when an agent finished an early stage. `openAgent` now pins the agent's active task.
  - Roles are escaped before they reach `app.js` markup.
  - The transcript builder is now `OfficeLiveState.outputText`. Added 2 tests, for 6 live-state tests in total.
- **Verified:**
  - `npm run check` (6/6 live-state tests, 144 routes) and `npm run check:server` (10/10) pass.
  - Headless Chromium against a mock server, using **real press-hold-release clicks (about 120 ms)**, not instant programmatic clicks:
    - Stop during streaming works in 5 of 5 tries (before the fix: 0 of 5).
    - `render()` runs 3 times per two-stage task (before: 262).
    - The activity panel shows the newest entry first.
    - Output still streams live in the dialog, and the dialog stays on its task.
    - Revise and approve work. No overflow at 390 px, no page errors.
- **Half-done:** nothing.
- **Not verified:** real OpenAI/Anthropic calls (every check used mock providers), touch, and screen readers.
- **Known remaining jank:** 50–120 ms frames when robots change status. That's `OfficeNavigation.route` (item 2), not rendering.

## Next up (in order)

1. **Codex: review Claude's fix commit** on PR #1 (the commit after `9ff866c`). When testing buttons that live inside streaming content, use a real pointer press and release, not instant clicks.
2. **Routing performance** (from Claude's review of #2). `OfficeNavigation.route` takes about 150 ms per call on the main thread. Switch the open list to a binary heap, look up `nearest()` from the grid key instead of a full scan, and cache routes between the fixed waypoints.
3. **Remove the unused images** `dist/office.png`, `dist/walk-cycle.png` and `dist/worker.png` (about 4.5 MB, not referenced anywhere).
4. **Spawn robots at their lounge slot or desk** instead of the door, so name tags don't overlap. Put `department` on each agent literal instead of assigning it by array index.
5. **Workflow picker in the Assign dialog.** Offer single-agent tasks and the server's `workflows`, such as "Head to head" (Claude vs ChatGPT side by side).
6. **Codex & Claude Code desks.** `POST /api/external/report {agentId, kind:"codex"|"claude-code", status, message}` already adds external agents to the server. Give them a spot in a vacant suite on the map, and add a small script plus hook config so each tool reports itself automatically.
7. **Persistence:** save tasks and activity to a JSON file so a server restart doesn't wipe them.

## How to verify

```sh
npm install
npm run check          # dashboard: syntax, assets, 144 navigation routes
npm run check:server   # server: typecheck + tests (fake provider, no API calls)
npm run dev            # http://localhost:8787 — works with no keys (mock mode)
```

Walk through the full cycle in the browser: available → working → needs review → approved, then a revision, a stopped task and an invalid assignment. Check at desktop and phone width.

## Starting prompts

**For Codex / Claude Code, when it's their turn:**
> Read AGENTS.md and docs/HANDOFF.md. Continue with the first unfinished "Next up" item on your own branch (`codex/<topic>` or `claude/<topic>`). Commit small and often. Before you stop, push and update docs/HANDOFF.md.

**To have one review the other's work:**
> Read AGENTS.md. Review [PR URL] at [commit SHA] against docs/HANDOFF.md's acceptance notes. Report findings with file/line, severity and repro. Don't change code.
