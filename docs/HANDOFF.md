# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

**Through Sunday 2026-10-04, Claude Code does all building, and a separate Claude reviewer agent does the reviews** (owner's decision on 2026-10-01, board comment 5932844992; see "When one agent is out" in `docs/RELAY.md`). Codex: don't claim work until the owner resumes you; then you may review anything merged meanwhile.

**Product direction:** no paid API calls or API-key setup. Track the owner's personal ChatGPT, Claude, Codex and Claude Code use through supported reporting only. `T5-real-providers` is dropped; see `T7-personal-accounts` in `docs/PROGRESS.md`.

```text
Relay handoff
Task ID: T6-tags-over-robots + review fixes → next: REVIEW-PR11@<head> (exact SHA on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: new PR from claude/ai-agent-office-repo-9nv3o7 (based on main b52e475); exact head on the board
Completed and verified:
- Bodies stack by depth; bubbles (200), tags (210) and tooltips (300) are drawn above every body.
- Bubbles spread upwards around each other and around the placed tags (the spread function now takes fixed boxes).
- Coverage, checked at 5 points per label: before, labels were covered at 390 px in every state and in 40/40 walking samples (26/40 at 1440 px). After, none at 390, 768 or 1440 px in any state, and 0/40 walking at both widths.
- Tag overlap checks still 0; clicks on tags and bodies open the right robot; tooltips are on top; live desks unchanged.
- npm run check: 18 tests, 196 routes.
- Review fixes, from the separate Claude reviewer's report on aef0a57:
  - P2: bubbles were clipped above the map top on narrow screens. They're now clamped to the map top, and bubbles may slide sideways up to a full width. No clipping at 320–768 px. One pair of identical bubbles can still overlap at 320/360 px with everyone working.
  - P3s: a hovered or focused body comes to the front; a tag is re-measured when its name changes; AGENTS.md gate 2 points to the handover rule.
Merge gates: CI pending on the new head; not yet reviewed; no open findings; up to date with main
Next owner: independent Claude reviewer (Codex out)
Next action: review the exact head against the coverage and regression claims above. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: touch devices, screen readers.
After completion: findings → fixed and re-reviewed the same way. No findings → ready_for_user_merge if all gates pass, owner User. Then T7-personal-accounts, once the owner answers the product question.
User action: none until then
```

## State of `main`

- **`main` = `b52e475`**, merged 2026-10-01 from PR Keepworkin/Ai-Agent-Office#10 (`T4-persistence` and the fix for Codex's P2) with a merge commit. Codex re-reviewed exact head `8d3eb9a`; CI was green; the owner approved.
- Before that:
  - PR Keepworkin/Ai-Agent-Office#9 (`3d89a50`): live startup and agent desks.
  - PR Keepworkin/Ai-Agent-Office#8 (`ab5935b`): name tags.
  - PR Keepworkin/Ai-Agent-Office#7 (`3cc7122`): the usage rule.
  - PR Keepworkin/Ai-Agent-Office#4 (`ed40543`): the workflow picker and the relay protocol.
- What's on `main`: the live Claude + ChatGPT server and the robot office with review, revise and stop; the workflow picker; non-overlapping name tags; a CONNECTING state at live startup; desks for Codex and Claude Code; tasks and activity saved across restarts; the relay protocol, board and tracker.
- **Start new work from a fresh branch off the latest `main`.** Old `codex/*` branches are fully merged; don't build on them.
- **Not verified yet:** real OpenAI and Anthropic API calls (everything ran in mock mode), live hook delivery from installed tools, touch devices and screen readers.

## Next up (in order)

Claim these on the relay board using exactly these task IDs. Details are in `docs/PROGRESS.md`.

1. ~~`T1-name-tags`~~: merged in PR #8.
2. ~~`T2-live-startup`~~ and 3. ~~`T3-agent-desks`~~: merged in PR #9.
4. ~~`T4-persistence`~~: merged in PR #10.
5. ~~`T5-real-providers`~~: dropped (no paid API calls).
6. ~~`T6-tags-over-robots`~~: built; its review is the current **Next action** above.
7. `T7-personal-accounts`: show activity from the owner's personal ChatGPT, Claude, Codex and Claude Code use, through supported reporting only. Waiting on the owner's answer: conversations inside the office, or tracking activity in the usual apps?

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
