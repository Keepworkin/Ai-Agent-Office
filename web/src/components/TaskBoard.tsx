import type { AgentState, Task, TaskStatus } from "../types";

interface Props {
  tasks: Task[];
  agents: AgentState[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const columns: { title: string; statuses: TaskStatus[] }[] = [
  { title: "In progress", statuses: ["queued", "in_progress"] },
  { title: "Done", statuses: ["done", "failed", "cancelled"] },
];

export function TaskBoard({ tasks, agents, selectedId, onSelect }: Props) {
  return (
    <div className="card board">
      <h2>Task board</h2>
      {tasks.length === 0 && <p className="empty">No tasks yet. Hand one out above.</p>}
      {columns.map((col) => {
        const items = tasks.filter((t) => col.statuses.includes(t.status));
        if (!items.length) return null;
        return (
          <div key={col.title} className="column">
            <h3>
              {col.title} <span>{items.length}</span>
            </h3>
            {items.map((task) => (
              <button
                key={task.id}
                className={`task-row ${task.status} ${task.id === selectedId ? "selected" : ""}`}
                onClick={() => onSelect(task.id)}
              >
                <span className="task-title">{task.title}</span>
                <span className="steps">
                  {task.steps.map((s, i) => {
                    const a = agents.find((x) => x.id === s.agentId);
                    return (
                      <span key={i} className={`step-pip ${s.status} ${a?.provider ?? ""}`} title={`${a?.name}: ${s.status}`}>
                        {a?.avatar}
                      </span>
                    );
                  })}
                </span>
                <span className={`status-tag ${task.status}`}>{task.status.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
