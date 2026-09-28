import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { ProviderRegistry } from "../providers/index.js";
import type {
  ActivityEntry,
  AgentConfig,
  AgentState,
  CreateTaskInput,
  ExternalReport,
  OfficeEvent,
  OfficeSnapshot,
  Task,
  TaskStep,
  Workflow,
} from "../types.js";

const MAX_ACTIVITY = 200;
const MAX_TASKS = 100;

export class Office {
  private agents = new Map<string, AgentState>();
  private tasks = new Map<string, Task>();
  private workflows = new Map<string, Workflow>();
  private activity: ActivityEntry[] = [];
  /** Per-agent promise chain so each agent works one step at a time. */
  private queues = new Map<string, Promise<unknown>>();
  private aborts = new Map<string, AbortController>();
  private events = new EventEmitter();

  constructor(
    roster: AgentConfig[],
    workflows: Workflow[],
    private readonly providers: ProviderRegistry,
  ) {
    this.events.setMaxListeners(0);
    for (const config of roster) this.addAgent(config);
    for (const wf of workflows) this.workflows.set(wf.id, wf);
  }

  // ---- reads --------------------------------------------------------------

  snapshot(): OfficeSnapshot {
    return {
      agents: [...this.agents.values()],
      tasks: [...this.tasks.values()].reverse(),
      workflows: [...this.workflows.values()],
      activity: [...this.activity],
    };
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  subscribe(listener: (event: OfficeEvent) => void): () => void {
    this.events.on("event", listener);
    return () => this.events.off("event", listener);
  }

  // ---- tasks --------------------------------------------------------------

  createTask(input: CreateTaskInput): Task {
    const prompt = input.prompt?.trim();
    if (!prompt) throw new OfficeError("prompt is required");

    const workflow = input.workflowId ? this.workflows.get(input.workflowId) : undefined;
    if (input.workflowId && !workflow) throw new OfficeError(`unknown workflow: ${input.workflowId}`);
    const stages = workflow?.stages ?? input.stages;
    if (!stages?.length || stages.some((s) => !s.length)) {
      throw new OfficeError("a workflowId or non-empty stages are required");
    }
    for (const agentId of stages.flat()) {
      const agent = this.agents.get(agentId);
      if (!agent) throw new OfficeError(`unknown agent: ${agentId}`);
      if (agent.provider === "external") throw new OfficeError(`${agent.name} is an external agent and can't take tasks`);
    }

    const task: Task = {
      id: randomUUID(),
      title: input.title?.trim() || prompt.split("\n")[0].slice(0, 80),
      prompt,
      workflowId: workflow?.id ?? null,
      status: "queued",
      steps: stages.flatMap((agents, stage) => agents.map((agentId) => newStep(agentId, stage))),
      createdAt: now(),
      finishedAt: null,
    };
    this.tasks.set(task.id, task);
    this.trimTasks();
    this.emitTask(task);
    this.log(`New task: "${task.title}"`, { taskId: task.id });

    const controller = new AbortController();
    this.aborts.set(task.id, controller);
    void this.runTask(task, controller.signal);
    return task;
  }

  cancelTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new OfficeError(`unknown task: ${id}`, 404);
    if (task.status === "queued" || task.status === "in_progress") {
      this.aborts.get(id)?.abort();
      task.status = "cancelled";
      task.finishedAt = now();
      for (const step of task.steps) {
        if (step.status === "pending" || step.status === "working") step.status = "skipped";
      }
      this.emitTask(task);
      this.log(`Task cancelled: "${task.title}"`, { taskId: id });
    }
    return task;
  }

  /** Resolves when the task reaches a terminal state. Useful in tests and scripts. */
  waitForTask(id: string): Promise<Task> {
    const done = (t: Task | undefined) => t && ["done", "failed", "cancelled"].includes(t.status);
    const existing = this.tasks.get(id);
    if (done(existing)) return Promise.resolve(existing!);
    return new Promise((resolve) => {
      const off = this.subscribe((event) => {
        if (event.type === "task" && event.task.id === id && done(event.task)) {
          off();
          resolve(event.task);
        }
      });
    });
  }

  private async runTask(task: Task, signal: AbortSignal) {
    const stageCount = Math.max(...task.steps.map((s) => s.stage)) + 1;
    try {
      for (let stage = 0; stage < stageCount; stage++) {
        if (signal.aborted) return;
        const steps = task.steps.filter((s) => s.stage === stage);
        const context = this.buildPrompt(task, stage);
        await Promise.all(steps.map((step) => this.enqueue(step.agentId, () => this.runStep(task, step, context, signal))));
        if (signal.aborted) return;
        if (steps.every((s) => s.status === "failed")) {
          throw new OfficeError(`every agent in stage ${stage + 1} failed`);
        }
      }
      task.status = "done";
      this.log(`Task finished: "${task.title}"`, { taskId: task.id });
    } catch (err) {
      if (signal.aborted) return;
      task.status = "failed";
      for (const step of task.steps) if (step.status === "pending") step.status = "skipped";
      this.log(`Task failed: "${task.title}" — ${errorMessage(err)}`, { taskId: task.id });
    } finally {
      this.aborts.delete(task.id);
      if (!signal.aborted) {
        task.finishedAt = now();
        this.emitTask(task);
      }
    }
  }

  private async runStep(task: Task, step: TaskStep, prompt: string, signal: AbortSignal) {
    if (signal.aborted) return;
    const agent = this.agents.get(step.agentId)!;
    const { provider } = this.providers(agent.provider);

    if (task.status === "queued") task.status = "in_progress";
    step.status = "working";
    step.startedAt = now();
    this.emitTask(task);
    this.updateAgent(agent, { status: "working", currentTaskId: task.id, liveOutput: "", activity: task.title });
    this.log(`${agent.name} started on "${task.title}"`, { agentId: agent.id, taskId: task.id });

    try {
      const result = await provider.run({
        agent,
        prompt,
        signal,
        onDelta: (text) => {
          agent.liveOutput += text;
          step.output += text;
          this.emit({ type: "delta", agentId: agent.id, taskId: task.id, text });
        },
      });
      step.output = result.text;
      step.inputTokens = result.inputTokens;
      step.outputTokens = result.outputTokens;
      step.status = "done";
      agent.stats.stepsCompleted++;
      agent.stats.inputTokens += result.inputTokens;
      agent.stats.outputTokens += result.outputTokens;
      this.log(`${agent.name} finished their part of "${task.title}"`, { agentId: agent.id, taskId: task.id });
    } catch (err) {
      if (signal.aborted) {
        step.status = "skipped";
      } else {
        step.status = "failed";
        step.error = errorMessage(err);
        agent.stats.stepsFailed++;
        this.log(`${agent.name} hit an error: ${step.error}`, { agentId: agent.id, taskId: task.id });
      }
    } finally {
      step.finishedAt = now();
      this.emitTask(task);
      this.updateAgent(agent, { status: "idle", currentTaskId: null, activity: null });
    }
  }

  /** The original request plus everything earlier stages produced. */
  private buildPrompt(task: Task, stage: number): string {
    const earlier = task.steps.filter((s) => s.stage < stage && s.status === "done");
    if (!earlier.length) return task.prompt;
    const handoffs = earlier.map((s) => {
      const a = this.agents.get(s.agentId)!;
      return `### From ${a.name} (${a.role}, ${providerLabel(a.provider)})\n\n${s.output}`;
    });
    return [
      "## Request",
      task.prompt,
      "",
      "## Work your teammates have done so far",
      ...handoffs,
      "",
      "## Your turn",
      "Build on your teammates' work according to your role.",
    ].join("\n");
  }

  private enqueue<T>(agentId: string, job: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(agentId) ?? Promise.resolve();
    const next = prev.then(job, job);
    this.queues.set(agentId, next.catch(() => undefined));
    return next;
  }

  private trimTasks() {
    const finished = [...this.tasks.values()].filter((t) => t.finishedAt);
    while (this.tasks.size > MAX_TASKS && finished.length) this.tasks.delete(finished.shift()!.id);
  }

  // ---- agents -------------------------------------------------------------

  addAgent(config: AgentConfig): AgentState {
    const { mock } = this.providers(config.provider);
    const agent: AgentState = {
      ...config,
      status: config.provider === "external" ? "offline" : "idle",
      mock: config.provider === "external" ? false : mock,
      currentTaskId: null,
      liveOutput: "",
      activity: null,
      stats: { stepsCompleted: 0, stepsFailed: 0, inputTokens: 0, outputTokens: 0 },
      lastActiveAt: null,
    };
    this.agents.set(agent.id, agent);
    this.emit({ type: "agent", agent });
    return agent;
  }

  /**
   * Lets coding agents running elsewhere (Codex, Claude Code) show up on the
   * office floor. Unknown ids get a desk automatically.
   */
  reportExternal(report: ExternalReport): AgentState {
    if (!report.agentId?.trim()) throw new OfficeError("agentId is required");
    const kind = report.kind ?? "other";
    let agent = this.agents.get(report.agentId);
    if (!agent) {
      agent = this.addAgent({
        id: report.agentId,
        name: report.name ?? (kind === "codex" ? "Codex" : kind === "claude-code" ? "Claude Code" : report.agentId),
        role: kind === "codex" ? "Codex CLI" : kind === "claude-code" ? "Claude Code CLI" : "External agent",
        provider: "external",
        model: kind,
        avatar: kind === "codex" ? "🤖" : kind === "claude-code" ? "✳️" : "🛰️",
        systemPrompt: "",
      });
    } else if (agent.provider !== "external") {
      throw new OfficeError(`${agent.id} is an office agent, not an external one`);
    }
    this.updateAgent(agent, {
      status: report.status ?? "working",
      activity: report.message?.slice(0, 500) ?? agent.activity,
    });
    if (report.message) this.log(`${agent.name}: ${report.message.slice(0, 200)}`, { agentId: agent.id });
    return agent;
  }

  private updateAgent(agent: AgentState, patch: Partial<AgentState>) {
    Object.assign(agent, patch, { lastActiveAt: now() });
    this.emit({ type: "agent", agent });
  }

  // ---- events -------------------------------------------------------------

  private log(message: string, ids: { agentId?: string; taskId?: string } = {}) {
    const entry: ActivityEntry = {
      id: randomUUID(),
      at: now(),
      agentId: ids.agentId ?? null,
      taskId: ids.taskId ?? null,
      message,
    };
    this.activity.push(entry);
    if (this.activity.length > MAX_ACTIVITY) this.activity.shift();
    this.emit({ type: "activity", entry });
  }

  private emitTask(task: Task) {
    this.emit({ type: "task", task });
  }

  private emit(event: OfficeEvent) {
    this.events.emit("event", event);
  }
}

export class OfficeError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function newStep(agentId: string, stage: number): TaskStep {
  return {
    agentId,
    stage,
    status: "pending",
    output: "",
    error: null,
    startedAt: null,
    finishedAt: null,
    inputTokens: 0,
    outputTokens: 0,
  };
}

function providerLabel(provider: AgentConfig["provider"]) {
  return provider === "anthropic" ? "Claude" : provider === "openai" ? "ChatGPT" : "external";
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function now() {
  return new Date().toISOString();
}
