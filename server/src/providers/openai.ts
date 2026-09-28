import OpenAI from "openai";
import { ProviderError, type Provider, type RunRequest, type RunResult } from "./types.js";

export class OpenAIProvider implements Provider {
  readonly id = "openai";
  private client = new OpenAI();

  async run({ agent, prompt, signal, onDelta }: RunRequest): Promise<RunResult> {
    const stream = await this.client.responses.create(
      {
        model: agent.model,
        instructions: agent.systemPrompt,
        input: prompt,
        stream: true,
      },
      { signal },
    );

    let text = "";
    let inputTokens = 0;
    let outputTokens = 0;
    for await (const event of stream) {
      switch (event.type) {
        case "response.output_text.delta":
          text += event.delta;
          onDelta(event.delta);
          break;
        case "response.refusal.delta":
          text += event.delta;
          onDelta(event.delta);
          break;
        case "response.completed":
          inputTokens = event.response.usage?.input_tokens ?? 0;
          outputTokens = event.response.usage?.output_tokens ?? 0;
          break;
        case "response.failed":
          throw new ProviderError(event.response.error?.message ?? "OpenAI response failed.");
        case "error":
          throw new ProviderError(event.message);
      }
    }
    return { text, inputTokens, outputTokens };
  }
}
