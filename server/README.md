# Agent Office — live server

Backend for the office. It runs agents on **Claude** (Anthropic SDK) and **ChatGPT** (OpenAI Responses API) and streams every step to the browser. API keys stay on the server.

## Run

```sh
cp .env.example .env   # add ANTHROPIC_API_KEY / OPENAI_API_KEY (optional)
npm install
npm run dev            # server on :8787, React office on :5173
```

A provider with no key runs in **mock mode**, so everything works offline. Set `MOCK_PROVIDERS=true` to force mock mode everywhere.

## How work flows

A **workflow** is a list of stages. Agents in the same stage work in parallel, and every stage sees the outputs of the stages before it.

| Workflow | Stages |
|---|---|
| Claude builds → ChatGPT reviews | Cody → Rex |
| ChatGPT researches → Claude builds | Gemma → Cody |
| Head to head | Cody + Gemma side by side → Clara compares |
| Full team | Clara → Gemma + Cody → Rex |

The roster and workflows live in `src/office/roster.ts`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/office` | Snapshot: agents, tasks, workflows, activity |
| GET | `/api/events` | Server-sent events: `snapshot`, then `agent`, `task`, `delta`, `activity` |
| POST | `/api/tasks` | `{ prompt, title?, workflowId? , stages? }` |
| POST | `/api/tasks/:id/cancel` | Cancel a running task |
| POST | `/api/external/report` | `{ agentId, kind: "codex" \| "claude-code", status?, message? }`: puts an external coding agent on the office floor |

Event and data shapes are in `src/types.ts`. Any UI (including the static `dist/` office) can use `/api/events`.

## Connect Codex & Claude Code

Report activity from any session:

```sh
curl -s -X POST localhost:8787/api/external/report -H 'content-type: application/json' \
  -d '{"agentId":"codex-1","kind":"codex","message":"Running tests"}'
```

You can wire this into Claude Code hooks or Codex's `notify` setting so their sessions show up automatically.

## Test

```sh
npm test         # orchestrator tests with a fake provider (no API calls)
npm run typecheck
```
