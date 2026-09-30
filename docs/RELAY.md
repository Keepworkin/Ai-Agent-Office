# Automatic development relay

Daniel (the owner) authorizes Codex and Claude Code to coordinate routine implementation and review directly through this repository. Don't ask him to copy prompts, screenshots or status between agents. The merge rules still apply: **only he approves merges to `main`** (see "Merging to `main`" in `AGENTS.md`).

This is the single relay protocol. The files it uses:
- **The relay board, issue Keepworkin/Ai-Agent-Office#6, is the only authority on who owns a task.** Every `CLAIM`, `RELEASE`, `BLOCKED` and `Relay handoff` is posted there, newest last. It stays open even when no PR is.
- `docs/HANDOFF.md` (▶ Next action) and PR comments are **evidence and proposals only**. They can't transfer or override ownership. If they disagree with the board, the board wins until someone posts an explicit transition on it.
- `docs/PROGRESS.md` is the **single progress tracker**: done, in progress and remaining, plus a log of every PR with its UI changes. Don't create a second tracker.
- PR comments carry reviews. Post the handoff that goes with a review on the board.

## Ownership and completion (no duplicate work)

**Task IDs.** Every task has a stable ID, used in every `CLAIM`, `RELEASE`, `BLOCKED` and handoff, so that rewording a task can't create a second owner:
- **"Next up" items:** `T<n>-<slug>`, as listed in `docs/PROGRESS.md` (e.g. `T1-name-tags`).
- **Reviews:** `REVIEW-PR<n>@<sha7>`, one per exact head (e.g. `REVIEW-PR4@d741ef5`).
- **Review fixes:** `FIX-PR<n>-<review id>` (e.g. `FIX-PR4-5367683425`).
- **Owner requests that aren't on the list:** `REQ-<slug>`, added to `PROGRESS.md` in the same change.

**One owner per task ID, one active task per agent.** A task's state is the **latest board comment with its ID**. Only these transitions change it:

| State | Entered by (board comment) | Who may touch the task |
|---|---|---|
| `open` | listed in "Next up"; no live claim | anyone, after posting a `CLAIM` |
| `claimed` | `CLAIM` | **only the claimant** |
| `blocked` | `BLOCKED` from the claimant: interrupted or stuck, with the partial pushed SHA and remaining work | **still only the claimant**, until it posts `RELEASE` or the owner reassigns the task |
| `ready_for_review` | the implementer's done handoff, naming the exact head SHA | **only the named reviewer**; the implementer stops |
| `changes_requested` | the reviewer's handoff listing findings | **only the implementer**, fixing exactly those findings under a `FIX-…` ID |
| `reviewed` | the reviewer's "no findings" handoff for the exact head | nobody edits. Check the merge gates below; any new commit sends it back to `ready_for_review` for the new head |
| `ready_for_user_merge` | a handoff stating **all merge gates pass** on the exact head | **only the owner**, who approves the merge |
| `integrated` | merged into another branch (e.g. a stacked PR into its base) | nobody. **Not done:** it's finished only when that branch reaches `main` |
| `done` | merged into `main` | nobody; ticked in `PROGRESS.md` by the next implementation |

**Merge gates** (required for `ready_for_user_merge`, all on the PR's **current head**):
1. CI green (`check` and `server`).
2. Every commit reviewed by the other agent, with the last review naming this exact head.
3. No open findings.
4. Up to date with `main`, no conflicts.

The PR leaves draft when the owner approves. **A new commit clears `reviewed` and `ready_for_user_merge`:** the new head needs its own review and a fresh gate check.

**Claim rules:**
- **Check before claiming.** Fetch, then read the board's newest comments, the open PRs, and the remote `codex/*` and `claude/*` branches. Never start a task ID that's already claimed, already in an open PR, or already on a branch.
- **Re-read the board three times:** right after posting your `CLAIM`, before your first edit, and before you push. If an earlier live claim for the same ID (or overlapping `Scope`) appears, post `RELEASE` and stop.
- **Claims never expire by time.** A claim ends only with the claimant's done handoff, a `RELEASE`, or the owner reassigning the task on the board. If an agent runs out of usage mid-task, it posts `BLOCKED` (or it is treated as blocked), and the claim stands. The other agent works on something else.
- **If two claims collide**, the earlier board comment wins. The later agent posts `RELEASE`, stops, and leaves any partial work on its own branch.
- **Parallel work** is fine only on different task IDs, each with its own claim and branch, and never on the same files. Put the files in the claim's `Scope`.
- **Never fix the other agent's branch.** Report findings; the implementer fixes them. The only exception is merging its commit into your own branch when its PR targets your branch (a stacked PR), after claiming that on the board. That makes the task `integrated`, not `done`.

**Definition of done:** a turn is complete only when every box for its type is true.
- **Implementation or fix** → `ready_for_review`:
  1. Code pushed to your own branch.
  2. `npm run check` (and `npm run check:server` if `server/` changed) pass locally.
  3. The main flow was verified in the browser if the UI changed.
  4. `docs/PROGRESS.md` and the ▶ Next action block were updated in the same push.
  5. The PR was opened or updated with the template filled in.
  6. A `Relay handoff` with the task ID, `Status: ready_for_review`, the **exact head SHA** and the named reviewer was posted on the board.
- **Review** → `changes_requested` or `reviewed`:
  1. A review posted on the PR naming the **exact SHA** reviewed, with a verdict: "no findings", or findings with severity, file/line and a repro.
  2. A `Relay handoff` on the board: `changes_requested` (owner: the implementer), or `reviewed`, plus `ready_for_user_merge` only if every merge gate passes (owner: User).
  3. No commits.
- **"Next up" item:** `done` only when its PR is merged into `main`. `ready_for_review`, `reviewed`, `ready_for_user_merge` and `integrated` are all **not done**.

**When your turn is complete, stop.** After posting your done handoff, don't polish, extend or "quickly fix" that task unless a new board transition makes you its owner. With usage left, claim the next `open` task ID instead. If nothing is `open`, say so and wait.

## Every wake-up

1. Fetch remote refs. Read the relay board (issue #6) first, then the open PR heads, reviews and CI, then `AGENTS.md` and `docs/HANDOFF.md` from the newest relay branch.
2. **The newest board comment for each task ID decides who owns it.** HANDOFF blocks and PR comments are evidence only. If they suggest a different owner or a newer state, validate them against the board and the remote heads, and post an explicit board transition before acting on them.
   - **You own it:** do it now, without asking the owner to confirm.
   - **The other agent owns it:** don't touch it. Say in one line that it's the other agent's turn.
   - **"User" owns it** (merge approval): say so once, then take an `open` task ID only if it doesn't conflict and nobody has claimed it.
   - **Already completed for that exact SHA:** don't repeat it.
3. **Claim before implementing:** post a `CLAIM` on the board, following "Ownership and completion" above.
4. **Review the other agent's exact commit.** Fixes go back to the implementing agent, and a new commit needs review again. Never claim the other agent reviewed something without its posted review.
5. When your turn is complete, stop, or claim the next `open` task ID.

## Before yielding

**After implementing:**
1. In the same change, update:
   - `docs/HANDOFF.md`: rewrite the ▶ Next action block for the next owner.
   - `docs/PROGRESS.md`: tick off finished items, move items between sections, and add or extend your PR's log entry with its commits and **its UI changes** (or "no UI changes").
2. Commit and push your own branch. Unpushed work is invisible to the other agent.
3. Post a `Relay handoff` with the task ID and the exact resulting SHA on the board. A commit can't contain its own SHA.

**If interrupted** (usage running out mid-task): push what you have, then post `BLOCKED` with the partial SHA and the work that remains. The claim stays yours.

**After a review only:** post the review on the PR and the `Relay handoff` on the board, and **don't make a docs commit just to acknowledge a review**, because that starts an endless review-of-review loop. The next implementation folds the result into the notes and the tracker.

**Every time:** end your reply to the owner with clear **Next steps** and who owns each one. Notify him only for completed milestones, blockers that need his decision, or merge approval. Don't send repeated unchanged updates.

Board comment formats:

```text
CLAIM
Task ID:
Agent: Codex | Claude
Branch / base SHA:
Scope: files or areas you will touch
```

```text
BLOCKED
Task ID:
Agent:
Partial work: branch and pushed SHA
Remaining:
```

```text
RELEASE
Task ID:
Agent:
Reason / where any partial work is (branch, SHA):
```

```text
Relay handoff
Task ID:
Status: ready_for_review | changes_requested | reviewed | ready_for_user_merge | integrated | blocked
Completed by: Codex or Claude
PR / branch / exact head:
Completed and verified:
Merge gates (for reviewed or ready_for_user_merge): CI / all commits reviewed / no findings / up to date with main
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
