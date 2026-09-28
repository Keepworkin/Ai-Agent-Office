import { api } from "../useOffice";
import { providerLabel } from "../format";
import type { AgentState, Task } from "../types";
import { Panel } from "./Panel";

export function TaskPanel({ task, agents, onClose }: { task: Task; agents: AgentState[]; onClose: () => void }) {
  const stages = [...new Set(task.steps.map((s) => s.stage))];
  const open = task.status === "queued" || task.status === "in_progress";

  return (
    <Panel title={task.title} onClose={onClose}>
      <div className="task-meta">
        <span className={`status-tag ${task.status}`}>{task.status.replace("_", " ")}</span>
        {open && (
          <button className="link danger" onClick={() => api(`/api/tasks/${task.id}/cancel`, {})}>
            Cancel task
          </button>
        )}
      </div>
      <details className="prompt">
        <summary>Request</summary>
        <pre>{task.prompt}</pre>
      </details>
      {stages.map((stage) => {
        const steps = task.steps.filter((s) => s.stage === stage);
        return (
          <div key={stage} className="stage">
            <h3>
              Stage {stage + 1}
              {steps.length > 1 && <span> · side by side</span>}
            </h3>
            <div className={`stage-steps n${steps.length}`}>
              {steps.map((step) => {
                const agent = agents.find((a) => a.id === step.agentId);
                return (
                  <div key={step.agentId} className={`step ${agent?.provider ?? ""} ${step.status}`}>
                    <div className="step-head">
                      <span>{agent?.avatar} {agent?.name}</span>
                      <span className={`chip ${agent?.provider}`}>{agent ? providerLabel[agent.provider] : "?"}</span>
                      <span className={`status-tag ${step.status}`}>{step.status}</span>
                    </div>
                    {step.error && <p className="error">{step.error}</p>}
                    <pre className="output">{step.output || (step.status === "pending" ? "Waiting for earlier stages…" : "")}</pre>
                    {step.status === "done" && (
                      <p className="hint">{step.inputTokens} in · {step.outputTokens} out tokens</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
