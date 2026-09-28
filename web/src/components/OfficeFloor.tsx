import type { AgentState, Task } from "../types";
import { AgentDesk } from "./AgentDesk";

interface Props {
  agents: AgentState[];
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OfficeFloor({ agents, tasks, selectedId, onSelect }: Props) {
  const teams = [
    { key: "anthropic", title: "Claude wing", agents: agents.filter((a) => a.provider === "anthropic") },
    { key: "openai", title: "ChatGPT wing", agents: agents.filter((a) => a.provider === "openai") },
    { key: "external", title: "Remote desks · Codex & Claude Code", agents: agents.filter((a) => a.provider === "external") },
  ];

  return (
    <div className="floor">
      {teams.map((team) => (
        <div key={team.key} className={`wing wing-${team.key}`}>
          <h2>{team.title}</h2>
          {team.agents.length === 0 ? (
            <p className="empty">
              {team.key === "external"
                ? "No coding agents connected. See README → “Connect Codex & Claude Code”."
                : "No agents here yet."}
            </p>
          ) : (
            <div className="desks">
              {team.agents.map((agent) => (
                <AgentDesk
                  key={agent.id}
                  agent={agent}
                  task={tasks.find((t) => t.id === agent.currentTaskId)}
                  selected={agent.id === selectedId}
                  onSelect={() => onSelect(agent.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
