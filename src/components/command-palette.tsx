import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { Command, ThemeColors } from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';
import useSelectorStore from '@/stores';
import { useMemo } from 'react';

interface CommandPaletteProps {
  commands: Command[];
  colors: ThemeColors;
  onSelect: (command: Command) => void;
}

function CommandPalette({ commands, colors, onSelect }: CommandPaletteProps) {
  const safeWidth = useSafeWidth(2);
  const { inputValue } = useSelectorStore(['inputValue']);

  const searchQuery = useMemo(() => {
    const match = inputValue.match(/\/(\S*)$/);
    return match ? match[1].toLowerCase() : '';
  }, [inputValue]);

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;
    return commands.filter((cmd) => {
      const cmdName = cmd.name.replace(/^\//, '').toLowerCase();
      return cmdName.startsWith(searchQuery);
    });
  }, [commands, searchQuery]);

  const items = filteredCommands.map((cmd) => ({
    label: `${cmd.icon || ''} ${cmd.name}`,
    value: cmd.name,
    description: cmd.description,
  }));

  return (
    <Box
      borderStyle="round"
      borderColor={colors.secondary}
      borderDimColor
      paddingX={1}
      flexDirection="column"
      width={safeWidth}
    >
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.secondary}>
          Commands
        </Text>
        {searchQuery && <Text color={colors.muted}>🔍 {searchQuery}</Text>}
        <Text color={colors.warning} dimColor>
          Esc to close
        </Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) =>
          onSelect(filteredCommands.find((cmd) => cmd.name === item.value)!)
        }
        itemComponent={({ isSelected, label }) => (
          <Box marginBottom={1}>
            <Text color={isSelected ? colors.primary : colors.text}>
              {isSelected ? '❯ ' : '  '}
              {label}
            </Text>
          </Box>
        )}
        indicatorComponent={() => null}
      />
    </Box>
  );
}

export default CommandPalette;
