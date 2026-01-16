import { Text } from 'ink';
import type { MessagePart, ThemeColors } from '@/types';
import { ToolCallView } from '@/components/tool-call-view';

interface MessagePartViewProps {
  part: MessagePart;
  colors: ThemeColors;
  isLastPart?: boolean;
  isStreaming?: boolean;
}

export function MessagePartView({
  part,
  colors,
  isLastPart,
  isStreaming,
}: MessagePartViewProps) {
  if (part.type === 'text') {
    return (
      <Text color={colors.text}>
        {part.content}
        {isLastPart && isStreaming && <Text color={colors.primary}>▋</Text>}
      </Text>
    );
  }

  if (part.type === 'tool_call') {
    return <ToolCallView toolCall={part.toolCall} colors={colors} />;
  }

  return null;
}
