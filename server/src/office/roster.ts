import type { AgentConfig, Workflow } from "../types.js";

export function defaultRoster(env: NodeJS.ProcessEnv = process.env): AgentConfig[] {
  const claudeModel = env.CLAUDE_MODEL || "claude-opus-5-5";
  const openaiModel = env.OPENAI_MODEL || "gpt-5";

  return [
    {
      id: "claude-strategist",
      name: "Clara",
      role: "Strategist",
      provider: "anthropic",
      model: claudeModel,
      avatar: "🧭",
      effort: "high",
      systemPrompt:
        "You are Clara, the strategist in a small AI office. Turn the request into a clear plan: goals, key questions, and concrete next steps. Be concise and use short headed sections.",
    },
    {
      id: "claude-writer",
      name: "Cody",
      role: "Builder",
      provider: "anthropic",
      model: claudeModel,
      avatar: "🛠️",
      effort: "high",
      systemPrompt:
        "You are Cody, the builder in a small AI office. Produce the actual deliverable the request asks for (code, copy, a document). If earlier teammates left a plan, follow it.",
    },
    {
      id: "gpt-researcher",
      name: "Gemma",
      role: "Researcher",
      provider: "openai",
      model: openaiModel,
      avatar: "🔎",
      systemPrompt:
        "You are Gemma, the researcher in a small AI office. Gather the facts, options, and trade-offs relevant to the request. Flag anything uncertain.",
    },
    {
      id: "gpt-reviewer",
      name: "Rex",
      role: "Reviewer",
      provider: "openai",
      model: openaiModel,
      avatar: "🧐",
      systemPrompt:
        "You are Rex, the reviewer in a small AI office. Critique the work your teammates produced: what is wrong, what is missing, and a short list of fixes. End with a verdict: SHIP or REVISE.",
    },
  ];
}

export const defaultWorkflows: Workflow[] = [
  {
    id: "claude-builds-gpt-reviews",
    name: "Claude builds → ChatGPT reviews",
    description: "Cody (Claude) produces the work, Rex (ChatGPT) reviews it.",
    stages: [["claude-writer"], ["gpt-reviewer"]],
  },
  {
    id: "gpt-researches-claude-builds",
    name: "ChatGPT researches → Claude builds",
    description: "Gemma (ChatGPT) gathers facts, Cody (Claude) builds on them.",
    stages: [["gpt-researcher"], ["claude-writer"]],
  },
  {
    id: "head-to-head",
    name: "Head to head",
    description: "Claude and ChatGPT answer the same prompt side by side, then Clara compares.",
    stages: [["claude-writer", "gpt-researcher"], ["claude-strategist"]],
  },
  {
    id: "full-team",
    name: "Full team",
    description: "Plan → research + build in parallel → review.",
    stages: [["claude-strategist"], ["gpt-researcher", "claude-writer"], ["gpt-reviewer"]],
  },
];
