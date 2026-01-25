import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import type {
  MCPServerConfig,
  MCPServerState,
  MCPServerStatus,
} from '@/types';

type StdioConnection = {
  transport: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
};

type HttpConnection = {
  transport: 'http';
  url: string;
  headers?: Record<string, string>;
};

type Connection = StdioConnection | HttpConnection;

class MCPClientManager {
  private client: MultiServerMCPClient | null = null;
  private serverStates: Map<string, MCPServerState> = new Map();
  private tools: DynamicStructuredTool[] = [];

  private convertToConnectionConfig(
    servers: MCPServerConfig[],
  ): Record<string, Connection> {
    const config: Record<string, Connection> = {};

    for (const server of servers) {
      if (server.transport === 'stdio') {
        config[server.id] = {
          transport: 'stdio',
          command: server.command,
          args: server.args || [],
          env: server.env,
          cwd: server.cwd,
        };
      } else if (server.transport === 'http') {
        config[server.id] = {
          transport: 'http',
          url: server.url,
          headers: server.headers,
        };
      }
    }

    return config;
  }

  async connect(servers: MCPServerConfig[]): Promise<void> {
    // Clear previous state
    this.serverStates.clear();
    this.tools = [];

    if (servers.length === 0) {
      this.client = null;
      return;
    }

    // Set all servers to connecting state
    for (const server of servers) {
      this.serverStates.set(server.id, {
        status: 'connecting',
      });
    }

    try {
      const connectionConfig = this.convertToConnectionConfig(servers);

      // Use mcpServers format as required by the library
      this.client = new MultiServerMCPClient({
        mcpServers: connectionConfig,
      });

      // Initialize connections and get tools
      const toolsByServer = await this.client.initializeConnections();

      // Update server states based on results
      for (const server of servers) {
        const serverTools = toolsByServer[server.id];
        if (serverTools && serverTools.length >= 0) {
          this.serverStates.set(server.id, {
            status: 'connected',
            toolCount: serverTools.length,
          });
          this.tools.push(...serverTools);
        } else {
          this.serverStates.set(server.id, {
            status: 'error',
            error: 'Failed to get tools from server',
          });
        }
      }
    } catch (error) {
      // Mark all servers as error if connection fails
      for (const server of servers) {
        const currentState = this.serverStates.get(server.id);
        if (currentState?.status === 'connecting') {
          this.serverStates.set(server.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Connection failed',
          });
        }
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Mark all servers as disconnected
    this.serverStates.forEach((_, id) => {
      this.serverStates.set(id, { status: 'disconnected' });
    });

    this.client = null;
    this.tools = [];
  }

  getTools(): DynamicStructuredTool[] {
    return this.tools;
  }

  getServerStates(): Map<string, MCPServerState> {
    return new Map(this.serverStates);
  }

  getServerState(serverId: string): MCPServerState | undefined {
    return this.serverStates.get(serverId);
  }

  updateServerState(serverId: string, status: MCPServerStatus, error?: string): void {
    this.serverStates.set(serverId, { status, error });
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export const mcpClientManager = new MCPClientManager();
