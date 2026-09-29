import type { AgentConfig, Workflow } from "../types.js";

/**
 * The six teammates on the office floor. Ids, names, roles and departments
 * match the robots in dist/app.js so the UI can map events to characters 1:1.
 */
export function defaultRoster(env: NodeJS.ProcessEnv = process.env): AgentConfig[] {
  const claudeModel = env.CLAUDE_MODEL || "claude-opus-5-5";
  const openaiModel = env.OPENAI_MODEL || "gpt-5";

  const chatgpt = (id: string, name: string, role: string, systemPrompt: string): AgentConfig => ({
    id, name, role, provider: "openai", model: openaiModel, avatar: "🤖", systemPrompt,
  });
  const claude = (id: string, name: string, role: string, systemPrompt: string): AgentConfig => ({
    id, name, role, provider: "anthropic", model: claudeModel, avatar: "🤖", effort: "high", systemPrompt,
  });

  return [
    chatgpt("atlas", "Atlas", "Research",
      "You are Atlas, the researcher in a small AI office. Gather the facts, options and trade-offs relevant to the request. Flag anything uncertain."),
    chatgpt("nova", "Nova", "Design",
      "You are Nova, the designer in a small AI office. Propose concrete visual and UX directions: layout, hierarchy, tone, and the reasoning behind each choice."),
    chatgpt("sage", "Sage", "Analytics",
      "You are Sage, the analyst in a small AI office. Find the patterns, metrics and risks in the request or your teammates' work, and state what you would measure."),
    claude("byte", "Byte", "Engineering",
      "You are Byte, the engineer in a small AI office. Produce working code or a precise technical plan for the request. If teammates left research or designs, build on them."),
    claude("quill", "Quill", "Writing",
      "You are Quill, the writer in a small AI office. Produce the finished copy or document the request asks for, clear and ready to use."),
    claude("orbit", "Orbit", "Operations",
      "You are Orbit, the operations lead in a small AI office. Turn the request and your teammates' work into a plan: owners, steps, order and risks. When reviewing, end with a verdict: SHIP or REVISE."),
  ];
}

export const defaultWorkflows: Workflow[] = [
  {
    id: "claude-writes-chatgpt-reviews",
    name: "Claude writes → ChatGPT checks",
    description: "Quill (Claude) drafts, Sage (ChatGPT) checks it.",
    stages: [["quill"], ["sage"]],
  },
  {
    id: "chatgpt-researches-claude-builds",
    name: "ChatGPT researches → Claude builds",
    description: "Atlas (ChatGPT) gathers facts, Byte (Claude) builds on them.",
    stages: [["atlas"], ["byte"]],
  },
  {
    id: "head-to-head",
    name: "Head to head",
    description: "Quill (Claude) and Atlas (ChatGPT) answer side by side, then Orbit compares.",
    stages: [["quill", "atlas"], ["orbit"]],
  },
  {
    id: "full-team",
    name: "Full team",
    description: "Research + design in parallel → build → operations review.",
    stages: [["atlas", "nova"], ["byte"], ["orbit"]],
  },
];
