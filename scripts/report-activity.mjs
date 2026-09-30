#!/usr/bin/env node
// Reports a coding agent's activity to the office, which puts its robot in a suite on the map (see docs/AGENT-DESKS.md).
//
//   node scripts/report-activity.mjs --agent codex|claude-code [--status working|idle|waiting|offline] [--message "…"]
//   node scripts/report-activity.mjs --claude-hook               Claude Code hook: reads the hook event from stdin
//   node scripts/report-activity.mjs --codex-notify '<json>'     Codex `notify`: the event JSON is the last argument
//
// OFFICE_URL sets the office server (default http://localhost:8787).
// It never fails the calling tool: problems go to stderr and the exit code is always 0. It gives up after 1.5 s,
// and it never sends prompt or reply text, only a short generic status line.

const officeUrl = (process.env.OFFICE_URL || 'http://localhost:8787').replace(/\/$/, '');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined; };

// Claude Code hook events → office status. Events not listed here aren't reported.
const claudeEvents = {
  SessionStart: ['idle', 'Session started'],
  UserPromptSubmit: ['working', 'Working on a prompt'],
  Notification: ['waiting', 'Waiting for your input'],
  Stop: ['idle', 'Finished; waiting for the next prompt'],
  SessionEnd: ['offline', 'Session ended'],
};

async function readStdin() {
  if (process.stdin.isTTY) return '';
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

async function buildReport() {
  if (args.includes('--claude-hook')) {
    const event = JSON.parse((await readStdin()) || '{}');
    const mapped = claudeEvents[event.hook_event_name];
    if (!mapped) return null;
    return { agentId: 'claude-code', kind: 'claude-code', status: mapped[0], message: mapped[1] };
  }
  if (args.includes('--codex-notify')) {
    const event = JSON.parse(args[args.length - 1] || '{}');
    if (event.type !== 'agent-turn-complete') return null;
    return { agentId: 'codex', kind: 'codex', status: 'idle', message: 'Finished a turn; waiting for the next prompt' };
  }
  const kind = option('--agent');
  if (kind !== 'codex' && kind !== 'claude-code') throw new Error('Pass --agent codex or --agent claude-code (or --claude-hook / --codex-notify).');
  const status = option('--status') || 'working';
  if (!['working', 'idle', 'waiting', 'offline'].includes(status)) throw new Error(`Unknown --status ${status}`);
  return { agentId: kind, kind, status, message: option('--message')?.slice(0, 200) };
}

try {
  const report = await buildReport();
  if (report) {
    const response = await fetch(officeUrl + '/api/external/report', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(report),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error(`office answered ${response.status}: ${await response.text()}`);
  }
} catch (error) {
  console.error(`report-activity: ${error.message}`);
}
