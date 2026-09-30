# Agent Office — live server

Backend for the office. It runs the six teammates on **Claude** (Anthropic SDK) and **ChatGPT** (OpenAI Responses API) and streams every step to the browser. It also serves the dashboard in `../dist` on the same port. API keys stay on the server.

## Run (from the repo root)

```sh
cp .env.example .env   # add ANTHROPIC_API_KEY / OPENAI_API_KEY (optional)
npm install
npm run dev            # API + dashboard on http://localhost:8787
```

## Team

| Id | Name | Role | Runs on |
|---|---|---|---|
| `atlas` | Atlas | Research | ChatGPT |
| `nova` | Nova | Design | ChatGPT |
| `sage` | Sage | Analytics | ChatGPT |
| `byte` | Byte | Engineering | Claude |
| `quill` | Quill | Writing | Claude |
| `orbit` | Orbit | Operations | Claude |

Ids match the robots in `dist/app.js`. Models come from `CLAUDE_MODEL` (default `claude-opus-5-5`) and `OPENAI_MODEL` (default `gpt-5`).

A provider with no key runs in **mock mode**, so everything works offline. Set `MOCK_PROVIDERS=true` to force mock mode everywhere.

## How work flows

A **workflow** is a list of stages. Agents in the same stage work in parallel, and every stage sees the outputs of the stages before it.

| Workflow | Stages |
|---|---|
| Claude writes → ChatGPT checks | Quill → Sage |
| ChatGPT researches → Claude builds | Atlas → Byte |
| Head to head | Quill + Atlas side by side → Orbit compares |
| Full team | Atlas + Nova → Byte → Orbit |

When the last stage finishes, the task waits in **review** (its final-stage agents show `status: "review"`). Approve it, or request a revision: that re-runs only the final stage, which sees its previous draft and your feedback.

The roster and workflows live in `src/office/roster.ts`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/office` | Snapshot: agents, tasks, workflows, activity |
| GET | `/api/events` | Server-sent events: `snapshot`, then `agent`, `task`, `delta`, `activity` |
| POST | `/api/tasks` | `{ prompt, title?, workflowId? , stages? }` |
| POST | `/api/tasks/:id/approve` | Accept work in review |
| POST | `/api/tasks/:id/revise` | `{ feedback }`: re-run the final stage with feedback |
| POST | `/api/tasks/:id/cancel` | Cancel a running task |
| POST | `/api/external/report` | `{ agentId, kind: "codex" \| "claude-code" \| "other", status?: "working" \| "idle" \| "waiting" \| "offline", name?, message? }`: puts an external coding agent on the office floor. `agentId` is 1–64 letters, digits, `.`, `_` or `-`; anything else is rejected with 400 |

Event and data shapes are in `src/types.ts`. Any UI (including the static `dist/` office) can use `/api/events`.

## Connect Codex & Claude Code

Report activity from any session:

```sh
curl -s -X POST localhost:8787/api/external/report -H 'content-type: application/json' \
  -d '{"agentId":"codex-1","kind":"codex","message":"Running tests"}'
```

Or use `npm run report -- --agent codex --status working --message "Running tests"`. In live mode, Codex and Claude Code get a robot in Suite 03 and Suite 04 on the map. To report automatically from Claude Code hooks or Codex's `notify` setting (opt-in), see `docs/AGENT-DESKS.md`.

## Test

```sh
npm run check:server   # from the repo root: typecheck + orchestrator tests (fake provider, no API calls)
```
