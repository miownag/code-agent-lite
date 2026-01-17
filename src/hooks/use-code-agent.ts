import { useState, useCallback, useRef } from 'react';
import type { Message, ToolCall, MessagePart } from '@/types';
import codeAgent from '@/core';

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

  messagesRef.current = messages;

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

      addUserMessage(content);
      setIsStreaming(true);

      const messageId = startAssistantMessage();

      // 从 parts 中提取文本内容传给 agent
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
