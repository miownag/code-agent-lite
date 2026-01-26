import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  ProviderConfigFile,
  ProviderConfig,
  OpenAIProviderConfig,
  AnthropicProviderConfig,
  CustomProviderConfig,
  ResolvedProviderConfig,
} from '@/types/provider';

const CONFIG_DIR = path.join(os.homedir(), '.code-agent-lite');
const CONFIG_FILE = path.join(CONFIG_DIR, 'provider.json');

class ProviderConfigService {
  private config: ProviderConfigFile = { providers: [], version: '1.0' };
  private loaded = false;

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  private initializeEmptyConfig(): void {
    // Initialize with empty providers list
    this.config = {
      version: '1.0',
      providers: [],
    };

    this.saveConfig();
  }

  loadConfig(): ProviderConfigFile {
    if (this.loaded) {
      return this.config;
    }

    this.ensureConfigDir();

    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(content) as ProviderConfigFile;
      } else {
        // First run, initialize empty config
        this.initializeEmptyConfig();
      }
    } catch {
      // If config is corrupted, start fresh
      this.initializeEmptyConfig();
    }

    this.loaded = true;
    return this.config;
  }

  saveConfig(): void {
    this.ensureConfigDir();
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(this.config, null, 2),
      'utf-8',
    );

    // Set file permissions to 0600 (user read/write only) for security
    try {
      fs.chmodSync(CONFIG_FILE, 0o600);
    } catch {
      // Silently fail if chmod not supported (e.g., Windows)
    }
  }

  getProviders(): ProviderConfig[] {
    this.loadConfig();
    return this.config.providers;
  }

  getEnabledProviders(): ProviderConfig[] {
    return this.getProviders().filter((p) => p.enabled);
  }

  getDefaultProvider(): ProviderConfig | null {
    const providers = this.getEnabledProviders();

    // Find provider marked as default
    const defaultProvider = providers.find((p) => p.isDefault);
    if (defaultProvider) {
      return defaultProvider;
    }

    // If no default, return first enabled provider
    return providers[0] || null;
  }

  getProviderById(id: string): ProviderConfig | undefined {
    return this.getProviders().find((p) => p.id === id);
  }

  hasValidProvider(): boolean {
    return (
      this.getDefaultProvider() !== null || this.getProviderFromEnv() !== null
    );
  }

  addProvider(
    config: Omit<
      OpenAIProviderConfig | AnthropicProviderConfig | CustomProviderConfig,
      'id'
    >,
  ): ProviderConfig {
    this.loadConfig();

    const newProvider: ProviderConfig = {
      ...config,
      id: crypto.randomUUID(),
    } as ProviderConfig;

    // If this is the first provider, make it default
    if (this.config.providers.length === 0) {
      newProvider.isDefault = true;
    }

    this.config.providers.push(newProvider);
    this.saveConfig();

    return newProvider;
  }

  updateProvider(
    id: string,
    updates: Partial<Omit<ProviderConfig, 'id'>>,
  ): ProviderConfig | null {
    this.loadConfig();

    const index = this.config.providers.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.config.providers[index];
    const updated = { ...existing, ...updates } as ProviderConfig;
    this.config.providers[index] = updated;
    this.saveConfig();

    return updated;
  }

  deleteProvider(id: string): boolean {
    this.loadConfig();

    const index = this.config.providers.findIndex((p) => p.id === id);
    if (index === -1) {
      return false;
    }

    const wasDefault = this.config.providers[index].isDefault;
    this.config.providers.splice(index, 1);

    // If we deleted the default provider, set first enabled as new default
    if (wasDefault && this.config.providers.length > 0) {
      const firstEnabled = this.config.providers.find((p) => p.enabled);
      if (firstEnabled) {
        firstEnabled.isDefault = true;
      }
    }

    this.saveConfig();

    return true;
  }

  toggleProvider(id: string): ProviderConfig | null {
    this.loadConfig();

    const provider = this.config.providers.find((p) => p.id === id);
    if (!provider) {
      return null;
    }

    provider.enabled = !provider.enabled;

    // If disabling the default provider, set first enabled as new default
    if (!provider.enabled && provider.isDefault) {
      const firstEnabled = this.config.providers.find(
        (p) => p.enabled && p.id !== id,
      );
      if (firstEnabled) {
        provider.isDefault = false;
        firstEnabled.isDefault = true;
      }
    }

    this.saveConfig();

    return provider;
  }

  setDefaultProvider(id: string): ProviderConfig | null {
    this.loadConfig();

    const provider = this.config.providers.find((p) => p.id === id);
    if (!provider || !provider.enabled) {
      return null;
    }

    // Remove default from all other providers
    for (const p of this.config.providers) {
      p.isDefault = p.id === id;
    }

    this.saveConfig();

    return provider;
  }

  // Resolve provider settings with environment variable priority
  resolveProviderSettings(provider: ProviderConfig): ResolvedProviderConfig {
    // Priority: 1. Provider config → 2. .env (via process.env) → 3. system env
    const resolved = { ...provider };

    // Resolve API key
    if (!resolved.apiKey) {
      const envKey = process.env[`${resolved.type.toUpperCase()}_API_KEY`];
      if (envKey) {
        resolved.apiKey = envKey;
      }
    }

    // Resolve base URL
    if (!resolved.baseURL && resolved.type !== 'custom') {
      const envBaseURL = process.env[`${resolved.type.toUpperCase()}_BASE_URL`];
      if (envBaseURL) {
        if (resolved.type === 'openai') {
          (resolved as OpenAIProviderConfig).baseURL = envBaseURL;
        } else if (resolved.type === 'anthropic') {
          (resolved as AnthropicProviderConfig).baseURL = envBaseURL;
        }
      }
    }

    return resolved;
  }

  // Try to create a provider config from environment variables
  getProviderFromEnv(): ResolvedProviderConfig | null {
    // Check for OpenAI configuration
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      return {
        id: 'env-openai',
        name: 'OpenAI (from env)',
        type: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        apiKey: openaiKey,
        baseURL: process.env.OPENAI_BASE_URL,
        enabled: true,
        isDefault: true,
      };
    }

    // Check for Anthropic configuration
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      return {
        id: 'env-anthropic',
        name: 'Anthropic (from env)',
        type: 'anthropic',
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        apiKey: anthropicKey,
        baseURL: process.env.ANTHROPIC_BASE_URL,
        enabled: true,
        isDefault: true,
      };
    }

    return null;
  }

  // Reload config from disk (useful after external changes)
  reload(): void {
    this.loaded = false;
    this.loadConfig();
  }
}

export const providerConfigService = new ProviderConfigService();
