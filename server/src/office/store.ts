import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ActivityEntry, AgentState, Task } from "../types.js";

/**
 * What survives a server restart: tasks, the activity log and each office agent's stats. Live output streams,
 * queues and external agents (which re-register on their next report) don't; see Office.restore.
 */
export interface SavedOffice {
  version: 1;
  savedAt: string;
  tasks: Task[];
  activity: ActivityEntry[];
  stats: Record<string, AgentState["stats"]>;
}

export interface OfficeStore {
  load(): SavedOffice | null;
  save(state: SavedOffice): void;
}

/** Keeps the office in one JSON file. Task prompts and outputs are private, so the file stays out of git. */
export function fileStore(file: string, warn: (message: string) => void = console.warn): OfficeStore {
  return {
    load() {
      if (!existsSync(file)) return null;
      try {
        const data = JSON.parse(readFileSync(file, "utf8"));
        const problem = invalidSavedOffice(data);
        if (problem) throw new Error(problem);
        return data as SavedOffice;
      } catch (err) {
        // Keep the unreadable file for inspection and start fresh rather than refusing to boot.
        const aside = `${file}.unreadable-${Date.now()}`;
        try { renameSync(file, aside); } catch { /* leave it in place */ }
        warn(`Office data in ${file} couldn't be read (${(err as Error).message}); moved it to ${aside} and started fresh.`);
        return null;
      }
    },
    save(state) {
      mkdirSync(path.dirname(file), { recursive: true });
      // Write then rename, so a crash mid-write never leaves half a file behind.
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, JSON.stringify(state));
      renameSync(tmp, file);
    },
  };
}

// ---- shape checks -----------------------------------------------------------
// Valid JSON can still hold records restore and the dashboard can't use (a task without steps, a number where text
// belongs). Anything off is rejected here, so the file goes down the same move-aside path as a syntax error instead
// of crashing the server on every start.

const TASK_STATUSES = ["queued", "in_progress", "review", "done", "failed", "cancelled"];
const STEP_STATUSES = ["pending", "working", "done", "failed", "skipped"];
const STAT_FIELDS = ["stepsCompleted", "stepsFailed", "inputTokens", "outputTokens"];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown) => typeof v === "string";
const isNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isStringOrNull = (v: unknown) => v === null || isString(v);

function invalidStep(step: unknown): string | null {
  if (!isObject(step)) return "a step isn't an object";
  if (!isString(step.agentId) || !isNumber(step.stage) || !STEP_STATUSES.includes(step.status as string)) {
    return "a step has a bad agentId, stage or status";
  }
  if (!isString(step.output) || !isStringOrNull(step.previousOutput) || !isStringOrNull(step.error)) {
    return "a step has bad output or error text";
  }
  if (!isStringOrNull(step.startedAt) || !isStringOrNull(step.finishedAt) || !isNumber(step.inputTokens) || !isNumber(step.outputTokens)) {
    return "a step has bad times or token counts";
  }
  return null;
}

function invalidTask(task: unknown): string | null {
  if (!isObject(task)) return "a task isn't an object";
  if (!isString(task.id) || !isString(task.title) || !isString(task.prompt) || !isStringOrNull(task.workflowId)) {
    return "a task has a bad id, title, prompt or workflowId";
  }
  if (!TASK_STATUSES.includes(task.status as string) || !isNumber(task.progress)) return "a task has a bad status or progress";
  if (!Array.isArray(task.feedback) || !task.feedback.every(isString)) return "a task has bad feedback";
  if (!isString(task.createdAt) || !isStringOrNull(task.finishedAt)) return "a task has bad times";
  if (!Array.isArray(task.steps) || task.steps.length === 0) return "a task has no steps";
  for (const step of task.steps) {
    const problem = invalidStep(step);
    if (problem) return problem;
  }
  return null;
}

/** Why `data` can't be restored, or null when it can. */
export function invalidSavedOffice(data: unknown): string | null {
  if (!isObject(data) || data.version !== 1) return "unrecognised format";
  if (!Array.isArray(data.tasks) || !Array.isArray(data.activity) || !isObject(data.stats)) return "missing tasks, activity or stats";
  const ids = new Set<string>();
  for (const task of data.tasks) {
    const problem = invalidTask(task);
    if (problem) return problem;
    const id = (task as { id: string }).id;
    if (ids.has(id)) return "two tasks share an id";
    ids.add(id);
  }
  for (const entry of data.activity) {
    if (!isObject(entry) || !isString(entry.id) || !isString(entry.at) || !isString(entry.message)
      || !isStringOrNull(entry.agentId) || !isStringOrNull(entry.taskId)) {
      return "an activity entry is malformed";
    }
  }
  for (const stats of Object.values(data.stats)) {
    if (!isObject(stats) || !STAT_FIELDS.every((field) => isNumber(stats[field]))) return "agent stats are malformed";
  }
  return null;
}
