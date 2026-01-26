// Provider type definitions

export type ProviderType = 'openai' | 'anthropic' | 'custom';

export interface BaseProviderConfig {
  id: string;
  name: string; // Display name like "GPT-4", "Claude Sonnet"
  type: ProviderType;
  enabled: boolean;
  isDefault?: boolean; // One provider marked as default
}

export interface OpenAIProviderConfig extends BaseProviderConfig {
  type: 'openai';
  model: string;
  apiKey: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AnthropicProviderConfig extends BaseProviderConfig {
  type: 'anthropic';
  model: string;
  apiKey: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CustomProviderConfig extends BaseProviderConfig {
  type: 'custom';
  protocol: 'openai' | 'anthropic'; // Which API format to use
  model: string;
  apiKey: string;
  baseURL: string; // Required for custom
  temperature?: number;
  maxTokens?: number;
}

export type ProviderConfig =
  | OpenAIProviderConfig
  | AnthropicProviderConfig
  | CustomProviderConfig;

export interface ProviderConfigFile {
  providers: ProviderConfig[];
  version: string;
}

// Resolved provider config after environment variable resolution
export type ResolvedProviderConfig = ProviderConfig;

// Form data types for UI
export interface ProviderFormData {
  name: string;
  type: ProviderType;
  protocol?: 'openai' | 'anthropic'; // For custom only
  model: string;
  apiKey: string;
  baseURL: string;
  temperature: string;
  maxTokens: string;
}

// Form validation errors
export interface ProviderFormErrors {
  name?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: string;
  maxTokens?: string;
}

// Type guards
export function isOpenAIProvider(
  config: ProviderConfig,
): config is OpenAIProviderConfig {
  return config.type === 'openai';
}

export function isAnthropicProvider(
  config: ProviderConfig,
): config is AnthropicProviderConfig {
  return config.type === 'anthropic';
}

export function isCustomProvider(
  config: ProviderConfig,
): config is CustomProviderConfig {
  return config.type === 'custom';
}

// Default form data
export const DEFAULT_PROVIDER_FORM: ProviderFormData = {
  name: '',
  type: 'openai',
  model: '',
  apiKey: '',
  baseURL: '',
  temperature: '0.7',
  maxTokens: '4096',
};
