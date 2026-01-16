import { useState, useCallback } from 'react';
import type { Message, ToolCall, DiffData } from '@/types';
import { streamResponse } from '@/services/mock-agent';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const startAssistantMessage = useCallback(() => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      toolCalls: [],
      diffs: [],
    };
    setMessages((prev) => [...prev, message]);
    return message.id;
  }, []);

  const updateStreamingMessage = useCallback((id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + chunk } : msg,
      ),
    );
  }, []);

  const addToolCall = useCallback((id: string, toolCall: ToolCall) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === id) {
          const existingToolIndex =
            msg.toolCalls?.findIndex((t) => t.id === toolCall.id) ?? -1;
          if (existingToolIndex >= 0) {
            const updatedTools = [...(msg.toolCalls || [])];
            updatedTools[existingToolIndex] = toolCall;
            return { ...msg, toolCalls: updatedTools };
          } else {
            return { ...msg, toolCalls: [...(msg.toolCalls || []), toolCall] };
          }
        }
        return msg;
      }),
    );
  }, []);

  const addDiff = useCallback((id: string, diff: DiffData) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, diffs: [...(msg.diffs || []), diff] } : msg,
      ),
    );
  }, []);

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

      await streamResponse(
        (chunk) => updateStreamingMessage(messageId, chunk),
        (tool) => addToolCall(messageId, tool),
        (diff) => addDiff(messageId, diff),
      );

      finishStreaming(messageId);
    },
    [
      isStreaming,
      addUserMessage,
      startAssistantMessage,
      updateStreamingMessage,
      addToolCall,
      addDiff,
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
