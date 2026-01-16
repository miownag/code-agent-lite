import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { Command, ThemeColors } from '@/types';

interface CommandPaletteProps {
  commands: Command[];
  colors: ThemeColors;
  onSelect: (command: Command) => void;
  onCancel: () => void;
}

export function CommandPalette({
  commands,
  colors,
  onSelect,
}: CommandPaletteProps) {
  const items = commands.map((cmd) => ({
    label: `${cmd.icon || ''} ${cmd.name}`,
    value: cmd.name,
    description: cmd.description,
  }));

  return (
    <Box
      borderStyle="round"
      borderColor={colors.primary}
      paddingX={1}
      flexDirection="column"
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          Commands
        </Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) =>
          onSelect(commands.find((cmd) => cmd.name === item.value)!)
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
