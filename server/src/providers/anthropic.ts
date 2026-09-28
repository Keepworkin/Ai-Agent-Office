import Anthropic from "@anthropic-ai/sdk";
import { ProviderError, type Provider, type RunRequest, type RunResult } from "./types.js";

// Models that accept server-side refusal fallbacks in the "default" form.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

export class AnthropicProvider implements Provider {
  readonly id = "anthropic";
  private client = new Anthropic();

  async run({ agent, prompt, signal, onDelta }: RunRequest): Promise<RunResult> {
    const useFallbacks = FALLBACK_MODELS.has(agent.model);
    const stream = this.client.beta.messages.stream(
      {
        model: agent.model,
        max_tokens: 64000,
        system: agent.systemPrompt,
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "adaptive" },
        output_config: { effort: agent.effort ?? "medium" },
        ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { signal },
    );

    stream.on("text", (delta) => onDelta(delta));
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new ProviderError(message.stop_details?.explanation ?? "Claude declined this request.");
    }

    const text = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("");
    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  }
}
