# Agent Office — shared development instructions

Build an interactive office dashboard where AI teammates have visible tasks and an office manager can inspect and review their work.

## Relay: Codex and Claude Code take turns
The two tools build this project in turns; whichever one has usage left works while the other waits for its limit to reset. **The user should not have to relay messages between you.** `docs/HANDOFF.md` does that job.

**Start of every session, before anything else:**
1. `git fetch origin` and read `docs/HANDOFF.md` from the **latest** relay branch named in its "Next action" block, not from your local copy or `main`.
2. Read the **Next action** block at the top.
   - **If you are its owner** (or it says "either agent"), do it now, without asking the user to confirm. That includes reviewing, fixing review findings, and starting the next build item.
   - **If the other agent owns it**, tell the user in one line that it's the other agent's turn and what it should do. Don't do the other agent's step.
   - **If it says "User"**, only the user can unblock it (for example, approving a merge). Say so, then take the top "Next up" build item that doesn't conflict with that step, if there is one.
3. Check the PR it names for anything newer than the block (reviews, comments, CI). Newer information wins; fix the block if it's stale.

**Before you stop** (task done, or usage running low):
1. Commit and push. An unpushed change is lost to the other agent.
2. **Rewrite the Next action block** for whoever goes next: owner, the exact task, the exact commit or PR, how to verify, "done when", and who takes over after that. Make it self-contained, so the next agent can act with no other context.
3. **Update `docs/PROGRESS.md`:** tick off finished items, move things between Done, In progress and Remaining, and add or extend your PR's entry in the log. Say what it contains (commits) and **what changed in the UI** from a user's point of view (or "no UI changes").
4. Post the same next action as a comment on the PR, so it's visible where reviews happen.
5. End your reply to the user with the same **Next steps** list, saying who owns each step.

**Only the user** approves merges to `main` (see "Merging to `main`"). Everything else — reviewing, fixing, building the next item — the agents hand to each other through the Next action block.

Commit small and often so a sudden usage cutoff loses little.

## Current implementation
- **Frontend — `dist/`** (static, no build step). `dist/` is the authored source, not disposable build output.
  - `dist/index.html`: page structure. `dist/style.css`: responsive theme. `dist/app.js`: state and interactions. `dist/navigation.js`: walkable floor + A* routing.
  - Art in use: `dist/office-iso.png` (office map) and `dist/robot-cycle.png` (robot sprites).
  - `dist/live-state.js` and `dist/live-office.js` connect server events and HTTP task controls. Static hosting falls back to the labeled demo; receiving a server snapshot disables simulated progress.
- **Backend — `server/`** (Node + TypeScript). Runs the six teammates on real models: Atlas, Nova, Sage on ChatGPT (OpenAI Responses API); Byte, Quill, Orbit on Claude (Anthropic SDK). Ids match the robots in `dist/app.js`.
  - `server/src/office/office.ts`: orchestrator (stages, hand-offs, review/approve/revise, cancel). `server/src/providers/`: Anthropic, OpenAI and mock adapters. `server/src/types.ts`: every event and data shape.
  - Streams changes over server-sent events at `GET /api/events`; full API in `server/README.md`.
  - Providers without an API key run in mock mode. Keys live only in `.env` on the server, never in `dist/`.
- Keep demo labeling honest. Do not imply an agent performed real work when it ran in mock mode.

## Working agreement for Codex and Claude Code
- Read this file and README.md before editing.
- Use separate branches/checkouts for simultaneous work. Branch naming: `codex/<topic>` or `claude/<topic>`.
- One agent implements a given change; the other reviews the exact commit and diff. Do not edit the same working tree concurrently.
- Keep changes focused. Preserve other people's uncommitted work.
- Implementer records behavior changes, checks and limitations in the pull request template.
- Reviewer independently reproduces the main flow and reports findings with file/line, impact and reproduction. Do not claim review by the other agent unless it actually happened.
- Address findings before handing the change back to the user for merging. No automatic merges or paid AI CI calls.
- Never commit API keys, tokens, local .env files, or private task data.

## Merging to `main`
`main` is what gets deployed and what both agents start from, so it only moves through a reviewed pull request.
- **Never push to `main` directly**, and never force-push it. Undo a bad merge with a revert PR.
- **Merge only when all of these hold on the PR's current head commit:**
  1. CI is green (`check` and `server` jobs).
  2. The **other** agent has reviewed every commit since the last reviewed one, and the PR's *Cross-agent review* section names the reviewed SHA. A commit pushed after the review, even a docs-only one, needs its own review.
  3. No blocking findings are open; non-blocking ones are fixed or listed under *Next up* in `docs/HANDOFF.md`.
  4. The branch is up to date with `main` and has no conflicts. If `main` moved, merge `main` into the branch (don't rebase a branch someone else has reviewed) and let CI re-run.
  5. The PR is out of draft, and the user has approved the merge. Agents don't merge on their own initiative.
- **Merge method: "Create a merge commit".** Squash and rebase rewrite SHAs, which breaks the reviewed-commit references in PRs and `docs/HANDOFF.md`.
- **Stacked work:** a PR built on another unmerged PR targets that PR's branch, not `main`. When the lower PR merges, retarget the upper one to `main`.
- **After merging:**
  - Delete the merged branch.
  - Close any PR it superseded, with a comment linking the merge.
  - Record the new `main` SHA in `docs/HANDOFF.md`.
  - Start the next piece of work from a fresh branch off the latest `main`.

## Validation
Run `npm run check` (frontend) and, after `npm install`, `npm run check:server` (typecheck + tests; no API keys or paid calls). Serve with `npm run dev` (server + dashboard on http://localhost:8787) or `npm run dev:static` (dashboard only) and verify the affected interactions in a browser.
For task changes, cover available → working → needs review → approved/available; rejection/revision; stopped tasks; and invalid assignments. Keep keyboard, touch and narrow-screen behavior usable.
