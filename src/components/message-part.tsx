import { Box, Text } from 'ink';
import type { MessagePart, MessageRole, ThemeColors } from '@/types';
import { ToolCallView } from '@/components/tool-call-view';
import MarkdownText from './markdown-text';

interface MessagePartViewProps {
  part: MessagePart;
  role: MessageRole;
  colors: ThemeColors;
  isLastPart?: boolean;
  isStreaming?: boolean;
  isLatestToolCall?: boolean;
}

export function MessagePartView({
  part,
  role,
  colors,
  isLastPart,
  isStreaming,
  isLatestToolCall,
}: MessagePartViewProps) {
  if (part.type === 'text') {
    return (
      <Box marginTop={1}>
        {role === 'user' ? (
          <Text dimColor>{part.content}</Text>
        ) : (
          <MarkdownText>{part.content}</MarkdownText>
        )}
        {role === 'assistant' && isLastPart && isStreaming && (
          <Text color={colors.primary}>▋</Text>
        )}
      </Box>
    );
  }

  if (part.type === 'tool_call') {
    return (
      <Box flexDirection="column">
        <ToolCallView
          toolCall={part.toolCall}
          colors={colors}
          isLatest={isLatestToolCall}
        />
        {isLastPart && isStreaming && <Text color={colors.primary}>▋</Text>}
      </Box>
    );
  }

  return null;
}
