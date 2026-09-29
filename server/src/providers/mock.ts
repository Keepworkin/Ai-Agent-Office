import type { Provider, RunRequest, RunResult } from "./types.js";

/**
 * Offline stand-in for a real model. Streams a plausible, role-flavoured reply
 * word by word so the office can be demoed and tested without API keys.
 */
export class MockProvider implements Provider {
  readonly id = "mock";

  constructor(private readonly delayMs = 35) {}

  async run({ agent, prompt, signal, onDelta }: RunRequest): Promise<RunResult> {
    const reply = mockReply(agent.name, agent.role, prompt);
    const words = reply.split(/(\s+)/);
    let text = "";
    for (const word of words) {
      if (signal?.aborted) throw new Error("aborted");
      text += word;
      onDelta(word);
      if (this.delayMs > 0 && word.trim()) await sleep(this.delayMs);
    }
    return { text, inputTokens: Math.ceil(prompt.length / 4), outputTokens: Math.ceil(text.length / 4) };
  }
}

function mockReply(name: string, role: string, prompt: string): string {
  const topic = firstLine(prompt).slice(0, 120);
  return [
    `(${name} · mock mode — add an API key in .env for real output)`,
    "",
    `As the office ${role.toLowerCase()}, here is my take on: "${topic}"`,
    "",
    "1. Clarify the goal and who it is for.",
    "2. Break the work into small, checkable pieces.",
    "3. Do the first piece well, then review it before moving on.",
    "",
    "Done — handing this back to the office.",
  ].join("\n");
}

function firstLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? text;
  return line.trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
