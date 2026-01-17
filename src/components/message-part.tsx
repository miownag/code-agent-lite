import { Box, Text } from 'ink';
import type { MessagePart, MessageRole, ThemeColors } from '@/types';
import { ToolCallView } from '@/components/tool-call-view';

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
        <Text color={colors.text} dimColor={role === 'user'}>
          {part.content}
          {isLastPart && isStreaming && <Text color={colors.primary}>▋</Text>}
        </Text>
      </Box>
    );
  }

  if (part.type === 'tool_call') {
    return (
      <ToolCallView
        toolCall={part.toolCall}
        colors={colors}
        isLatest={isLatestToolCall}
      />
    );
  }

  return null;
}
