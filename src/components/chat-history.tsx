import { Box, Text } from 'ink';
import type { Message, ThemeColors } from '@/types';
import { MessagePartView } from '@/components/message-part';
import Spinner from 'ink-spinner';
import { ShimmerText } from './shimmer-text';

interface ChatHistoryProps {
  messages: Message[];
  colors: ThemeColors;
}

export function ChatHistory({ messages, colors }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <Box
        flexDirection="column"
        paddingX={2}
        paddingY={1}
        justifyContent="center"
        alignItems="center"
      >
        <Text color={colors.muted}>No messages yet. Start chatting!</Text>
        <Text color={colors.muted} dimColor>
          Try using /help for available commands
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
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
                <Spinner type="star" />
                <ShimmerText> Loading...</ShimmerText>
              </Box>
            ) : (
              message.parts.map((part, partIndex) => (
                <MessagePartView
                  key={partIndex}
                  part={part}
                  colors={colors}
                  isLastPart={partIndex === message.parts.length - 1}
                  isStreaming={message.isStreaming}
                />
              ))
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
