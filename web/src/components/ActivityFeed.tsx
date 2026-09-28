import { useEffect, useRef } from "react";
import { clock } from "../format";
import type { ActivityEntry, AgentState } from "../types";

export function ActivityFeed({ entries, agents }: { entries: ActivityEntry[]; agents: AgentState[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [entries.length]);

  return (
    <div className="card feed">
      <h2>Activity</h2>
      {entries.length === 0 ? (
        <p className="empty">Quiet in here. Assign a task to get things moving.</p>
      ) : (
        <ol ref={ref}>
          {entries.map((e) => {
            const agent = agents.find((a) => a.id === e.agentId);
            return (
              <li key={e.id} className={agent?.provider}>
                <time>{clock(e.at)}</time>
                <span className="who">{agent?.avatar ?? "📋"}</span>
                <span>{e.message}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
