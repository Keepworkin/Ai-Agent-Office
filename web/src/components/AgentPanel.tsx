import { providerLabel, timeAgo } from "../format";
import type { AgentState, Task } from "../types";
import { Panel } from "./Panel";

interface Props {
  agent: AgentState;
  tasks: Task[];
  onClose: () => void;
  onOpenTask: (id: string) => void;
}

export function AgentPanel({ agent, tasks, onClose, onOpenTask }: Props) {
  const history = tasks.filter((t) => t.steps.some((s) => s.agentId === agent.id));

  return (
    <Panel title={<>{agent.avatar} {agent.name} <small>{agent.role}</small></>} onClose={onClose}>
      <div className="task-meta">
        <span className={`chip ${agent.provider}`}>{providerLabel[agent.provider]}</span>
        <span className="model">{agent.model}</span>
        {agent.mock && <span className="chip mock">mock</span>}
        <span className={`status-tag ${agent.status}`}>{agent.status}</span>
        <span className="hint">active {timeAgo(agent.lastActiveAt)}</span>
      </div>
      {agent.activity && <p className="activity-line">{agent.activity}</p>}
      {agent.provider !== "external" && (
        <>
          <h3>{agent.status === "working" ? "Writing now" : "Last output"}</h3>
          <pre className="output">{agent.liveOutput || "Nothing yet."}</pre>
          <details className="prompt">
            <summary>System prompt</summary>
            <pre>{agent.systemPrompt}</pre>
          </details>
        </>
      )}
      {history.length > 0 && (
        <>
          <h3>Tasks</h3>
          <ul className="history">
            {history.map((t) => (
              <li key={t.id}>
                <button className="link" onClick={() => onOpenTask(t.id)}>{t.title}</button>
                <span className={`status-tag ${t.status}`}>{t.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
