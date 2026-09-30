# Project progress

This is the record of what has been built, what's in progress, and what remains, with a log of every pull request and its UI changes. **Every PR updates this file** (see "Relay" in `AGENTS.md`). For who acts next, see the Next action block at the top of `docs/HANDOFF.md`.

_Last updated: 2026-09-30, after PR #4 merged (`main` = `ed40543`) (Claude Code)._

## Status at a glance

### Done (on `main`)
- [x] Live server that supports real providers for the six robot teammates (3 on Claude, 3 on ChatGPT). Only mock mode has been exercised so far; real API calls are unverified (PR #1)
- [x] Animated isometric office dashboard with robot teammates (PR #2)
- [x] Robots driven by the live server: assign, stream output, review, revise, approve, stop (PR #3)
- [x] Live dashboard fixes: Stop is clickable mid-stream, batched rendering, newest activity first (PR #1)
- [x] Route-finding about 50× faster; no long frames in the measured 20-second browser sample (PR #1)
- [x] 4.4 MB of unused images removed, and a guard that fails CI on unused files (PR #1)
- [x] Robots start at their desk or lounge spot, not piled at the door (PR #1)
- [x] Codex/Claude relay process, merge-to-`main` rules, and CI for both the office and the server (PR #1)
- [x] Workflow picker: assign a task to one teammate or a multi-agent workflow, with side-by-side output per stage (PR #4)
- [x] Live-mode disclaimer fix: the note about real vs. simulated AI calls is correct when the server runs (PR #4)
- [x] One relay protocol (`docs/RELAY.md`) with the relay board (issue #6), task IDs, completion states, usage and wrap-up rules, and this tracker (PR #4, including Codex's PR #5)

### In progress
- [ ] `REQ-usage-claim` (docs only): records `main` = `ed40543`, and adds the rule "only claim what you can finish" (below about 20%, only small tasks; browser work hands off at 10%). State is on the relay board (issue #6).

### Remaining (in order)
Task IDs are stable. Claim them on the relay board (issue #6) using exactly these IDs.
1. [ ] `T1-name-tags`: robot name tags overlap on narrow screens (Codex's P3)
2. [ ] `T2-live-startup`: live mode briefly shows the demo robots (about 0.1 s) before server data arrives
3. [ ] `T3-agent-desks`: desks for Codex and Claude Code sessions in a vacant suite, plus scripts so each tool reports its own activity
4. [ ] `T4-persistence`: save tasks and activity to disk so a server restart doesn't wipe them
5. [ ] `T5-real-providers`: try the real Claude and OpenAI APIs once with keys, and record the results

### Owner-only to-dos (GitHub settings)
- [ ] Delete the six merged `codex/*` branches, including `codex/relay-protocol` (this session can't delete branches)
- [ ] Turn on branch protection for `main`: require a PR and the `check` and `server` checks, and block force pushes
- [ ] Turn on "Automatically delete head branches"

---

## Pull request log

Newest first. "UI changes" describes what you'd see in the browser.

### Next PR: post-merge record and usage-claim rule (`REQ-usage-claim`, open)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (restarted from `main` `ed40543`) → `main`. **Author:** Claude Code. **Reviewer:** Codex.
- **Contents:** records `main` = `ed40543` in `docs/HANDOFF.md` and here; adds "Only claim what you can finish" to "Usage and wrap-up" in `docs/RELAY.md` and to `AGENTS.md`. It follows the proposal on the relay board after Codex's usage dropped from 13% to 0% during one browser review.
- **UI changes:** none.

### PR #4: Workflow picker, disclosure fix, self-driving relay, progress tracker (merged 2026-09-30, merge commit `ed40543`)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` → `main`. **Author:** Claude Code. **Reviewer:** Codex.
- **Contents:**
  - `7fcbc59`: post-merge handoff; records `main` = `9329c5f`.
  - `857fea4`: workflow picker, stage grouping helpers and their tests.
  - `97b9546`: fixes Codex's P2. The live provider disclaimer is targeted by id so the picker can't overwrite it.
  - `73f7162`: self-driving relay. A "Next action" block in `docs/HANDOFF.md` that the owning agent acts on, and matching rules in `AGENTS.md`.
  - `896293d`: this tracker (`docs/PROGRESS.md`), plus a PR-template item to keep it current.
  - `REQ-usage-wrapup` (owner request, with Codex's additions): "Usage and wrap-up" in `docs/RELAY.md`.
    - Check usage at session start, before substantial work and every 5 minutes (after each small step below 10%), using the lowest quota window or "unknown".
    - At 5% or less, push, `RELEASE` and hand the rest to the other agent. That handoff is not completion or sign-off.
    - No automatic credit spending.
    - Codex's heartbeat is now every 5 minutes.
  - `d741ef5`, then the review-fix commit: ownership and completion rules in `docs/RELAY.md`: a task-state table with one owner at a time, claims on the relay board (issue #6) that never expire by time, a definition of done per task type, and "when you're done, stop".
  - A merge commit folding in Codex's PR #5 (`3db1a73`), reconciled with `73f7162` into **one** protocol:
    - `docs/RELAY.md` is the rulebook: `Relay handoff` comment format, claim before implementing, and no commits for review-only turns.
    - `AGENTS.md` has one short Relay section pointing to it.
    - `docs/HANDOFF.md` has a single ▶ Next action block in the handoff format.
- **UI changes:**
  - **Assign dialog** (live mode): new "How should the team work?" menu, with "One teammate" or a server workflow ("Claude writes → ChatGPT checks", "ChatGPT researches → Claude builds", "Head to head", "Full team").
    - Choosing a workflow hides the teammate menu and shows who works in each stage, e.g. *Stage 1: Quill (Claude) + Atlas (ChatGPT) → Stage 2: Orbit (Claude)*.
    - Workflows stay selectable when every desk is busy; "One teammate (all busy)" is then disabled.
    - The submit button reads "Start the workflow ↗".
  - **Task dialog:** output is grouped by stage ("Stage 1 · side by side"). Parallel agents appear in two columns, with Claude in orange and ChatGPT in green, each headed "name · provider · MOCK · status". Multi-agent tasks get a wider (900 px) dialog, and the columns stack on phones.
  - **Disclaimer text** (live mode): now reads "Uses each agent's server provider. Mock tags mean simulated output; configured providers make real API calls." Before, the demo-only text was left showing.
  - **Static demo:** unchanged.
- **Reviews:**
  - Codex found no problems with `7fcbc59`.
  - Its review of `857fea4` found one P2, fixed in `97b9546`.
  - Claude reviewed Codex's PR #5: one P2, two competing protocols, resolved by the reconciliation merge.
  - Codex's review of `d741ef5` (`5367683425`) found two P2s and tracker corrections, all fixed in the next commit:
    - Board claims were overridable by newer notes elsewhere. Now the board is the only authority.
    - "No findings" jumped straight to merge-ready. There are now separate `reviewed`, merge-gate, `ready_for_user_merge`, `integrated` and `done` states, plus task IDs and a `BLOCKED` state for interrupted work.
    - Tracker wording corrected.
  - Codex reviewed the fixes and the usage rules through head `b07aa90`: no blocking findings, both P2s resolved, browser checks passed.
- **Checks:** CI green on `b07aa90` (run 36731101833); 7 live-state tests; 10 server tests. Merged by Claude with a merge commit after the owner approved.

### PR #5: Direct relay protocol (folded into PR #4)
- **Branch:** `codex/relay-protocol` → `claude/ai-agent-office-repo-9nv3o7`. **Author:** Codex. **Reviewer:** Claude Code.
- **Contents:** `3db1a73`, which adds `docs/RELAY.md` (the handoff comment format, claim-before-implementing, no commits for review-only turns, and each agent's wake-up mechanism and its limits), plus pointers in `AGENTS.md` and `docs/HANDOFF.md`.
- **UI changes:** none.
- **Review:** one P2. It duplicated the relay protocol from `73f7162` (two owner blocks). It was merged into PR #4's branch and reconciled there, with Codex's rules forming the base of `docs/RELAY.md`.

### PR #1: Live server, integration, fixes and relay (merged 2026-09-29, merge commit `9329c5f`)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` → `main`. **Authors:** Claude Code, with Codex's PRs #2 and #3 included. **Reviewers:** each agent reviewed the other's commits, through head `057d0fa`.
- **Contents:**
  - `5e398f2`: Node/TypeScript server. Anthropic and OpenAI providers, mock mode, staged workflows, SSE events and tests.
  - `93f20d5`: merged Codex's dashboard (PR #2) and made it the only UI (Claude's early React UI was removed). The server serves `dist/`. The roster was aligned to the six robots, a review/approve/revise flow was added, and the relay handoff and CI were set up.
  - `9ff866c`: Codex's live feed (PR #3, below).
  - `c1c5b55`: Claude's fixes from its review of PR #3.
  - `d4c4767`: faster route-finding.
  - `e3cd2da`: unused images removed, plus the asset guard.
  - `3ed0bc6`: robot start positions and roster.
  - `b9471b5`: merge rules.
  - `e934d72`, `070d935`, `057d0fa`: Codex's review records.
- **UI changes:**
  - **Stop task** can now be clicked while output is streaming (0 of 5 human-speed clicks succeeded before, 5 of 5 after). Streamed text no longer rebuilds the dialog.
  - **Office pulse** panel shows the newest activity first.
  - The **agent dialog** stays on the task you opened instead of jumping to another one.
  - **Robots walk smoothly:** route-finding went from 88 ms to 1.6 ms on average, and the 50–260 ms freezes seen before didn't appear in the measured 20-second sample.
  - **Robots start** at their desk (working) or a spread-out lounge spot (idle). Overlapping name tags at desktop width went from 6 pairs to 0.
- **Checks:** CI green; cross-agent review through `057d0fa`; merged by the owner with a merge commit.

### PR #3: Live office feed (merged via PR #1; commit `9ff866c`)
- **Author:** Codex. **Reviewer:** Claude Code, whose five findings were fixed in `c1c5b55`.
- **Contents:** `dist/live-state.js` and `dist/live-office.js` connect the robots to the server's `/api/events` stream and HTTP controls. Includes state tests.
- **UI changes:**
  - A **LIVE FEED** or **LIVE FEED · MOCK PROVIDERS** label replaces "DEMO MODE" when the server is running.
  - Robots follow real server status: working, needs review, or available.
  - The **agent dialog** shows streamed task output, a progress bar, revision notes, and Approve, Request revision and Stop buttons.
  - **MOCK** tags mark agents that have no API key.
  - When the connection drops, "RECONNECTING" shows and task buttons are disabled until it returns.
  - Without a server (static hosting), the original demo still runs.

### PR #2: Animated office dashboard (merged via PR #1; commit `54f3b93`)
- **Author:** Codex. **Reviewer:** Claude Code. Its findings (route-finding speed, unused images, name-tag overlap, roster setup) were fixed later in PR #1.
- **Contents:** static dashboard in `dist/`, collaboration docs (`AGENTS.md`, `CLAUDE.md`, `docs/COLLABORATION.md`), the PR template, and source-check CI.
- **UI changes** (new):
  - An isometric office with a **ChatGPT** wing and a **Claude** wing, and two "For Lease" suites.
  - Six animated robot teammates that walk between desks and the lounge.
  - Stats tiles, an "Office pulse" activity panel, a "Review work" box, and a team roster.
  - A "Manager overview" page, zoom and pause controls, and an Assign dialog.
  - Everything was simulated at this point.
