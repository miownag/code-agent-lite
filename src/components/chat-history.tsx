import { Box, Text } from 'ink';
import type { Message, ThemeColors } from '@/types';
import { MessagePartView } from '@/components/message-part';
import TypeWriter from './type-writer';

interface ChatHistoryProps {
  messages: Message[];
  colors: ThemeColors;
  width?: number;
}

function ChatHistory({ messages, colors, width }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <Box
        flexDirection="column"
        paddingX={2}
        paddingY={1}
        justifyContent="center"
        alignItems="center"
        width={width}
      >
        <Text color={colors.muted}>No messages yet. Start chatting!</Text>
        <Text color={colors.muted} dimColor>
          Try using /help for available commands
        </Text>
      </Box>
    );
  }

  // Find the latest tool call across all messages
  let latestToolCallId: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    for (let j = message.parts.length - 1; j >= 0; j--) {
      const part = message.parts[j];
      if (part.type === 'tool_call') {
        latestToolCallId = part.toolCall.id;
        break;
      }
    }
    if (latestToolCallId) break;
  }

  return (
    <Box flexDirection="column" paddingX={1} width={width}>
      {messages.map((message, index) => (
        <Box key={message.id} flexDirection="column" marginBottom={1}>
          <Box gap={1} marginBottom={1}>
            <Text
              bold
              color={message.role === 'user' ? colors.user : colors.assistant}
            >
              {message.role === 'user' ? '🧑' : '🤖'}
            </Text>
            <Text
              color={message.role === 'user' ? colors.user : colors.assistant}
              bold
            >
              {message.role === 'user' ? 'You' : 'Agent'}
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column" justifyContent="center">
            {message.role === 'assistant' &&
            index === messages.length - 1 &&
            !message.hasFirstChunk ? (
              <Box>
                <TypeWriter text=". . ." textBold loop />
              </Box>
            ) : (
              message.parts.map((part, partIndex) => (
                <MessagePartView
                  key={partIndex}
                  part={part}
                  colors={colors}
                  isLastPart={partIndex === message.parts.length - 1}
                  isStreaming={message.isStreaming}
                  isLatestToolCall={
                    part.type === 'tool_call' &&
                    part.toolCall.id === latestToolCallId
                  }
                />
              ))
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default ChatHistory;
