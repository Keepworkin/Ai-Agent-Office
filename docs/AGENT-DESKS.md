# Desks for Codex and Claude Code

When the office server is running (`npm run dev`), the two lower suites on the map belong to the coding agents that build this project:

- **Suite 03: Codex**, next to the ChatGPT wing.
- **Suite 04: Claude Code**, next to the Claude wing.

A suite stays "For Lease" until its tool reports in. After that, the tool's robot works at a suite desk while it's busy and wanders its suite while idle. The sign shows who works there. Clicking the robot shows the last reported status. The office can't assign tasks to these agents; it only shows what they report. A robot leaves when its tool reports `offline`.

The static demo (`npm run dev:static`) has no server, so the suites stay "For Lease" there.

## How reporting works

`scripts/report-activity.mjs` posts a short status to `POST /api/external/report` (see `server/README.md`):

```sh
npm run report -- --agent codex --status working --message "Refactoring the router"
npm run report -- --agent claude-code --status idle
npm run report -- --agent codex --status offline      # leave the office
```

`--status` is `working`, `idle`, `waiting` or `offline` (default `working`). The server accepts only those statuses and plain agent ids (1–64 letters, digits, `.`, `_` or `-`), because ids and statuses end up in the dashboard's markup. `OFFICE_URL` points it at another server (default `http://localhost:8787`).

It is safe to call from a tool's hooks:

- **It never fails the tool.** Errors go to stderr and it always exits 0.
- **It never holds the tool up for long.** It gives up after 1.5 s when no office is running.
- **It never sends prompt or reply text** from hook events, only a generic status line such as "Working on a prompt".

## Automatic reporting (opt-in)

Nothing reports automatically until you turn it on. These settings are personal, so they aren't committed to the repo.

### Claude Code

Add these hooks to `.claude/settings.local.json` in your checkout (create the file if needed), or to `~/.claude/settings.json` for every project:

```json
{
  "hooks": {
    "SessionStart":     [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/report-activity.mjs\" --claude-hook" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/report-activity.mjs\" --claude-hook" }] }],
    "Notification":     [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/report-activity.mjs\" --claude-hook" }] }],
    "Stop":             [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/report-activity.mjs\" --claude-hook" }] }],
    "SessionEnd":       [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/report-activity.mjs\" --claude-hook" }] }]
  }
}
```

| Hook event | Office status | Message |
|---|---|---|
| `SessionStart` | idle | Session started |
| `UserPromptSubmit` | working | Working on a prompt |
| `Notification` | waiting | Waiting for your input |
| `Stop` | idle | Finished; waiting for the next prompt |
| `SessionEnd` | offline (robot leaves) | Session ended |

Other hook events are ignored, so tool calls don't flood the activity feed.

### Codex

Codex can run a program after each turn through `notify` in `~/.codex/config.toml`. It passes the event as JSON in the last argument:

```toml
notify = ["node", "/absolute/path/to/Ai-Agent-Office/scripts/report-activity.mjs", "--codex-notify"]
```

This reports `idle` ("Finished a turn; waiting for the next prompt") on each `agent-turn-complete` event.

Codex has no matching "turn started" notification. To show Codex as busy, report it yourself, for example at the start of a relay turn:

```sh
npm run report -- --agent codex --status working --message "Reviewing PR #9"
```

If your Codex version's `notify` format differs, use that plain form.

## Limits

- **The office has to be reachable from the tool.** A tool running in a cloud session can't reach a server on your own computer, and vice versa.
- **One robot per tool.** Every Claude Code session reports as `claude-code` and every Codex session as `codex`, so parallel sessions share one robot.
- **A crashed session can leave its robot behind.** If a session ends without its `SessionEnd` hook (or a final `offline` report), the robot stays at its last status until the next report or a server restart.
- **Only these two kinds get a desk.** Other external agents (`kind` other than `codex` or `claude-code`) are still logged by the server but aren't placed on the map.
