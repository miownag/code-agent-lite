import { createMiddleware, type AgentMiddleware } from 'langchain';
import { ToolMessage } from '@langchain/core/messages';
import { isCommand } from '@langchain/langgraph';

export function createCustomToolCallMiddleware(options: {
  onToolCallStart?: (toolName: string, args: any) => void;
  onToolCallComplete?: (toolName: string, result: any) => void;
  onToolCallError?: (toolName: string, error: any) => void;
}): AgentMiddleware {
  const { onToolCallStart, onToolCallComplete, onToolCallError } = options;

  return createMiddleware({
    name: 'CustomToolCallMiddleware',
    wrapToolCall: async (request: any, handler: any) => {
      const { toolCall } = request;
      const toolName = toolCall?.name || 'unknown';

      try {
        if (onToolCallStart) {
          onToolCallStart(toolName, toolCall?.args);
        }

        const result = await handler(request);

        if (result instanceof ToolMessage) {
          if (onToolCallComplete) {
            onToolCallComplete(toolName, result.content);
          }

          return result;
        }

        if (isCommand(result)) {
          const update = result.update as any;

          if (onToolCallComplete) {
            onToolCallComplete(toolName, update);
          }

          return result;
        }

        if (onToolCallComplete) {
          onToolCallComplete(toolName, result);
        }

        return result;
      } catch (error) {
        if (onToolCallError) {
          onToolCallError(toolName, error);
        }

        throw error;
      }
    },
  });
}
