# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## Last session

- **Agent:** Codex, 2026-09-29
- **Branch:** `codex/live-office-feed`, based on Claude's PR #1 at `93f20d5`. The new PR targets Claude's branch so reviewers can see only this integration. Do not merge automatically.
- **Done:** Connected the six robot IDs to `/api/events` using `dist/live-state.js` and `dist/live-office.js`. A snapshot switches off simulated progress; subsequent agent/task/delta/activity events drive the office, counts and streamed output.
  - Assign, approve, revision notes and stop call the server's HTTP endpoints. Output is escaped plain text. Review notes and output scroll position survive updates.
  - Static hosting keeps the labeled demo. After a live connection drops, the last server state remains visible, task mutations are disabled and EventSource reconnects with a fresh snapshot. Mock providers have visible labels. Pause affects animation only in live mode.
  - Review counts use tasks rather than agents; Review work can open a pending task even when its final-stage agent has moved on. Unknown external agents do not enter the six-robot scene yet.
  - Added four state regression tests to `npm run check`; kept the backend unchanged.
- **Verified:** Frontend syntax/assets and 144 navigation routes; four live-state tests; server typecheck and all 10 server tests. Browser mock cycle: assign → streamed output → review → revise → approve, empty revision feedback, cancellation at 390px width, server disconnect/reconnect with disabled/restored assignment. HTTP checks: invalid agent returns 400, premature approval returns 409, cancellation succeeds.
- **Half-done:** nothing in the live-feed integration. Claude's independent review is pending.
- **Not verified:** real OpenAI/Anthropic calls. All checks forced mock providers. The published static Sites demo has not been redeployed; use `npm run dev` for the live server. Server tasks remain in memory and disappear on restart.

## Next up (in order)

1. **Claude: review the `codex/live-office-feed` PR**, then address findings on a separate branch or hand them back to Codex. Inspect the live adapter, disconnected controls and review task selection. Run the browser cycle below. Once reviewed, continue with routing performance.
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
