import { MemorySaver, Messages } from '@langchain/langgraph';
import { createDeepAgent, DeepAgent, FilesystemBackend } from 'deepagents';
import type { ToolCall } from '@/types';
import { mcpConfigService } from '@/services/mcp-config';
import { providerConfigService } from '@/services/provider-config';
import { modelFactory } from './model-factory';
import { mcpClientManager } from './mcp-client';
import path from 'path';

export type StreamCallbacks = {
  onTextChunk?: (chunk: string) => void;
  onToolCallStart?: (toolCall: ToolCall) => void;
  onToolCallComplete?: (toolCallId: string, result: string) => void;
  onToolCallError?: (toolCallId: string, error: string) => void;
};

class CodeAgent {
  private agent: DeepAgent | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;

  private createModel() {
    // Priority: 1. provider.json config → 2. environment variables → 3. null (show config form)

    // 1. Try to get provider from config file
    const providerConfig = providerConfigService.getDefaultProvider();
    if (providerConfig) {
      const resolved =
        providerConfigService.resolveProviderSettings(providerConfig);
      return modelFactory.createModel(resolved);
    }

    // 2. Try to get provider from environment variables
    const envProvider = providerConfigService.getProviderFromEnv();
    if (envProvider) {
      return modelFactory.createModel(envProvider);
    }

    // 3. No provider configured - throw error to trigger config form
    throw new Error('NO_PROVIDER_CONFIGURED');
  }

  async initialize(): Promise<void> {
    // Return early if already initialized
    if (this.initialized && this.agent) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializing) {
      return this.initializing;
    }

    // Start initialization
    this.initializing = this.doInitialize();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async doInitialize(): Promise<void> {
    // Load MCP configuration
    const servers = mcpConfigService.getEnabledServers();

    // Connect to MCP servers if any are configured
    if (servers.length > 0) {
      try {
        await mcpClientManager.connect(servers);
      } catch (error) {
        // Log error but continue - agent will work without MCP tools
        console.error('Failed to connect to MCP servers:', error);
      }
    }

    // Get MCP tools
    const mcpTools = mcpClientManager.getTools();

    const checkpointer = new MemorySaver();

    // Create the agent with MCP tools
    this.agent = createDeepAgent({
      model: this.createModel(),
      backend: new FilesystemBackend({ rootDir: '.', virtualMode: true }),
      memory: ['./AGENTS.md', './CLAUDE.md'],
      skills: [path.join(process.cwd(), '.code-agent-lite/skills')],
      // interruptOn: {
      //   write_file: true,
      //   delete_file: true,
      // },
      tools: mcpTools.length > 0 ? mcpTools : undefined,
      checkpointer,
    }) as DeepAgent;

    this.initialized = true;
  }

  async reinitialize(): Promise<void> {
    // Disconnect existing MCP connections
    await mcpClientManager.disconnect();

    // Reset state
    this.agent = null;
    this.initialized = false;

    // Re-initialize
    await this.initialize();
  }

  async run(messages: Messages) {
    await this.initialize();

    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    return this.agent.invoke({
      messages,
    });
  }

  async streamRun(messages: Messages, callbacks: StreamCallbacks) {
    await this.initialize();

    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    const stream = await this.agent.stream(
      { messages },
      {
        configurable: {
          thread_id: `thread-${Date.now()}`,
        },
      },
    );
    let lastContent = '';
    const pendingToolCalls = new Set<string>();

    for await (const chunk of stream) {
      for (const [key, value] of Object.entries(chunk)) {
        const nodeData = value as {
          messages?: Array<{
            id?: string;
            content?: unknown;
            name?: string;
            tool_call_id?: string;
            tool_calls?: Array<{
              id?: string;
              name: string;
              args?: unknown;
            }>;
          }>;
          todos?: unknown[];
        };

        if (nodeData?.messages && Array.isArray(nodeData.messages)) {
          for (const msg of nodeData.messages) {
            if (msg.tool_call_id) {
              if (pendingToolCalls.has(msg.tool_call_id)) {
                const result =
                  typeof msg.content === 'string'
                    ? msg.content
                    : JSON.stringify(msg.content);
                callbacks.onToolCallComplete?.(msg.tool_call_id, result);
                pendingToolCalls.delete(msg.tool_call_id);
              }
              continue;
            }

            if (key === 'model_request') {
              if (msg.content && !msg.tool_call_id && callbacks.onTextChunk) {
                const content = String(msg.content);
                if (content !== lastContent) {
                  if (content.startsWith(lastContent)) {
                    const delta = content.slice(lastContent.length);
                    if (delta) {
                      callbacks.onTextChunk(delta);
                    }
                  } else {
                    callbacks.onTextChunk(content);
                  }
                  lastContent = content;
                }
              }

              if (
                msg.tool_calls &&
                Array.isArray(msg.tool_calls) &&
                callbacks.onToolCallStart
              ) {
                for (const tc of msg.tool_calls) {
                  const toolId = tc.id || crypto.randomUUID();
                  if (pendingToolCalls.has(toolId)) continue;

                  const toolCall: ToolCall = {
                    id: toolId,
                    name: tc.name,
                    status: 'running',
                    startTime: Date.now(),
                    input:
                      typeof tc.args === 'string'
                        ? tc.args
                        : JSON.stringify(tc.args),
                  };
                  pendingToolCalls.add(toolId);
                  callbacks.onToolCallStart(toolCall);
                }
              }
            }
          }
        }
      }
    }
  }

  // Get current MCP server states
  getMcpServerStates() {
    return mcpClientManager.getServerStates();
  }

  // Check if MCP is connected
  isMcpConnected() {
    return mcpClientManager.isConnected();
  }
}

const codeAgent = new CodeAgent();
export default codeAgent;
