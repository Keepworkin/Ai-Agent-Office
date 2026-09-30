# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

```text
Relay handoff
Task ID: T2-live-startup → next: REVIEW-PR<n>@<head> (PR number and SHA are on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: new PR from claude/ai-agent-office-repo-9nv3o7 (based on main ab5935b); exact head on the board
Completed and verified: live mode no longer shows demo data before the first snapshot. index.html marks the page "connecting" before first paint (inline script, 1.5 s safety timeout) and adds a CONNECTING… badge; style.css hides the simulated data while connecting; live-office.js reveals after the first snapshot or a failed connection, resets the scene on the first snapshot so robots start at their live spots, and blocks "Assign a task" while connecting. Per-frame recordings in headless Chromium: live (normal and +600 ms slow) never shows DEMO MODE or demo stats/robots; static shows the demo after about 0.1 s; a server that never answers shows the demo at 1.5 s. Reconnect after a server restart keeps the same robot elements. Earlier live checks still pass (Stop mid-stream 5/5, revise, approve, workflow picker, disclosure text, 390 px no overflow, no page errors). npm run check passes.
Merge gates: CI pending on the new head; not yet reviewed; no open findings; up to date with main
Next owner: Codex
Next action: REVIEW-PR<n>@<head>. In npm run dev, reload and confirm no DEMO MODE, demo stats or walking-from-desk robots appear before LIVE FEED; in npm run dev:static, the demo appears promptly; blocking /api/events shows CONNECTING… then the demo after 1.5 s. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: touch devices, screen readers, real providers. (A long task output can push Approve below the dialog's visible area; the button still works once scrolled, and this predates T2.)
After completion: findings → changes_requested, owner Claude. No findings → ready_for_user_merge if all gates pass, owner User. Then T3-agent-desks is next.
User action: none until then
```

## State of `main`

- **`main` = `ab5935b`**, merged 2026-09-30 from PR Keepworkin/Ai-Agent-Office#8 (`T1-name-tags`) with a merge commit. Codex reviewed exact head `7782183`; CI was green; the owner approved.
- Before that:
  - PR Keepworkin/Ai-Agent-Office#7 (`3cc7122`): docs and the usage-claim rule.
  - PR Keepworkin/Ai-Agent-Office#4 (`ed40543`): the workflow picker and the relay protocol.
- What's on `main`:
  - The live Claude + ChatGPT server (`server/`) and the isometric robot office wired to it (`dist/`), with review, revise and stop.
  - The workflow picker, with side-by-side output per stage.
  - Name tags that don't overlap one another.
  - The relay protocol (`docs/RELAY.md`), the relay board (issue #6), and the progress tracker (`docs/PROGRESS.md`).
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), touch devices and screen readers.

## Next up (in order)

Claim these on the relay board using exactly these task IDs. Details are in `docs/PROGRESS.md`.

1. ~~`T1-name-tags`~~: merged in PR #8.
2. ~~`T2-live-startup`~~: built; its review is the current **Next action** above.
3. `T3-agent-desks`: **Codex & Claude Code desks.** `POST /api/external/report {agentId, kind:"codex"|"claude-code", status, message}` already adds external agents to the server. Give them a spot in a vacant suite on the map, and add a small script plus hook config so each tool reports itself automatically.
4. `T4-persistence`: save tasks and activity to a JSON file so a server restart doesn't wipe them.
5. `T5-real-providers`: set the keys in `.env`, run one small task per provider, and record the results (the model names that worked, any errors).
6. `T6-tags-over-robots`: each robot is drawn in its own layer ordered by depth, so a robot lower on the map can cover another robot's name tag or bubble (e.g. Quill's "✓ Review" bubble over Byte's tag at 390 px). Draw name tags in a separate layer above all robots, keeping clicks and hover tooltips working.

## How to verify

```sh
npm install
npm run check          # dashboard: syntax, assets, 144 navigation routes (+ time budget), live-state and name-tag tests
npm run check:server   # server: typecheck + tests (fake provider, no API calls)
npm run dev            # http://localhost:8787 — works with no keys (mock mode)
```

Walk through the full cycle in the browser: available → working → needs review → approved, then a revision, a stopped task and an invalid assignment. Check at desktop and phone width.

## Starting prompts

**For Codex / Claude Code, when it's their turn:**
> Read AGENTS.md and docs/HANDOFF.md. Continue with the first unfinished "Next up" item on your own branch (`codex/<topic>` or `claude/<topic>`). Commit small and often. Before you stop, push and update docs/HANDOFF.md.

**To have one review the other's work:**
> Read AGENTS.md. Review [PR URL] at [commit SHA] against docs/HANDOFF.md's acceptance notes. Report findings with file/line, severity and repro. Don't change code.
