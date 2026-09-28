# Codex + Claude Code handoffs

Use this same repository in both tools, with a separate checkout/branch for each active agent. The workflow is manual until an explicit automation is added.

1. Write a small task with acceptance criteria in a GitHub issue or prompt.
2. Assign one tool as implementer and the other as reviewer. Alternate roles freely.
3. Implement on `codex/<topic>` or `claude/<topic>`, run checks and open a pull request.
4. Give the reviewing tool the pull request URL and exact commit SHA. Ask for correctness, regressions, task-state consistency, accessibility and security review.
5. Reviewer reports concrete findings, checks performed and untested areas. If no findings, say so without implying exhaustive correctness.
6. Implementer fixes findings, reruns affected checks, and requests re-review of the new commit.
7. The user merges when satisfied.

## Implementation prompt

“Read AGENTS.md. Implement [task] on your own branch. Acceptance criteria: [criteria]. Run npm run check and verify the main browser flow. Prepare a PR with validation and limitations for the other agent to review.”

## Review prompt

“Read AGENTS.md. Independently review [PR URL] at [commit SHA]. Reproduce the key behavior and inspect the diff. Report actionable findings with file/line, severity and reproduction; state what was tested and what remains unverified. Do not change code during the review.”

Repository instructions do not install or authenticate either tool, trigger paid model runs, or enforce branch protections. GitHub checks validate source; they are not a substitute for the independent agent review.
