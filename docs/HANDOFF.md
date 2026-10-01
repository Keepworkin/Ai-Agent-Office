# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

```text
Relay handoff
Task ID: FIX-PR10-5379621730 (T4-persistence) → next: REVIEW-PR10@<head> (exact SHA on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: PR #10, claude/ai-agent-office-repo-9nv3o7; exact head on the board
Completed and verified:
- T4: tasks, activity and office-agent stats survive a restart; interrupted work comes back failed; review tasks come back in review; server/data/ is git-ignored. Your review 5379621730 confirmed the normal restart path.
- P2 fix: store.ts invalidSavedOffice checks every task, step, activity entry and stats record. Malformed-but-valid JSON is moved aside, the warning says why, and the office starts fresh instead of crashing on every start.
- Reproduced first with a failing regression test covering 4 malformed files. On a real server, your exact file boots (0 tasks, file moved aside), and a normal restart afterwards works.
- npm run check:server: typecheck + 17 tests.
Merge gates: CI pending on the new head; the fix isn't reviewed yet; no open findings; up to date with main
Next owner: Codex
Next action: REVIEW-PR10@<head>. Re-run your malformed-file probe (the server should boot and move the file aside) and check that the shape checks accept what the office itself saves. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: A hard kill loses the last 0.5 s of changes. Windows rename behaviour isn't tested.
After completion: findings → changes_requested, owner Claude. No findings → ready_for_user_merge if all gates pass, owner User. Then T6-tags-over-robots (T5 needs the owner's API keys).
User action: none until then
```

## State of `main`

- **`main` = `3d89a50`**, merged 2026-09-30 from PR Keepworkin/Ai-Agent-Office#9 (`T2-live-startup`, `T3-agent-desks` and the fix for Codex's P2) with a merge commit. Codex re-reviewed exact head `c802881`; CI was green; the owner approved.
- Before that:
  - PR Keepworkin/Ai-Agent-Office#8 (`ab5935b`): name tags.
  - PR Keepworkin/Ai-Agent-Office#7 (`3cc7122`): the usage rule.
  - PR Keepworkin/Ai-Agent-Office#4 (`ed40543`): the workflow picker and the relay protocol.
- What's on `main`:
  - The live Claude + ChatGPT server (`server/`) and the isometric robot office wired to it (`dist/`), with review, revise and stop.
  - The workflow picker, with side-by-side output per stage.
  - Name tags that don't overlap one another.
  - A "CONNECTING…" state instead of demo data at live startup.
  - Desks for Codex and Claude Code, with `scripts/report-activity.mjs` and `docs/AGENT-DESKS.md`.
  - The relay protocol (`docs/RELAY.md`), the relay board (issue #6), and the progress tracker (`docs/PROGRESS.md`).
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), live hook delivery from installed tools, touch devices and screen readers.

## Next up (in order)

Claim these on the relay board using exactly these task IDs. Details are in `docs/PROGRESS.md`.

1. ~~`T1-name-tags`~~: merged in PR #8.
2. ~~`T2-live-startup`~~ and 3. ~~`T3-agent-desks`~~: merged in PR #9.
4. ~~`T4-persistence`~~: built; its review is the current **Next action** above.
5. `T5-real-providers`: set the keys in `.env`, run one small task per provider, and record the results (the model names that worked, any errors).
6. `T6-tags-over-robots`: each robot is drawn in its own layer ordered by depth, so a robot lower on the map can cover another robot's name tag or bubble (e.g. Quill's "✓ Review" bubble over Byte's tag at 390 px). Draw name tags in a separate layer above all robots, keeping clicks and hover tooltips working.

## How to verify

```sh
npm install
npm run check          # dashboard: syntax, assets, 196 navigation routes (+ time budget), live-state, name-tag and report-script tests
npm run check:server   # server: typecheck + tests (fake provider, no API calls)
npm run dev            # http://localhost:8787 — works with no keys (mock mode)
```

Walk through the full cycle in the browser: available → working → needs review → approved, then a revision, a stopped task and an invalid assignment. Check at desktop and phone width.

## Starting prompts

**For Codex / Claude Code, when it's their turn:**
> Read AGENTS.md and docs/HANDOFF.md. Continue with the first unfinished "Next up" item on your own branch (`codex/<topic>` or `claude/<topic>`). Commit small and often. Before you stop, push and update docs/HANDOFF.md.

**To have one review the other's work:**
> Read AGENTS.md. Review [PR URL] at [commit SHA] against docs/HANDOFF.md's acceptance notes. Report findings with file/line, severity and repro. Don't change code.
