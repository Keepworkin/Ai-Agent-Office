import { useState, type FormEvent } from "react";
import { api } from "../useOffice";
import type { AgentState, Task, Workflow } from "../types";

interface Props {
  agents: AgentState[];
  workflows: Workflow[];
  onCreated: (taskId: string) => void;
}

const CUSTOM = "__custom__";

export function NewTaskForm({ agents, workflows, onCreated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const workers = agents.filter((a) => a.provider !== "external");
  const chosen = workflowId || workflows[0]?.id || CUSTOM;
  const workflow = workflows.find((w) => w.id === chosen);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body =
        chosen === CUSTOM
          ? { title, prompt, stages: picked.map((id) => [id]) }
          : { title, prompt, workflowId: chosen };
      const task = await api<Task>("/api/tasks", body);
      setPrompt("");
      setTitle("");
      onCreated(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card new-task" onSubmit={submit}>
      <h2>Hand out work</h2>
      <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        placeholder="What should the office work on?"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <label>
        Workflow
        <select value={chosen} onChange={(e) => setWorkflowId(e.target.value)}>
          {workflows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
          <option value={CUSTOM}>Custom chain…</option>
        </select>
      </label>
      {workflow ? (
        <p className="hint">{workflow.description}</p>
      ) : (
        <div className="picker">
          <p className="hint">Click agents in the order they should work. Each one sees the previous output.</p>
          <div className="picker-agents">
            {workers.map((a) => (
              <button type="button" key={a.id} className={`chip ${a.provider}`} onClick={() => setPicked([...picked, a.id])}>
                {a.avatar} {a.name}
              </button>
            ))}
          </div>
          {picked.length > 0 && (
            <p className="chain">
              {picked.map((id) => agents.find((a) => a.id === id)?.name).join(" → ")}{" "}
              <button type="button" className="link" onClick={() => setPicked([])}>clear</button>
            </p>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy || !prompt.trim() || (chosen === CUSTOM && !picked.length)}>
        {busy ? "Assigning…" : "Assign task"}
      </button>
    </form>
  );
}
