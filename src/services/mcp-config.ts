import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  MCPConfigFile,
  MCPServerConfig,
  MCPStdioConfig,
  MCPHttpConfig,
} from '@/types';

const CONFIG_DIR = path.join(os.homedir(), '.code-agent-lite');
const CONFIG_FILE = path.join(CONFIG_DIR, 'mcp.json');

class MCPConfigService {
  private config: MCPConfigFile = { servers: [] };
  private loaded = false;

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  loadConfig(): MCPConfigFile {
    if (this.loaded) {
      return this.config;
    }

    this.ensureConfigDir();

    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(content) as MCPConfigFile;
      } else {
        this.config = { servers: [] };
        this.saveConfig();
      }
    } catch {
      // If config is corrupted, start fresh
      this.config = { servers: [] };
    }

    this.loaded = true;
    return this.config;
  }

  saveConfig(): void {
    this.ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  getServers(): MCPServerConfig[] {
    this.loadConfig();
    return this.config.servers;
  }

  getEnabledServers(): MCPServerConfig[] {
    return this.getServers().filter((s) => s.enabled);
  }

  getServerById(id: string): MCPServerConfig | undefined {
    return this.getServers().find((s) => s.id === id);
  }

  addServer(
    config: Omit<MCPStdioConfig, 'id'> | Omit<MCPHttpConfig, 'id'>,
  ): MCPServerConfig {
    this.loadConfig();

    const newServer: MCPServerConfig = {
      ...config,
      id: crypto.randomUUID(),
    } as MCPServerConfig;

    this.config.servers.push(newServer);
    this.saveConfig();

    return newServer;
  }

  updateServer(
    id: string,
    updates: Partial<Omit<MCPServerConfig, 'id'>>,
  ): MCPServerConfig | null {
    this.loadConfig();

    const index = this.config.servers.findIndex((s) => s.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.config.servers[index];
    const updated = { ...existing, ...updates } as MCPServerConfig;
    this.config.servers[index] = updated;
    this.saveConfig();

    return updated;
  }

  deleteServer(id: string): boolean {
    this.loadConfig();

    const index = this.config.servers.findIndex((s) => s.id === id);
    if (index === -1) {
      return false;
    }

    this.config.servers.splice(index, 1);
    this.saveConfig();

    return true;
  }

  toggleServer(id: string): MCPServerConfig | null {
    this.loadConfig();

    const server = this.config.servers.find((s) => s.id === id);
    if (!server) {
      return null;
    }

    server.enabled = !server.enabled;
    this.saveConfig();

    return server;
  }

  // Reload config from disk (useful after external changes)
  reload(): void {
    this.loaded = false;
    this.loadConfig();
  }
}

export const mcpConfigService = new MCPConfigService();
