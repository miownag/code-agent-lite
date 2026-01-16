import { Box, Text } from 'ink';
import type { Message, ThemeColors } from '@/types';
import { ToolCallView } from '@/components/tool-call-view';
import { DiffView } from '@/components/diff-view';

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
      {messages.map((message) => (
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
          <Box marginLeft={2} flexDirection="column">
            {message.content && (
              <Text color={colors.text}>
                {message.content}
                {message.isStreaming && <Text color={colors.primary}>▋</Text>}
              </Text>
            )}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                {message.toolCalls.map((tool) => (
                  <ToolCallView key={tool.id} toolCall={tool} colors={colors} />
                ))}
              </Box>
            )}
            {message.diffs && message.diffs.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                {message.diffs.map((diff, idx) => (
                  <DiffView key={idx} diff={diff} colors={colors} />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
