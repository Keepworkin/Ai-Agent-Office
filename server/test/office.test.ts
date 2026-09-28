import { describe, expect, it } from "vitest";
import { Office } from "../src/office/office.js";
import { defaultRoster, defaultWorkflows } from "../src/office/roster.js";
import { MockProvider } from "../src/providers/mock.js";
import type { Provider, RunRequest } from "../src/providers/types.js";
import type { OfficeEvent } from "../src/types.js";

function makeOffice(provider: Provider = new MockProvider(0)) {
  return new Office(defaultRoster({}), defaultWorkflows, () => ({ provider, mock: true }));
}

describe("Office", () => {
  it("starts with Claude and ChatGPT agents idle", () => {
    const { agents } = makeOffice().snapshot();
    expect(agents.map((a) => a.provider)).toEqual(expect.arrayContaining(["anthropic", "openai"]));
    expect(agents.every((a) => a.status === "idle")).toBe(true);
  });

  it("runs a workflow stage by stage and hands earlier output forward", async () => {
    const prompts: Record<string, string> = {};
    const provider: Provider = {
      id: "spy",
      async run({ agent, prompt, onDelta }: RunRequest) {
        prompts[agent.id] = prompt;
        onDelta(`${agent.name} output`);
        return { text: `${agent.name} output`, inputTokens: 10, outputTokens: 5 };
      },
    };
    const office = makeOffice(provider);
    const task = office.createTask({ prompt: "Write a haiku", workflowId: "claude-builds-gpt-reviews" });
    const done = await office.waitForTask(task.id);

    expect(done.status).toBe("done");
    expect(done.steps.map((s) => [s.agentId, s.status])).toEqual([
      ["claude-writer", "done"],
      ["gpt-reviewer", "done"],
    ]);
    expect(prompts["claude-writer"]).toBe("Write a haiku");
    expect(prompts["gpt-reviewer"]).toContain("Cody output");

    const writer = office.snapshot().agents.find((a) => a.id === "claude-writer")!;
    expect(writer.status).toBe("idle");
    expect(writer.stats).toMatchObject({ stepsCompleted: 1, inputTokens: 10, outputTokens: 5 });
  });

  it("runs agents in the same stage in parallel", async () => {
    let running = 0;
    let peak = 0;
    const provider: Provider = {
      id: "slow",
      async run() {
        running++;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 20));
        running--;
        return { text: "ok", inputTokens: 0, outputTokens: 0 };
      },
    };
    const office = makeOffice(provider);
    const task = office.createTask({ prompt: "Compare", workflowId: "head-to-head" });
    await office.waitForTask(task.id);
    expect(peak).toBe(2);
  });

  it("streams deltas as events", async () => {
    const office = makeOffice();
    const events: OfficeEvent[] = [];
    office.subscribe((e) => events.push(e));
    const task = office.createTask({ prompt: "Hello", stages: [["gpt-researcher"]] });
    await office.waitForTask(task.id);
    const text = events.flatMap((e) => (e.type === "delta" ? [e.text] : [])).join("");
    expect(text).toContain("Hello");
  });

  it("marks the task failed when a whole stage fails, and skips later stages", async () => {
    const provider: Provider = {
      id: "broken",
      async run() {
        throw new Error("boom");
      },
    };
    const office = makeOffice(provider);
    const task = office.createTask({ prompt: "x", workflowId: "claude-builds-gpt-reviews" });
    const done = await office.waitForTask(task.id);
    expect(done.status).toBe("failed");
    expect(done.steps.map((s) => s.status)).toEqual(["failed", "skipped"]);
    expect(done.steps[0].error).toBe("boom");
  });

  it("can cancel a running task", async () => {
    const office = makeOffice(new MockProvider(20));
    const task = office.createTask({ prompt: "long job", workflowId: "full-team" });
    await new Promise((r) => setTimeout(r, 30));
    office.cancelTask(task.id);
    const done = await office.waitForTask(task.id);
    expect(done.status).toBe("cancelled");
    expect(done.steps.some((s) => s.status === "done")).toBe(false);
  });

  it("rejects bad input", () => {
    const office = makeOffice();
    expect(() => office.createTask({ prompt: "" })).toThrow(/prompt/);
    expect(() => office.createTask({ prompt: "x", workflowId: "nope" })).toThrow(/workflow/);
    expect(() => office.createTask({ prompt: "x", stages: [["ghost"]] })).toThrow(/agent/);
  });

  it("gives external coding agents a desk when they report in", () => {
    const office = makeOffice();
    office.reportExternal({ agentId: "codex-laptop", kind: "codex", message: "Running tests" });
    const codex = office.snapshot().agents.find((a) => a.id === "codex-laptop")!;
    expect(codex).toMatchObject({ provider: "external", name: "Codex", status: "working", activity: "Running tests" });

    office.reportExternal({ agentId: "codex-laptop", status: "idle" });
    expect(office.snapshot().agents.find((a) => a.id === "codex-laptop")!.status).toBe("idle");
    expect(() => office.createTask({ prompt: "x", stages: [["codex-laptop"]] })).toThrow(/external/);
  });
});
