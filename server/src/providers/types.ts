import type { AgentConfig } from "../types.js";

export interface RunRequest {
  agent: AgentConfig;
  prompt: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

export interface RunResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface Provider {
  readonly id: string;
  run(req: RunRequest): Promise<RunResult>;
}

export class ProviderError extends Error {}
