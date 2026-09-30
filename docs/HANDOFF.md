# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

```text
Relay handoff
Task ID: T1-name-tags → next: REVIEW-PR<n>@<head> (PR number and SHA are on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: new PR from claude/ai-agent-office-repo-9nv3o7 (based on main 3cc7122); exact head on the board
Completed and verified: name tags never overlap. New dist/name-tags.js (OfficeNameTags.spread: slide sideways up to half a tag's width, else drop below), called from dist/app.js after each scene update and frame. npm run check passes, including the 5 new tests in scripts/check-name-tags.cjs. In headless Chromium, no overlaps at 360–1920 px in the initial, all-idle, all-working and all-review states, or while robots walk (0/60 samples at 390 and 1440 px), or at 100–150% zoom, in both demo and live mode (mock server). Clicking a moved tag still opens its robot. Nothing is slower (about 0.01 ms per frame, no long tasks).
Merge gates: CI pending on the new head; not yet reviewed; no open findings; up to date with main
Next owner: Codex
Next action: REVIEW-PR<n>@<head>. At 390 px (npm run dev:static), no two name tags overlap in the lounge or at desks, including after zoom and while robots walk; desktop (1440 px) looks unchanged; clicking a tag opens its robot. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: touch devices, screen readers. Another robot's body or bubble can still cover a tag; this was already true before this PR and is tracked as T6-tags-over-robots.
After completion: findings → changes_requested, owner Claude. No findings → ready_for_user_merge if all gates pass, owner User. Then T2-live-startup is next.
User action: none until then
```

## State of `main`

- **`main` = `3cc7122`**, merged 2026-09-30 from PR Keepworkin/Ai-Agent-Office#7 with a merge commit. That PR is docs only: it records PR #4 and adds the "only claim what you can finish" usage rule. Codex reviewed exact head `a40726e`; CI was green; the owner approved.
- Before that: PR Keepworkin/Ai-Agent-Office#4 (`ed40543`), with the workflow picker, the disclaimer fix and the relay protocol.
- What's on `main`:
  - The live Claude + ChatGPT server (`server/`) and the isometric robot office wired to it (`dist/`), with review, revise and stop.
  - The workflow picker, with side-by-side output per stage.
  - The relay protocol (`docs/RELAY.md`), the relay board (issue #6), and the progress tracker (`docs/PROGRESS.md`).
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), touch devices and screen readers.

## Next up (in order)

Claim these on the relay board using exactly these task IDs. Details are in `docs/PROGRESS.md`.

1. ~~`T1-name-tags`~~: built; its review is the current **Next action** above.
2. `T2-live-startup`: **no demo flash in live mode.** The page draws the demo roster, then moves the robots once the first server snapshot arrives about 100 ms later. Hide the scene until the snapshot arrives or a short timeout passes, then fall back to the demo.
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
