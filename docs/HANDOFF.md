# Handoff — read this first

The relay rules are in `docs/RELAY.md`. **If you own the ▶ Next action below, do it now; don't wait for the owner to relay it.** The relay board (issue #6) is the only authority on who owns what; this block is evidence. After implementing, rewrite this block; after a review only, just comment on the PR. What's done and what remains, plus every PR's contents and UI changes, is in `docs/PROGRESS.md`.

## ▶ Next action

_Evidence only. The relay board (issue #6) is authoritative for ownership._

```text
Relay handoff
Task ID: FIX-PR9-5372157895 → next: REVIEW-PR9@<head> (exact SHA on the board)
Status: ready_for_review
Completed by: Claude
PR / branch / exact head: PR #9, claude/ai-agent-office-repo-9nv3o7; exact head on the board
Completed and verified:
- P2 fixed at both layers:
  - Server: reportExternal accepts only plain ids (/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/), statuses working/idle/waiting/offline, kinds codex/claude-code/other, and string name and message. Anything else gets a 400 (a numeric id used to give a 500). New server test.
  - Page: app.js escapes ids, states and emoji at every markup sink, and focus restoration uses CSS.escape. live-office.js keeps ids raw and normalises unknown external states to idle.
- Reproduced first on 2ae3089: the quoted id was accepted, 2 injected attributes on the page, and 10 from a hostile snapshot. After the fix: every bad report gets a 400; a hostile snapshot fed straight into the page gives 0 injected elements or attributes and one roster card with the literal id, which opens that agent; focus is kept across renders.
- npm run check (16 tests, 196 routes) and npm run check:server (typecheck + 11 tests) pass.
Merge gates: CI pending on the new head; the fix isn't reviewed yet; no open findings; up to date with main
Next owner: Codex
Next action: REVIEW-PR9@<head>. Re-check the P2 with your quoted-id probe (it should now get a 400), and complete the startup checks you listed as not signed off: first-paint recordings, delayed and blocked /api/events 1.5 s fallback, and hook/notify integration as far as you can. Done when the review names the exact head and a handoff is on the board.
Blockers / untested: touch devices, screen readers, real providers; the Codex notify format isn't verified against a live Codex install; bubbles and bodies can cover tags (T6).
After completion: findings → changes_requested, owner Claude. No findings → ready_for_user_merge if all gates pass, owner User. Then T4-persistence is next.
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
2. ~~`T2-live-startup`~~: built in PR #9; its review is the current **Next action** above.
3. ~~`T3-agent-desks`~~: built in PR #9 (second commit); see `docs/AGENT-DESKS.md`.
4. `T4-persistence`: save tasks and activity to a JSON file so a server restart doesn't wipe them.
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
