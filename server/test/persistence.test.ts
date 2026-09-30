import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Office } from "../src/office/office.js";
import { defaultRoster, defaultWorkflows } from "../src/office/roster.js";
import { fileStore, type OfficeStore } from "../src/office/store.js";
import { MockProvider } from "../src/providers/mock.js";
import type { Provider } from "../src/providers/types.js";

const tempFile = () => path.join(mkdtempSync(path.join(tmpdir(), "office-")), "office.json");
const makeOffice = (store: OfficeStore, provider: Provider = new MockProvider(0)) =>
  new Office(defaultRoster({}), defaultWorkflows, () => ({ provider, mock: true }), store);

describe("Office persistence", () => {
  it("brings back tasks, activity and agent stats after a restart", async () => {
    const file = tempFile();
    const first = makeOffice(fileStore(file));
    const task = first.createTask({ prompt: "Write a haiku", stages: [["quill"]] });
    await first.waitForTask(task.id);
    first.approveTask(task.id);
    first.flush();

    const second = makeOffice(fileStore(file));
    const snapshot = second.snapshot();
    expect(snapshot.tasks.map((t) => [t.id, t.status])).toEqual([[task.id, "done"]]);
    expect(snapshot.tasks[0].steps[0].output).toContain("haiku");
    expect(snapshot.activity.map((e) => e.message)).toEqual(expect.arrayContaining([expect.stringMatching(/approved/i)]));
    expect(snapshot.activity.at(-1)!.message).toBe("Office restarted: restored 1 task.");
    expect(snapshot.agents.find((a) => a.id === "quill")!.stats.stepsCompleted).toBe(1);
    expect(snapshot.agents.every((a) => a.status === "idle")).toBe(true);
  });

  it("restores a task waiting for review so it can still be approved", async () => {
    const file = tempFile();
    const first = makeOffice(fileStore(file));
    const task = first.createTask({ prompt: "Draft an email", stages: [["byte"]] });
    await first.waitForTask(task.id);
    first.flush();

    const second = makeOffice(fileStore(file));
    expect(second.snapshot().agents.find((a) => a.id === "byte")!.status).toBe("review");
    expect(second.approveTask(task.id).status).toBe("done");
  });

  it("marks work that was still running when the server stopped as failed", async () => {
    const file = tempFile();
    const never: Provider = { id: "never", run: () => new Promise(() => {}) };
    const first = makeOffice(fileStore(file), never);
    const task = first.createTask({ prompt: "Compare ideas", workflowId: "claude-writes-chatgpt-reviews" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(first.getTask(task.id)!.status).toBe("in_progress");
    first.flush();

    const second = makeOffice(fileStore(file));
    const restored = second.getTask(task.id)!;
    expect(restored.status).toBe("failed");
    expect(restored.finishedAt).not.toBeNull();
    expect(restored.steps.map((s) => s.status)).toEqual(["failed", "skipped"]);
    expect(restored.steps[0].error).toMatch(/restarted/);
    expect(second.snapshot().activity.at(-1)!.message).toBe("Office restarted: restored 1 task; 1 unfinished was marked failed.");
    expect(second.snapshot().agents.every((a) => a.status === "idle")).toBe(true);
  });

  it("saves shortly after a change without being asked", async () => {
    const file = tempFile();
    const office = makeOffice(fileStore(file));
    office.reportExternal({ agentId: "codex", kind: "codex", message: "Running tests" });
    await new Promise((resolve) => setTimeout(resolve, 700));
    const saved = JSON.parse(readFileSync(file, "utf8"));
    expect(saved.version).toBe(1);
    expect(saved.activity.map((e: { message: string }) => e.message)).toContain("Codex: Running tests");
  });

  it("moves an unreadable file aside and starts fresh instead of failing to boot", () => {
    const file = tempFile();
    writeFileSync(file, "{ not json");
    const warnings: string[] = [];
    const office = makeOffice(fileStore(file, (message) => warnings.push(message)));
    expect(office.snapshot().tasks).toEqual([]);
    expect(warnings[0]).toMatch(/couldn't be read/);
    expect(readdirSync(path.dirname(file)).some((name) => name.startsWith("office.json.unreadable-"))).toBe(true);
  });
});
