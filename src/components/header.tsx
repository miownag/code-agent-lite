import { Box, Text } from 'ink';
import type { ThemeColors, ThemeMode } from '@/types';
import BigGradientText from './big-gradient-text';
import { useTerminalSize } from '@/hooks/use-safe-width';

// Breakpoints for responsive layout
const COMPACT_WIDTH = 80;
const MINIMAL_WIDTH = 60;

interface HeaderProps {
  colors: ThemeColors;
  mode: ThemeMode;
  model?: string;
}

export default function Header({ colors, mode, model = 'gpt-4' }: HeaderProps) {
  const { width } = useTerminalSize({ reservedWidth: 2 });

  // Determine layout mode based on terminal width
  const isCompact = width < COMPACT_WIDTH;
  const isMinimal = width < MINIMAL_WIDTH;

  return (
    <Box
      borderStyle="double"
      borderColor={colors.border}
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width={width}
    >
      <BigGradientText
        text={isMinimal ? 'CAL' : 'Code Agent Lite'}
        lineHeight={1}
        font="tiny"
        colors={colors.gradient}
      />
      <Box gap={isCompact ? 1 : 2} height="100%" alignItems="center">
        {!isMinimal && (
          <Text color={colors.muted}>
            Version: <Text color={colors.text}>0.1.0</Text>
          </Text>
        )}
        <Text color={colors.muted}>
          {isCompact ? '' : 'Model: '}
          <Text color={colors.text}>{model}</Text>
        </Text>
        {!isCompact && (
          <Text color={colors.muted}>
            Theme:{' '}
            <Text color={colors.text}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Text>
        )}
      </Box>
    </Box>
  );
}
