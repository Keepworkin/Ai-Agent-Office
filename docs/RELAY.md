# Automatic development relay

Daniel (the owner) authorizes Codex and Claude Code to coordinate routine implementation and review directly through this repository. Don't ask him to copy prompts, screenshots or status between agents. The merge rules still apply: **only he approves merges to `main`** (see "Merging to `main`" in `AGENTS.md`).

This is the single relay protocol. The files it uses:
- `docs/HANDOFF.md` opens with the **▶ Next action** block: who acts next and exactly what to do.
- `docs/PROGRESS.md` is the **single progress tracker**: done, in progress and remaining, plus a log of every PR with its UI changes. Don't create a second tracker.
- **The relay board, issue Keepworkin/Ai-Agent-Office#6**, is the single live record of who owns what. Every `CLAIM`, `RELEASE` and `Relay handoff` is posted there, newest last. It stays open even when no PR is.
- PR comments carry reviews. Mirror the handoff that goes with a review on the board.

## Ownership and completion (no duplicate work)

**One owner per task, one task per agent.** A task is one "Next up" item, one review of an exact SHA, or one set of review fixes. Its state is the **latest board comment about it**:

| State | Set by | Who may touch the task |
|---|---|---|
| `open` | listed in "Next up", no live claim | anyone, after posting a `CLAIM` |
| `claimed` | a `CLAIM` on the board | **only the claimant** |
| `ready_for_review` | the implementer's done handoff | **only the named reviewer** (the implementer stops) |
| `changes_requested` | the reviewer's done handoff | **only the implementer**, fixing exactly the listed findings |
| `ready_for_user_merge` | the reviewer's "no findings" handoff | **only the owner**, who merges |
| `done` | merged to `main` | nobody; ticked in `PROGRESS.md` by the next implementation |

**Claim rules:**
- **Check before claiming.** Fetch, then read the board's newest comments, the open PRs, and the remote `codex/*` and `claude/*` branches. Never start something that's already claimed, already in an open PR, or already on a branch.
- **Claims never expire by time.** A claim ends only with the claimant's done handoff, a `RELEASE`, or the owner reassigning the task. If an agent runs out of usage mid-task, the claim stands; the other agent works on something else.
- **If two claims collide**, the earlier comment wins. The later agent posts `RELEASE`, stops, and leaves any partial work on its own branch.
- **Parallel work** is fine only on different "Next up" items, each with its own claim and its own branch, and never on the same files. Put the files in the claim's `Scope`.
- **Never fix the other agent's branch.** Report findings; the implementer fixes them. The only exception is merging its commit into your own branch when its PR targets your branch (a stacked PR), after claiming that on the board.

**Definition of done**: a task is complete only when every box for its type is true.
- **Implementation or fix:**
  1. Code pushed to your own branch.
  2. `npm run check` (and `npm run check:server` if `server/` changed) pass locally.
  3. The main flow was verified in the browser if the UI changed.
  4. `docs/PROGRESS.md` and the ▶ Next action block were updated in the same push.
  5. The PR was opened or updated with the template filled in.
  6. A `Relay handoff` with `Status: ready_for_review`, the **exact head SHA** and the named reviewer was posted on the board.
- **Review:**
  1. A review posted on the PR naming the **exact SHA** reviewed, with a verdict: "no findings", or findings with severity, file/line and a repro.
  2. A `Relay handoff` on the board with `changes_requested` (owner: the implementer) or `ready_for_user_merge` (owner: User).
  3. No commits.
- **"Next up" item:** done only when its PR is merged into `main`. Until then it's `ready_for_review` or later, **not** done.

**When you're done, stop.** After posting your done handoff, your turn is over. Don't polish, extend or "quickly fix" that task again unless a new handoff makes you its owner. With usage left, claim the next `open` item instead. If nothing is `open`, say so and wait.

## Every wake-up

1. Fetch remote refs. Read the latest open PR heads, comments, reviews and CI, then `AGENTS.md` and `docs/HANDOFF.md` from the newest relay branch (not a stale local copy or `main`). Remote heads and posted reviews supersede stale notes.
2. Find the current next action: the newest `Relay handoff` on the relay board (issue #6). If the ▶ Next action block or a PR comment is newer, use that and correct the board.
   - **You own it**, or it permits either agent: do it now, without asking the owner to confirm. That covers reviewing, fixing findings and starting the next build item.
   - **The other agent owns it:** don't do its step. Say in one line that it's the other agent's turn.
   - **"User" owns it** (e.g. merge approval): say so once, then take the next "Next up" build item only if it doesn't conflict and nobody has claimed it.
   - **Already completed for that exact SHA:** don't repeat it.
3. **Claim before implementing:** post a `CLAIM` on the board, following "Ownership and completion" above.
4. **Review the other agent's exact commit.** Fixes go back to the implementing agent, and a new commit needs review again. Never claim the other agent reviewed something without its posted review.
5. When your task is done, continue to the next authorized item only when its dependencies are met and nobody else has claimed it. Otherwise hand off and wait quietly.

## Before yielding

**After implementing:**
1. In the same change, update:
   - `docs/HANDOFF.md`: rewrite the ▶ Next action block for the next owner.
   - `docs/PROGRESS.md`: tick off finished items, move items between sections, and add or extend your PR's log entry with its commits and **its UI changes** (or "no UI changes").
2. Commit and push your own branch. Unpushed work is invisible to the other agent.
3. Post a `Relay handoff` with the exact resulting SHA on the board, and mirror it on the PR. A commit can't contain its own SHA.

**After a review only:** post the review on the PR and the `Relay handoff` on the board, and **don't make a docs commit just to acknowledge a review**, because that starts an endless review-of-review loop. The next implementation folds the result into the notes and the tracker.

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
