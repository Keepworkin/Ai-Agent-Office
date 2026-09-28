import { useEffect, useReducer } from "react";
import type { AgentState, OfficeEvent, OfficeSnapshot, Task } from "./types";

export interface OfficeView extends OfficeSnapshot {
  connected: boolean;
}

const initial: OfficeView = { agents: [], tasks: [], workflows: [], activity: [], connected: false };

type Action = OfficeEvent | { type: "connection"; connected: boolean };

function reducer(state: OfficeView, action: Action): OfficeView {
  switch (action.type) {
    case "connection":
      return { ...state, connected: action.connected };
    case "snapshot":
      return { ...action.snapshot, connected: true };
    case "agent":
      return { ...state, agents: upsert(state.agents, action.agent) };
    case "task":
      return { ...state, tasks: upsert(state.tasks, action.task, true) };
    case "activity":
      return { ...state, activity: [...state.activity, action.entry].slice(-200) };
    case "delta":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.agentId ? { ...a, liveOutput: a.liveOutput + action.text } : a,
        ),
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                steps: t.steps.map((s) =>
                  s.agentId === action.agentId && s.status === "working" ? { ...s, output: s.output + action.text } : s,
                ),
              }
            : t,
        ),
      };
  }
}

function upsert<T extends AgentState | Task>(list: T[], item: T, prepend = false): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return prepend ? [item, ...list] : [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

/** Live view of the office, kept in sync over server-sent events. */
export function useOffice(): OfficeView {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (msg) => dispatch(JSON.parse(msg.data) as OfficeEvent);
    source.onerror = () => dispatch({ type: "connection", connected: false });
    return () => source.close();
  }, []);

  return state;
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}
