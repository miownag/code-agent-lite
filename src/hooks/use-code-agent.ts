import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, ToolCall, MessagePart } from '@/types';
import codeAgent from '@/core';
import { providerConfigService } from '@/services/provider-config';
import useSelectorStore from '@/stores';

function getTextContent(parts: MessagePart[]): string {
  return parts
    .filter((p): p is { type: 'text'; content: string } => p.type === 'text')
    .map((p) => p.content)
    .join('');
}

export default function useCodeAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const { updateShowProviderConfig, setProviderSetupRequired } = useSelectorStore([
    'updateShowProviderConfig',
    'setProviderSetupRequired',
  ]);

  messagesRef.current = messages;

  // Check if provider is configured on mount
  useEffect(() => {
    const hasProvider = providerConfigService.hasValidProvider();
    if (!hasProvider) {
      setProviderSetupRequired(true);
      updateShowProviderConfig(true);
    }
  }, [updateShowProviderConfig, setProviderSetupRequired]);

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', content }],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const startAssistantMessage = useCallback(() => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      parts: [],
      timestamp: Date.now(),
      isStreaming: true,
      hasFirstChunk: false,
    };
    setMessages((prev) => [...prev, message]);
    return message.id;
  }, []);

  const appendText = useCallback((id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;

        const parts = [...msg.parts];
        const lastPart = parts[parts.length - 1];

        if (lastPart?.type === 'text') {
          parts[parts.length - 1] = {
            type: 'text',
            content: lastPart.content + chunk,
          };
        } else {
          parts.push({ type: 'text', content: chunk });
        }

        return { ...msg, parts, hasFirstChunk: true };
      }),
    );
  }, []);

  const insertToolCall = useCallback((id: string, toolCall: ToolCall) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;
        return {
          ...msg,
          parts: [...msg.parts, { type: 'tool_call', toolCall }],
        };
      }),
    );
  }, []);

  const updateToolCall = useCallback(
    (id: string, toolCallId: string, updates: Partial<ToolCall>) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== id) return msg;
          return {
            ...msg,
            parts: msg.parts.map((part) => {
              if (
                part.type === 'tool_call' &&
                part.toolCall.id === toolCallId
              ) {
                return {
                  ...part,
                  toolCall: { ...part.toolCall, ...updates },
                };
              }
              return part;
            }),
          };
        }),
      );
    },
    [],
  );

  const finishStreaming = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isStreaming: false } : msg)),
    );
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      // Check if provider is configured
      if (!providerConfigService.hasValidProvider()) {
        setProviderSetupRequired(true);
        updateShowProviderConfig(true);
        return;
      }

      addUserMessage(content);
      setIsStreaming(true);

      const messageId = startAssistantMessage();

      try {
        // Extract text content from parts to pass to agent
        const agentMessages = messagesRef.current.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: getTextContent(m.parts),
        }));
        agentMessages.push({ role: 'user', content });

        await codeAgent.streamRun(agentMessages, {
          onTextChunk: (chunk) => appendText(messageId, chunk),
          onToolCallStart: (toolCall) => insertToolCall(messageId, toolCall),
          onToolCallComplete: (toolCallId, result) =>
            updateToolCall(messageId, toolCallId, {
              status: 'success',
              endTime: Date.now(),
              output: result,
            }),
          onToolCallError: (toolCallId, error) =>
            updateToolCall(messageId, toolCallId, {
              status: 'error',
              endTime: Date.now(),
              output: error,
            }),
        });
      } catch (error) {
        // Handle provider configuration errors
        if (
          error instanceof Error &&
          error.message.includes('No provider configured')
        ) {
          setProviderSetupRequired(true);
          updateShowProviderConfig(true);
          // Remove the assistant message that was started
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          setIsStreaming(false);
          return;
        }
        // For other errors, show in the message
        appendText(
          messageId,
          `\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      finishStreaming(messageId);
    },
    [
      isStreaming,
      addUserMessage,
      startAssistantMessage,
      appendText,
      insertToolCall,
      updateToolCall,
      finishStreaming,
      updateShowProviderConfig,
      setProviderSetupRequired,
    ],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
