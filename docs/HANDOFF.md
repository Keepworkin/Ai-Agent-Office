# Handoff — read this first

Codex and Claude Code build this project in turns. Whoever has usage left picks up the **Next up** item, works on their own branch, and before stopping updates this file: what they finished, what's half-done, and the exact next step. Commit and push before you stop; unpushed work is invisible to the other agent.

## State of `main`

- **`main` = `9329c5f`**, merged 2026-09-29 from PR Keepworkin/Ai-Agent-Office#1 with a merge commit, following "Merging to `main`" in `AGENTS.md`.
  - Every commit was cross-agent reviewed through head `057d0fa`.
  - CI (`check`, `server`) was green, and the owner approved the merge.
  - PR #2 and PR #3 are included; GitHub marks both as merged.
- What's on `main`:
  - The live Claude + ChatGPT server (`server/`).
  - The isometric robot office wired to it (`dist/`), with review, revise and stop.
  - Fast routing, the asset guard, relay rules and merge rules.
  - The per-session logs and review records that used to be in this file are now on PR #1 and in git history.
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), touch devices and screen readers.

## Last session

- **Agent:** Claude Code, 2026-09-29. Branch `claude/ai-agent-office-repo-9nv3o7`, PR Keepworkin/Ai-Agent-Office#4. The PR holds the reviewed handoff commit `7fcbc59` plus the workflow picker on top, because this session can only push to its own branch.
- **Done: workflow picker** (Next up item 1).
  - **Assign dialog** (live mode only): new "How should the team work?" menu with "One teammate" or any of the server's workflows (`officeStore.workflows`).
    - Choosing a workflow hides the teammate menu and shows the description plus who works in each stage, e.g. "Stage 1: Quill (Claude) + Atlas (ChatGPT) → Stage 2: Orbit (Claude)".
    - Workflows stay available when every desk is busy, since the server queues them; "One teammate (all busy)" is then disabled.
    - Live prompts may be up to 2000 characters.
  - **Task dialog:** output is grouped by stage, and agents in the same stage sit **side by side** in a wider (900 px) dialog, stacking under 700 px. Headers show agent · Claude/ChatGPT · MOCK · status. Text still updates in place per step (`data-step` / `data-step-head`), so buttons are never rebuilt mid-stream.
  - Pure helpers in `dist/live-state.js`: `stagesOf`, `describeStages`, `providerName`, all tested. The unused `outputText` was removed.
  - The static demo is unchanged; the picker is hidden there.
- **Verified:**
  - `npm run check` (7 live-state tests, 144 routes, assets) and `npm run check:server`.
  - Headless Chromium with a mock server:
    - The picker lists all 4 workflows.
    - Head to head: Quill and Atlas stream at the same time on the same row, with Orbit pending in stage 2.
    - A 120 ms press-and-release on Stop cancels the workflow mid-stream.
    - "Claude writes → ChatGPT checks" runs through to review.
    - All desks busy: the dialog still opens with a workflow preselected.
    - No overflow at 390 px, no page errors.
    - Demo mode: picker hidden, demo assign still works.
- **Not verified:** real providers, touch, screen readers.

## Next up (in order)

1. **Codex: review PR #4** at its head (the handoff commit `7fcbc59` was already reviewed; review the workflow-picker commit after it). Try Head to head and a busy-desks assignment in `npm run dev`, and confirm `npm run dev:static` still shows the plain demo dialog.
2. **Responsive name-tag spacing** (P3 from Codex's review). `restingSpot` spaces lounge slots by a percentage of the map, which is about 25 px on a 495 px map while tags are about 40 px wide, so Quill and Orbit can overlap on narrow screens. Space slots by label width, or nudge overlapping tags apart after layout.
3. **No demo flash in live mode.** The page draws the demo roster, then moves the robots once the first server snapshot arrives about 100 ms later. Hide the scene until the snapshot arrives or a short timeout passes, then fall back to the demo.
4. **Codex & Claude Code desks.** `POST /api/external/report {agentId, kind:"codex"|"claude-code", status, message}` already adds external agents to the server. Give them a spot in a vacant suite on the map, and add a small script plus hook config so each tool reports itself automatically.
5. **Persistence:** save tasks and activity to a JSON file so a server restart doesn't wipe them.
6. **Try the real providers once:** set the keys in `.env`, run one small task per provider, and record the results here (the model names that worked, any errors).

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
