import { Messages } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { createDeepAgent, DeepAgent, FilesystemBackend } from 'deepagents';
import type { ToolCall } from '@/types';

export type StreamCallbacks = {
  onTextChunk?: (chunk: string) => void;
  onToolCallStart?: (toolCall: ToolCall) => void;
  onToolCallComplete?: (toolCallId: string, result: string) => void;
  onToolCallError?: (toolCallId: string, error: string) => void;
};

class CodeAgent {
  private agent: DeepAgent;

  constructor() {
    this.agent = createDeepAgent({
      model: new ChatOpenAI({
        model: 'glm-4.7',
        apiKey: 'HMsBHF3WyC4kfrZ3wEwn1lTl@4677',
        configuration: {
          baseURL: 'http://v2.open.venus.oa.com/llmproxy',
        },
      }),
      backend: new FilesystemBackend({ rootDir: '.', virtualMode: true }),
    });
  }

  async run(messages: Messages) {
    return this.agent.invoke({
      messages,
    });
  }

  async streamRun(messages: Messages, callbacks: StreamCallbacks) {
    const stream = await this.agent.stream({ messages });
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
}

export default new CodeAgent();
