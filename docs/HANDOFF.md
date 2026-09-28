# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## Last session

- **Agent:** Claude Code
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (PR Keepworkin/Ai-Agent-Office#1). It already contains Codex's `codex/office-dashboard-backup` (PR #2) merged in, so it can be merged after #2 or instead of it.
- **Done:**
  - `server/`: live orchestrator for the six robots. Atlas, Nova and Sage run on ChatGPT; Byte, Quill and Orbit run on Claude.
    - Staged workflows with hand-offs, parallel stages and cancel.
    - Review flow: finished tasks wait in `review` until someone calls `POST /api/tasks/:id/approve`, or `POST /api/tasks/:id/revise` with `{ feedback }`, which re-runs the final stage with the previous draft and the feedback.
    - Each task carries `progress` (0-100). The server streams SSE at `/api/events` and serves `dist/` on the same port.
    - 10 tests, all passing.
  - Root scripts: `npm run dev` (server + dashboard on :8787), `npm run dev:static`, `npm run check`, `npm run check:server`. CI runs both checks.
  - Removed Claude's separate React UI. `dist/` is the one front end.
- **Half-done:** nothing.
- **Not verified:** calls to the real Anthropic and OpenAI APIs. Every check so far ran in mock mode, with no keys set.

## Next up (in order)

1. **Wire `dist/app.js` to the live server.** Suggested owner: Codex, since it wrote the dashboard. Claude reviews.
   - On load, try `new EventSource('/api/events')`. If it connects, switch to **live mode**: stop the demo timer (`setInterval` at the bottom of `app.js`) and take state from events. If it doesn't, keep today's demo, and keep the "DEMO MODE" label honest.
   - The first event is `{type:"snapshot", snapshot:{agents,tasks,workflows,activity}}`, followed by `agent`, `task`, `delta` and `activity` events. The shapes are in `server/src/types.ts`.
   - Map each server agent to its robot by `id` (`atlas`, `nova`, `sage`, `byte`, `quill`, `orbit`). Agent `status` maps directly: `working` → working, `review` → review, `idle` → idle. `activity` is the current task title. Find the agent's task with `currentTaskId`, or with the latest task in `review` whose last stage includes the agent.
   - Progress: `task.progress`.
   - Buttons:
     - Assign: `POST /api/tasks {prompt, stages:[[agentId]]}`, or a workflow `{prompt, workflowId}`.
     - Approve: `POST /api/tasks/:id/approve`.
     - Request revision: `POST /api/tasks/:id/revise {feedback}`.
     - Stop: `POST /api/tasks/:id/cancel`.
   - Show the real output: in the agent dialog, render `step.output` for the agent's step. It streams in live through `delta` events.
   - `agent.mock === true` means that agent has no API key. Show a small "mock" tag so the demo labeling stays honest.
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
