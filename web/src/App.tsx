import { useState } from "react";
import { ActivityFeed } from "./components/ActivityFeed";
import { AgentPanel } from "./components/AgentPanel";
import { NewTaskForm } from "./components/NewTaskForm";
import { OfficeFloor } from "./components/OfficeFloor";
import { TaskBoard } from "./components/TaskBoard";
import { TaskPanel } from "./components/TaskPanel";
import { useOffice } from "./useOffice";

type Selection = { kind: "agent"; id: string } | { kind: "task"; id: string } | null;

export function App() {
  const office = useOffice();
  const [selected, setSelected] = useState<Selection>(null);

  const working = office.agents.filter((a) => a.status === "working").length;
  const mockAgents = office.agents.filter((a) => a.mock);
  const selectedAgent = selected?.kind === "agent" ? office.agents.find((a) => a.id === selected.id) : undefined;
  const selectedTask = selected?.kind === "task" ? office.tasks.find((t) => t.id === selected.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🏢</span>
          <div>
            <h1>AI Agent Office</h1>
            <p>
              {office.agents.length} agents · {working} working ·{" "}
              {office.tasks.filter((t) => t.status === "in_progress" || t.status === "queued").length} open tasks
            </p>
          </div>
        </div>
        <div className="legend">
          <span className="chip anthropic">Claude</span>
          <span className="chip openai">ChatGPT</span>
          <span className="chip external">Codex / Claude Code</span>
          <span className={`conn ${office.connected ? "on" : "off"}`}>{office.connected ? "live" : "reconnecting…"}</span>
        </div>
      </header>

      {mockAgents.length > 0 && (
        <div className="banner">
          Mock mode for {mockAgents.map((a) => a.name).join(", ")}. Add <code>ANTHROPIC_API_KEY</code> /{" "}
          <code>OPENAI_API_KEY</code> to <code>.env</code> for real model output.
        </div>
      )}

      <main className="layout">
        <section className="floor-area">
          <OfficeFloor
            agents={office.agents}
            tasks={office.tasks}
            selectedId={selected?.kind === "agent" ? selected.id : null}
            onSelect={(id) => setSelected({ kind: "agent", id })}
          />
          <ActivityFeed entries={office.activity} agents={office.agents} />
        </section>

        <aside className="sidebar">
          <NewTaskForm
            agents={office.agents}
            workflows={office.workflows}
            onCreated={(id) => setSelected({ kind: "task", id })}
          />
          <TaskBoard
            tasks={office.tasks}
            agents={office.agents}
            selectedId={selected?.kind === "task" ? selected.id : null}
            onSelect={(id) => setSelected({ kind: "task", id })}
          />
        </aside>
      </main>

      {selectedAgent && <AgentPanel agent={selectedAgent} tasks={office.tasks} onClose={() => setSelected(null)} onOpenTask={(id) => setSelected({ kind: "task", id })} />}
      {selectedTask && <TaskPanel task={selectedTask} agents={office.agents} onClose={() => setSelected(null)} />}
    </div>
  );
}
