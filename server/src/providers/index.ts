import type { ProviderId } from "../types.js";
import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";
import { OpenAIProvider } from "./openai.js";
import type { Provider } from "./types.js";

export type ProviderRegistry = (provider: ProviderId) => { provider: Provider; mock: boolean };

/** Chooses a real provider when its key is present, otherwise the mock. */
export function createProviderRegistry(env: NodeJS.ProcessEnv = process.env): ProviderRegistry {
  const forceMock = env.MOCK_PROVIDERS === "true" || env.MOCK_PROVIDERS === "1";
  const mock = new MockProvider();
  const cache = new Map<ProviderId, Provider>();

  return (id) => {
    if (forceMock || id === "external") return { provider: mock, mock: true };
    if (id === "anthropic" && !env.ANTHROPIC_API_KEY) return { provider: mock, mock: true };
    if (id === "openai" && !env.OPENAI_API_KEY) return { provider: mock, mock: true };

    let provider = cache.get(id);
    if (!provider) {
      provider = id === "anthropic" ? new AnthropicProvider() : new OpenAIProvider();
      cache.set(id, provider);
    }
    return { provider, mock: false };
  };
}

export type { Provider, RunRequest, RunResult } from "./types.js";
