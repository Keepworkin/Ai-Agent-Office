# Project progress

This is the record of what has been built, what's in progress, and what remains, with a log of every pull request and its UI changes. **Every PR updates this file** (see "Relay" in `AGENTS.md`). For who acts next, see the Next action block at the top of `docs/HANDOFF.md`.

_Last updated: 2026-09-30, `T2-live-startup` PR (Claude Code). `main` = `ab5935b`._

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
- [x] Rule "only claim what you can finish": below about 20% usage, only small tasks; browser work hands off at 10% (PR #7)
- [x] Robot name tags no longer overlap one another in the tested widths (360–1920 px), states, zoom levels and while walking (PR #8, `T1-name-tags`)

### In progress
- [ ] `T2-live-startup`: live mode no longer shows demo data before the server's first snapshot. The PR is up for Codex's review; its state is on the relay board (issue #6).
- [ ] `T3-agent-desks`: Codex and Claude Code get robots in Suites 03 and 04, plus a reporting script and opt-in hooks. Added to PR #9 as a second commit, so that finished work isn't held only on this machine.

### Remaining (in order)
Task IDs are stable. Claim them on the relay board (issue #6) using exactly these IDs.
4. [ ] `T4-persistence`: save tasks and activity to disk so a server restart doesn't wipe them
5. [ ] `T5-real-providers`: try the real Claude and OpenAI APIs once with keys, and record the results
6. [ ] `T6-tags-over-robots`: a robot standing lower on the map can hide another robot's name tag or bubble (e.g. Quill's "✓ Review" bubble covers Byte's tag at 390 px). This happened before `T1` too. Draw name tags in their own layer above all robots.

### Owner-only to-dos (GitHub settings)
- [ ] Delete the six merged `codex/*` branches, including `codex/relay-protocol` (this session can't delete branches)
- [ ] Turn on branch protection for `main`: require a PR and the `check` and `server` checks, and block force pushes
- [ ] Turn on "Automatically delete head branches"

---

## Pull request log

Newest first. "UI changes" describes what you'd see in the browser.

### PR #9, second commit: desks for Codex and Claude Code (`T3-agent-desks`, open)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7`, on top of T2's `7956bdc` in PR #9. Codex hadn't started reviewing PR #9, so this was pushed there rather than held unpushed. **Author:** Claude Code. **Reviewer:** Codex.
- **Contents:**
  - `dist/navigation.js`: walkable floor for Suites 03 and 04 and their doors off the corridor junction. `scripts/check-navigation.cjs` now checks 196 routes, including into both suites, and that the suite walls still block the hallway.
  - `dist/app.js`: suite rooms for the Codex and Claude Code departments. Robots are removed when they leave, suite signs show their occupants, and the agent count and roster size follow the actual team.
  - `dist/live-office.js`:
    - External agents of kind `codex` / `claude-code` that aren't offline become robots in their suite, with names and roles escaped.
    - Their dialog shows the reported activity and has no task buttons.
    - The Assign dialog never offers them.
  - `dist/style.css`: occupied suite signs, compact on narrow maps.
  - `scripts/report-activity.mjs` (new; `npm run report`): posts a status to `/api/external/report`.
    - It has a plain mode, a `--claude-hook` mode that reads hook events from stdin, and a `--codex-notify` mode that reads the `notify` argument.
    - It always exits 0, gives up after 1.5 s, and never sends prompt or reply text.
  - `scripts/check-report-activity.cjs` (new, in `npm run check`): 4 tests against a fake office.
  - `docs/AGENT-DESKS.md` (new): opt-in setup for Claude Code hooks and Codex `notify`, with limits. Nothing is enabled in this repo by default.
- **Fix for Codex's review 5372157895 (P2):** external `agentId` and `status` values reached HTML attributes unescaped. A quoted id injected attributes, reproduced both by Codex and by Claude; a hostile snapshot produced 10 injected elements and attributes, and the literal id couldn't be selected.
  - **Server:** `reportExternal` now accepts only plain ids (1–64 letters, digits, `.`, `_` or `-`), the statuses `working`, `idle`, `waiting` and `offline` (the type now includes `offline`, which the script already sent), the kinds `codex`, `claude-code` and `other`, and string names and messages. Anything else gets a 400; a numeric id used to crash with a 500. 1 new server test (11 total).
  - **Page:** `dist/app.js` escapes ids, states and emoji wherever it writes markup (roster, overview, name tags), and focus restoration uses `CSS.escape`. `dist/live-office.js` keeps ids raw and shows an unknown external status as idle.
  - **Browser checks:** the server rejects every bad report. A hostile snapshot fed straight into the page gives 0 injected elements or attributes, exactly one roster card with the literal id, and clicking it opens that agent. Focus stays on that card across renders. The desks flow is unchanged.
- **UI changes:**
  - **Live mode:** a Codex or Claude Code robot appears at a desk in Suite 03 or Suite 04 when that tool reports in, and walks out when it reports `offline`. The suite sign switches from "For Lease" to "Codex" / "Claude Code" with a count of those working. The agent count and roster include them (e.g. "08 agents").
  - **Static demo:** unchanged; the suites stay "For Lease".

### Next PR: no demo data before the live feed connects (`T2-live-startup`, open)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (restarted from `main` `ab5935b`) → `main`. **Author:** Claude Code. **Reviewer:** Codex.
- **Problem, measured per frame in headless Chromium:**
  - In live mode, the page showed the demo for about 290 ms (about 675 ms on a slower connection) before the first server snapshot: "DEMO MODE", 3 robots working, 12 tasks completed, and a made-up "Quill finished a draft" event.
  - Then the robots that were at demo desks walked across the office to their live spots.
- **Contents:**
  - `dist/index.html`: a one-line inline script marks the page `connecting` before first paint, with a 1.5 s safety timeout. It also adds a "CONNECTING…" badge.
  - `dist/style.css`: while connecting, the simulated data is hidden (the layout keeps its space) and the badge replaces "DEMO MODE". The hidden parts are the stats, robots, activity, review box, roster, overview cards, and the sidebar and legend notes.
  - `dist/live-office.js`:
    - reveals the page after the first snapshot is drawn, or when the connection fails (a static host fails fast);
    - on the first snapshot, drops the demo robots so each appears at its live spot;
    - while connecting, "Assign a task" says "Connecting to the office…" instead of opening the demo dialog.
- **UI changes:**
  - **Live:** "CONNECTING…" for a moment (about 0.1 s here), then the live office. Demo data never shows, and robots start at their live spots.
  - **Static hosting:** "CONNECTING…" for about 0.1 s, then the demo as before.
  - **A server that never answers:** the demo appears after 1.5 s. If the server answers later, the office switches to live as before.
  - **Reconnecting after a server restart:** unchanged ("RECONNECTING", then live), with no robot reset.

### PR #8: name tags don't overlap (`T1-name-tags`, merged 2026-09-30, merge commit `ab5935b`)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (restarted from `main` `3cc7122`) → `main`. **Author:** Claude Code. **Reviewer:** Codex.
- **Contents:**
  - `dist/name-tags.js` (new): `OfficeNameTags.spread`, a DOM-free layout step. Tags are placed top to bottom; one that would overlap slides sideways (at most half its width, so it stays under its robot), otherwise drops just below the tag it hits.
  - `dist/app.js`: `spreadNameTags()` runs after each scene update and animation frame, from the robots' map coordinates and cached tag sizes (re-measured when the map resizes, e.g. zoom). Tag sizes are cached (only the map's width and height are read each frame); about 0.01 ms per call.
  - `dist/style.css`: tags move by `--tag-x` / `--tag-y`.
  - `scripts/check-name-tags.cjs` (new, part of `npm run check`): 5 tests, including the 390 px lounge case and 2000 random crowds with no overlaps.
- **UI changes:**
  - **Name tags don't overlap one another** in the tested coverage: 360–1920 px, 100–150% zoom, standing or walking. Measured before: overlaps at every width up to 1024 px, even for desks at 390 px, and in 60 of 60 samples while robots walked at 390 px. After: none at 360–1920 px in any state, and 0 of 60 while walking.
  - In a crowded lounge, the outer robots' tags share a row and the centre robot's tag sits just below.
  - At desktop widths (1280 px and up) the resting layout looks the same as before. Tags move only when robots converge, which is the collision handling working.
  - Clicking a moved tag still opens that robot.
- **Known, not in this PR:** another robot's body or bubble can still cover a tag (`T6-tags-over-robots`); this was already the case before.
- **Review:** Codex, exact head `7782183` (review 5371099717): no blocking findings, with its own browser checks at 390 px (moving, 150% zoom, clicking a moved tag) and 1440 px. CI green (run 36765015904). Codex's three wording notes (tested coverage instead of "any width", cached tag sizes instead of "no layout reads", desktop tags can move when robots converge) are applied above.

### PR #7: post-merge record and usage-claim rule (`REQ-usage-claim`, merged 2026-09-30, merge commit `3cc7122`)
- **Branch:** `claude/ai-agent-office-repo-9nv3o7` (restarted from `main` `ed40543`) → `main`. **Author:** Claude Code. **Reviewer:** Codex.
- **Review:** Codex, exact head `a40726e` (review 5370716521): no blocking findings. CI green (run 36762637896).
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
