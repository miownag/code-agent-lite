import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { ToolCall, ThemeColors } from '../types';
import AlignedCombinedEmoji from './aligned-emoji';

interface ToolCallViewProps {
  toolCall: ToolCall;
  colors: ThemeColors;
}

export function ToolCallView({ toolCall, colors }: ToolCallViewProps) {
  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'running':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getExecutionTime = () => {
    if (!toolCall.endTime) return '';
    const duration = toolCall.endTime - toolCall.startTime;
    return ` (${duration}ms)`;
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={getStatusColor()}
      paddingX={1}
      marginY={0}
      width="50%"
    >
      <Box gap={1}>
        {toolCall.status === 'running' && (
          <Text color={colors.warning}>
            <Spinner type="dots" />
          </Text>
        )}
        <AlignedCombinedEmoji
          emoji={toolCall.icon || '🔧'}
          text={toolCall.name}
        />
        {/* <Text color={getStatusColor()}>
          {toolCall.icon || '🔧'} {toolCall.name}
        </Text> */}
        {toolCall.input && (
          <Text color={colors.muted} dimColor>
            {toolCall.input}
          </Text>
        )}
        <Text color={colors.muted} dimColor>
          {getExecutionTime()}
        </Text>
      </Box>
      {toolCall.output && toolCall.status !== 'running' && (
        <Box marginTop={0}>
          <Text color={colors.muted} dimColor>
            ↳ {toolCall.output}
          </Text>
        </Box>
      )}
    </Box>
  );
}
