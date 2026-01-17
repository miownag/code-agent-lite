import { Box, Spacer, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { ToolCall, ThemeColors } from '../types';
import AlignedCombinedEmoji from './aligned-emoji';
import { useTerminalSize } from '@/hooks/use-safe-width';
import useSelectorStore from '@/stores';
import { TOOLS_ICON } from '@/constants';

interface ToolCallViewProps {
  toolCall: ToolCall;
  colors: ThemeColors;
  isLatest?: boolean;
}

// Maximum lines to show for output when expanded
const MAX_OUTPUT_LINES = 5;

const truncateText = (text: string, maxWidth: number): string => {
  if (maxWidth <= 3) return text.slice(0, 1) + '..';
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 3) + '...';
};

const truncateOutput = (
  output: string,
  maxLines: number,
  maxCharsPerLine: number,
): string => {
  const lines = output.split('\n');
  const truncatedLines = lines.slice(0, maxLines).map((line) => {
    if (line.length > maxCharsPerLine) {
      return line.slice(0, maxCharsPerLine - 3) + '...';
    }
    return line;
  });

  if (lines.length > maxLines) {
    truncatedLines.push(`... (${lines.length - maxLines} more lines)`);
  }

  return truncatedLines.join('\n');
};

export function ToolCallView({
  toolCall,
  colors,
  isLatest = false,
}: ToolCallViewProps) {
  const { latestToolCallCollapsed } = useSelectorStore([
    'latestToolCallCollapsed',
  ]);
  const { width: terminalWidth } = useTerminalSize({ reservedWidth: 8 });

  // History tool calls are always collapsed, latest follows the toggle state
  const isCollapsed = isLatest ? latestToolCallCollapsed : true;

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

  // Calculate available width for content (accounting for border and padding)
  // Border: 2 chars (left + right), paddingX={1} means 2 chars total (1 left + 1 right)
  const boxWidth = terminalWidth;
  const innerContentWidth = boxWidth - 4; // minus border (2) and padding (2)

  // Reserve space for icon, tool name, and execution time
  const toolNameLength = toolCall.name.length + 3; // emoji + space + name
  const execTimeLength = getExecutionTime().length;
  const spinnerLength = toolCall.status === 'running' ? 2 : 0;
  const inputMaxWidth = Math.max(
    10,
    innerContentWidth - toolNameLength - execTimeLength - spinnerLength - 8,
  );

  // Calculate output max width: "↳ " takes about 3 chars
  const outputMaxWidth = Math.max(20, innerContentWidth - 3);

  const showOutput =
    !isCollapsed && toolCall.output && toolCall.status !== 'running';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={getStatusColor()}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
      marginTop={1}
      width={boxWidth}
    >
      <Box flexWrap="nowrap" overflow="hidden" width={innerContentWidth}>
        {toolCall.status === 'running' && (
          <Text color={colors.warning}>
            <Spinner type="dots" />
          </Text>
        )}
        {toolCall.status === 'running' && <Text> </Text>}
        <AlignedCombinedEmoji
          emoji={TOOLS_ICON[toolCall.name as keyof typeof TOOLS_ICON] ?? '🔧'}
          text={toolCall.name}
          shimmer={toolCall.status === 'running'}
        />
        {toolCall.input && (
          <Text color={colors.muted} dimColor>
            {' '}
            {truncateText(
              toolCall.input,
              Math.max(
                0,
                isCollapsed ? Math.min(30, inputMaxWidth) : inputMaxWidth,
              ),
            )}
          </Text>
        )}
        <Text color={colors.muted} dimColor>
          {getExecutionTime()}
        </Text>
        <Spacer />
        {isLatest && toolCall.output && toolCall.status !== 'running' && (
          <Text color={colors.warning} dimColor>
            {' '}
            {isCollapsed ? '[Ctrl+H to expand]' : '[Ctrl+H to collapse]'}
          </Text>
        )}
      </Box>
      {showOutput && !isCollapsed && (
        <Box marginTop={0} width={innerContentWidth}>
          <Box flexShrink={0}>
            <Text color={colors.muted} dimColor>
              ↳{' '}
            </Text>
          </Box>
          <Box
            flexDirection="column"
            flexGrow={1}
            overflow="hidden"
            width={innerContentWidth - 3}
          >
            {truncateOutput(
              toolCall.output ?? '',
              MAX_OUTPUT_LINES,
              outputMaxWidth,
            )
              .split('\n')
              .map((line, i) => (
                <Text
                  key={i}
                  color={colors.muted}
                  dimColor
                  wrap="truncate-middle"
                >
                  {line}
                </Text>
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
