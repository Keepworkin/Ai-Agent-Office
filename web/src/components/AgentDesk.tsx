import { providerLabel, timeAgo, tokens } from "../format";
import type { AgentState, Task } from "../types";

interface Props {
  agent: AgentState;
  task: Task | undefined;
  selected: boolean;
  onSelect: () => void;
}

export function AgentDesk({ agent, task, selected, onSelect }: Props) {
  const working = agent.status === "working";
  const bubble = working ? tail(agent.liveOutput, 180) || "Thinking…" : agent.activity;

  return (
    <button className={`desk ${agent.provider} ${agent.status} ${selected ? "selected" : ""}`} onClick={onSelect}>
      {bubble && <div className="bubble">{bubble}</div>}
      <div className="character">
        <span className="avatar">{agent.avatar}</span>
        <span className={`status-dot ${agent.status}`} title={agent.status} />
      </div>
      <div className="desk-top">
        <div className="monitor">{working ? <span className="typing"><i /><i /><i /></span> : "💤"}</div>
      </div>
      <div className="nameplate">
        <strong>{agent.name}</strong>
        <span>{agent.role}</span>
      </div>
      <div className="meta">
        <span className={`chip ${agent.provider}`}>{providerLabel[agent.provider]}</span>
        <span className="model">{agent.model}</span>
        {agent.mock && <span className="chip mock">mock</span>}
      </div>
      <div className="desk-footer">
        {working && task ? (
          <span className="current">on “{task.title}”</span>
        ) : agent.provider === "external" ? (
          <span>{agent.status} · {timeAgo(agent.lastActiveAt)}</span>
        ) : (
          <span>
            {agent.stats.stepsCompleted} done · {tokens(agent.stats.inputTokens + agent.stats.outputTokens)} tokens
          </span>
        )}
      </div>
    </button>
  );
}

function tail(text: string, n: number) {
  const t = text.trim();
  return t.length > n ? "…" + t.slice(-n) : t;
}
