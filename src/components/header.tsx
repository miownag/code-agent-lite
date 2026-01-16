import { Box, Text } from 'ink';
import type { ThemeColors, ThemeMode } from '@/types';

interface HeaderProps {
  colors: ThemeColors;
  mode: ThemeMode;
  model?: string;
}

export function Header({ colors, mode, model = 'gpt-4' }: HeaderProps) {
  return (
    <Box
      borderStyle="double"
      borderColor={colors.border}
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={1}
      >
        <Text bold color={colors.primary}>
          ⚡️ Code Agent Lite ⚡️
        </Text>
        <Text color={colors.muted}>
          Version: <Text color={colors.text}>0.1.0</Text>
        </Text>
      </Box>
      <Box gap={2} height="100%" alignItems="center">
        <Text color={colors.muted}>
          Model: <Text color={colors.text}>{model}</Text>
        </Text>
        <Text color={colors.muted}>
          Theme:{' '}
          <Text color={colors.text}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}
