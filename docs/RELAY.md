# Automatic development relay

Daniel authorizes Codex and Claude to coordinate routine implementation and review directly through this repository. Do not ask him to copy prompts, screenshots or status between agents. Existing merge-approval rules still apply.

## Every wake-up

1. Fetch remote refs. Read the latest open PR heads, comments, reviews, CI, AGENTS.md and docs/HANDOFF.md. Remote head and review records supersede stale local notes.
2. Find the latest `Relay handoff` comment on the active PR. Act only if you are its next owner, or the handoff explicitly permits either agent. If it has already been completed for that SHA, do not repeat it.
3. Before implementation, post a claim naming your agent, branch, base SHA and task. Recheck for another claim before editing. Do not treat an old claim as expired just because a timer elapsed: inspect newer comments/commits and resolve conflicts through the PR.
4. Review the other agent's exact commit. Fixes return to the implementing agent; a new commit needs review again. Never claim the other agent reviewed work without its posted review.
5. If assigned work is complete, continue to the next authorized item only when dependencies are satisfied and nobody else has claimed it. Otherwise hand off and wait quietly.

## Before yielding

For implementation: update docs/HANDOFF.md with the status, next owner/action, checks and blockers in the same implementation change; commit and push your own branch. Then post the exact resulting SHA in a PR comment (a commit cannot contain its own SHA).

For review only: post the review and update PR metadata. Do not create an extra docs commit just to acknowledge a review. That creates an endless review-of-review loop. The next implementation folds the result into the notes.

Use this comment format after each completed turn:

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

End every user-facing update with clear next steps and owners. Notify Daniel only for meaningful completed milestones, blockers requiring his decision, or merge approval. No repeated unchanged updates.

## Wake-up mechanisms and limits

- Codex: an active thread heartbeat named `Agent Office development relay` was created on 2026-09-30 to check every 30 minutes. It inspects current state before acting; it is not a promise of instant execution.
- Claude: use its existing PR watcher/check-in to inspect the latest relay comment and continue assigned work. Claude must confirm that its watcher is active; Codex cannot create or verify a Claude-side scheduler through its own automation tool.
- Notes and GitHub comments communicate state; they do not themselves wake an inactive agent. If a watcher is unavailable or a session lacks quota, report that concrete limitation instead of claiming automatic execution.
- Never add paid API-backed CI or model runners to work around an inactive session. No automatic merges, deployment, branch deletion or real provider calls without the corresponding user authorization.

## Current transition

PR #4 contains the workflow picker and Claude's disclosure fix `97b954661a68f661350098c913ffb362b37f2c02` (fetch to check for newer commits).

1. Codex reviews that fix: live disclaimer must describe real provider calls; workflow stages must survive SSE updates; static mode retains demo text.
2. Claude reviews the separate `codex/relay-protocol` documentation PR and confirms its own watcher will consume these handoffs.
3. After reviews and CI pass, Daniel approves merges. No automatic merge.
4. Following merge, the next implementing agent claims responsive name-tag spacing on a fresh branch off main; the other agent reviews it.
