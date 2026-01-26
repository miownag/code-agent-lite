import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { ResolvedProviderConfig } from '@/types/provider';

class ModelFactory {
  createModel(config: ResolvedProviderConfig) {
    switch (config.type) {
      case 'openai':
        return new ChatOpenAI({
          model: config.model,
          apiKey: config.apiKey,
          configuration: config.baseURL ? { baseURL: config.baseURL } : undefined,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });

      case 'anthropic':
        return new ChatAnthropic({
          model: config.model,
          apiKey: config.apiKey,
          ...(config.baseURL && { clientOptions: { baseURL: config.baseURL } }),
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });

      case 'custom':
        // Use the specified protocol
        if (config.protocol === 'openai') {
          return new ChatOpenAI({
            model: config.model,
            apiKey: config.apiKey,
            configuration: { baseURL: config.baseURL },
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
        } else {
          return new ChatAnthropic({
            model: config.model,
            apiKey: config.apiKey,
            clientOptions: { baseURL: config.baseURL },
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
        }

      default:
        throw new Error(`Unsupported provider type: ${(config as any).type}`);
    }
  }
}

export const modelFactory = new ModelFactory();
