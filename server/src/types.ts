// Shared data model for the office. The web app imports these as types only,
// so keep this file free of runtime imports.

export type ProviderId = "anthropic" | "openai" | "external";

/** "review" means the agent has finished work waiting for the manager's approval. */
export type AgentStatus = "idle" | "working" | "review" | "waiting" | "offline";

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  provider: ProviderId;
  model: string;
  /** Emoji used as the agent's avatar at their desk. */
  avatar: string;
  systemPrompt: string;
  /** Claude only: output_config.effort for this agent. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

export interface AgentState extends AgentConfig {
  status: AgentStatus;
  /** True when the provider has no API key (or MOCK_PROVIDERS is set). */
  mock: boolean;
  currentTaskId: string | null;
  /** What the agent is writing right now (reset per step). */
  liveOutput: string;
  /** Free-form status line, mainly for external agents (Codex, Claude Code). */
  activity: string | null;
  stats: AgentStats;
  lastActiveAt: string | null;
}

export interface AgentStats {
  stepsCompleted: number;
  stepsFailed: number;
  inputTokens: number;
  outputTokens: number;
}

export type StepStatus = "pending" | "working" | "done" | "failed" | "skipped";

export interface TaskStep {
  agentId: string;
  /** Steps with the same stage index run in parallel. */
  stage: number;
  status: StepStatus;
  output: string;
  /** The output this step produced before the latest revision request. */
  previousOutput: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  inputTokens: number;
  outputTokens: number;
}

/** Finished tasks wait in "review" until the manager approves them ("done") or asks for a revision. */
export type TaskStatus = "queued" | "in_progress" | "review" | "done" | "failed" | "cancelled";

export interface Task {
  id: string;
  title: string;
  prompt: string;
  workflowId: string | null;
  status: TaskStatus;
  /** 0-100, derived from step progress. */
  progress: number;
  steps: TaskStep[];
  /** Revision requests from the manager, oldest first. */
  feedback: string[];
  createdAt: string;
  finishedAt: string | null;
}

/**
 * A workflow is a list of stages. Agents inside a stage work in parallel;
 * each stage sees the outputs of every earlier stage.
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  stages: string[][];
}

export interface ActivityEntry {
  id: string;
  at: string;
  agentId: string | null;
  taskId: string | null;
  message: string;
}

export interface OfficeSnapshot {
  agents: AgentState[];
  tasks: Task[];
  workflows: Workflow[];
  activity: ActivityEntry[];
}

export type OfficeEvent =
  | { type: "snapshot"; snapshot: OfficeSnapshot }
  | { type: "agent"; agent: AgentState }
  | { type: "task"; task: Task }
  | { type: "delta"; agentId: string; taskId: string; text: string }
  | { type: "activity"; entry: ActivityEntry };

export interface CreateTaskInput {
  title?: string;
  prompt: string;
  workflowId?: string;
  /** Ad-hoc stages; used when workflowId is not given. */
  stages?: string[][];
}

/** Payload external coding agents (Codex, Claude Code) POST to report activity. */
export interface ExternalReport {
  agentId: string;
  name?: string;
  kind?: "claude-code" | "codex" | "other";
  /** "offline" takes the agent off the office floor. */
  status?: "working" | "idle" | "waiting" | "offline";
  message?: string;
}
