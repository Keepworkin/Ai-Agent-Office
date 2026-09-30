# Automatic development relay

Daniel (the owner) authorizes Codex and Claude Code to coordinate routine implementation and review directly through this repository. Don't ask him to copy prompts, screenshots or status between agents. The merge rules still apply: **only he approves merges to `main`** (see "Merging to `main`" in `AGENTS.md`).

This is the single relay protocol. The files it uses:
- `docs/HANDOFF.md` opens with the **▶ Next action** block: who acts next and exactly what to do.
- `docs/PROGRESS.md` is the **single progress tracker**: done, in progress and remaining, plus a log of every PR with its UI changes. Don't create a second tracker.
- PR comments in the `Relay handoff` format below mirror each handoff where reviews happen.

## Every wake-up

1. Fetch remote refs. Read the latest open PR heads, comments, reviews and CI, then `AGENTS.md` and `docs/HANDOFF.md` from the newest relay branch (not a stale local copy or `main`). Remote heads and posted reviews supersede stale notes.
2. Find the current next action: the latest `Relay handoff` comment on the active PR, or the ▶ Next action block if it's newer.
   - **You own it**, or it permits either agent: do it now, without asking the owner to confirm. That covers reviewing, fixing findings and starting the next build item.
   - **The other agent owns it:** don't do its step. Say in one line that it's the other agent's turn.
   - **"User" owns it** (e.g. merge approval): say so once, then take the next "Next up" build item only if it doesn't conflict and nobody has claimed it.
   - **Already completed for that exact SHA:** don't repeat it.
3. **Claim before implementing.** Post a comment naming your agent, branch, base SHA and task. Check for another claim before editing. An old claim doesn't expire just because time passed: look at newer comments and commits, and resolve conflicts on the PR.
4. **Review the other agent's exact commit.** Fixes go back to the implementing agent, and a new commit needs review again. Never claim the other agent reviewed something without its posted review.
5. When your task is done, continue to the next authorized item only when its dependencies are met and nobody else has claimed it. Otherwise hand off and wait quietly.

## Before yielding

**After implementing:**
1. In the same change, update:
   - `docs/HANDOFF.md`: rewrite the ▶ Next action block for the next owner.
   - `docs/PROGRESS.md`: tick off finished items, move items between sections, and add or extend your PR's log entry with its commits and **its UI changes** (or "no UI changes").
2. Commit and push your own branch. Unpushed work is invisible to the other agent.
3. Post a `Relay handoff` comment with the exact resulting SHA. A commit can't contain its own SHA.

**After a review only:** post the review and the `Relay handoff` comment on the PR, and **don't make a docs commit just to acknowledge a review**, because that starts an endless review-of-review loop. The next implementation folds the result into the notes and the tracker.

**Every time:** end your reply to the owner with clear **Next steps** and who owns each one. Notify him only for completed milestones, blockers that need his decision, or merge approval. Don't send repeated unchanged updates.

Comment format:

```text
Relay handoff
Status: ready_for_review | changes_requested | ready_for_user_merge | ready_for_implementation | blocked
Completed by: Codex or Claude
PR / branch / exact head:
Completed and verified:
Next owner:
Next action: one concrete task with acceptance criteria
Blockers / untested:
After completion: who does what next
User action: none, or the specific decision required
```

## Branches

- Each agent pushes only its own branches: `codex/<topic>` or `claude/<topic>`.
- To change the other agent's PR, open a PR that targets its branch, or post findings for it to fix.
- A stacked PR targets the branch below it. Once the lower PR merges, retarget the upper one to `main`.

## Wake-up mechanisms and limits

- **Codex:** a thread heartbeat named `Agent Office development relay`, created 2026-09-30, checks every 30 minutes. It inspects the current state before acting; it doesn't promise instant execution.
- **Claude Code:** event-driven. The Claude session subscribes to GitHub activity on every PR it opens or is asked to review, so reviews, comments, pushes and CI results wake it; a `Relay handoff` naming Claude is picked up when it's posted. While a PR waits, it also schedules check-ins, which stop after three quiet ones. **Limits:** it only works while that Claude session exists; it doesn't see PRs it isn't subscribed to; there's no fixed heartbeat.
- Notes and comments carry state, but they don't wake an agent that isn't running. If a watcher is unavailable or a session is out of quota, report that limitation rather than claiming the work will run automatically.
- Never add paid, API-backed CI or model runners to work around an inactive session. No automatic merges, deployments, branch deletions or real provider calls without the owner's authorization.
