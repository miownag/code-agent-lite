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

  // 从输入中提取搜索关键词（/后面的部分）
  const searchQuery = useMemo(() => {
    const match = inputValue.match(/\/(\S*)$/);
    return match ? match[1].toLowerCase() : '';
  }, [inputValue]);

  // 根据搜索关键词筛选命令
  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;
    return commands.filter((cmd) => {
      // 去掉命令名前的 / 进行匹配
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
      borderColor={colors.primary}
      paddingX={1}
      flexDirection="column"
      width={safeWidth}
    >
      <Box marginBottom={1} gap={1}>
        <Text bold color={colors.primary}>
          Commands
        </Text>
        {searchQuery && (
          <Text color={colors.muted}>
            filter: {searchQuery}
          </Text>
        )}
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
