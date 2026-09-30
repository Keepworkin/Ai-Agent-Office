# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

```text
Relay handoff
Task ID: REQ-usage-claim → next: REVIEW-PR<n>@<head> (PR number and SHA are on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: new PR from claude/ai-agent-office-repo-9nv3o7 (restarted from main ed40543); exact head on the board
Completed and verified: docs only. Records main = ed40543 (PR #4 merged). Adds the usage-claim rule to docs/RELAY.md ("Usage and wrap-up") and AGENTS.md: don't claim a task you can't finish on your remaining usage; below about 20%, only small, docs-only or read-only tasks; browser work hands off at 10%. npm run check passes.
Merge gates: CI pending on the new head; not yet reviewed; no open findings; up to date with main
Next owner: Codex
Next action: REVIEW-PR<n>@<head>. Check that the new rule doesn't conflict with the existing 5% wrap-up and claim rules, and that HANDOFF/PROGRESS match main ed40543. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: none (no application changes)
After completion: findings → changes_requested, owner Claude. No findings → ready_for_user_merge if all gates pass, owner User. Either agent with usage may then claim T1-name-tags (application files; don't overlap with this docs PR).
User action: none until then
```

## State of `main`

- **`main` = `ed40543`**, merged 2026-09-30 from PR Keepworkin/Ai-Agent-Office#4 with a merge commit, following "Merging to `main`" in `AGENTS.md`.
  - Codex reviewed every commit through head `b07aa90` with no blocking findings.
  - CI run 36731101833 was green, and the owner approved the merge.
  - PR #5 (Codex's relay protocol) is included through PR #4.
- What's on `main`:
  - The live Claude + ChatGPT server (`server/`) and the isometric robot office wired to it (`dist/`), with review, revise and stop.
  - The workflow picker, with side-by-side output per stage.
  - The relay protocol (`docs/RELAY.md`), the relay board (issue #6), and the progress tracker (`docs/PROGRESS.md`).
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), touch devices and screen readers.

## Next up (in order)

Claim these on the relay board using exactly these task IDs. Details are in `docs/PROGRESS.md`.

1. `T1-name-tags`: **responsive name-tag spacing** (P3 from Codex's review). `restingSpot` in `dist/app.js` spaces lounge slots by a percentage of the map, about 25 px on a 495 px map, while tags are about 40 px wide, so Quill and Orbit can overlap on narrow screens. Space slots by label width, or nudge overlapping tags apart after layout.
2. `T2-live-startup`: **no demo flash in live mode.** The page draws the demo roster, then moves the robots once the first server snapshot arrives about 100 ms later. Hide the scene until the snapshot arrives or a short timeout passes, then fall back to the demo.
3. `T3-agent-desks`: **Codex & Claude Code desks.** `POST /api/external/report {agentId, kind:"codex"|"claude-code", status, message}` already adds external agents to the server. Give them a spot in a vacant suite on the map, and add a small script plus hook config so each tool reports itself automatically.
4. `T4-persistence`: save tasks and activity to a JSON file so a server restart doesn't wipe them.
5. `T5-real-providers`: set the keys in `.env`, run one small task per provider, and record the results (the model names that worked, any errors).

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
