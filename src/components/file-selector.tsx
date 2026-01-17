import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { ThemeColors } from '@/types';
import useFilesOptions, { FileOption } from '@/hooks/use-files-options';
import useSelectorStore from '@/stores';
import { useEffect, useMemo } from 'react';
import useSafeWidth from '@/hooks/use-safe-width';

interface FileSelectorProps {
  colors: ThemeColors;
  onSelect: (file: FileOption) => void;
}

export default function FileSelector({ colors, onSelect }: FileSelectorProps) {
  const safeWidth = useSafeWidth(2);
  const { fileSelectorPath, updateShowFileSelector, inputValue } =
    useSelectorStore([
      'fileSelectorPath',
      'updateShowFileSelector',
      'inputValue',
    ]);
  const fileOptions = useFilesOptions({ currentPath: fileSelectorPath });

  // 构建选项列表
  const items = useMemo(() => {
    return fileOptions.map((i) => ({
      label: i.label,
      value: JSON.stringify({ value: i.value, type: i.type }),
    }));
  }, [fileOptions]);

  useEffect(() => {
    if (
      inputValue.endsWith('@') &&
      !inputValue.endsWith('@@') &&
      fileOptions.length
    ) {
      updateShowFileSelector(true);
    }
  }, [inputValue, fileOptions.length, updateShowFileSelector]);

  const handleSelect = (item: { label: string; value: string }) => {
    const parsed = JSON.parse(item.value) as {
      value: string;
      type: FileOption['type'];
    };
    onSelect({
      label: item.label,
      value: parsed.value,
      type: parsed.type,
    });
  };

  return (
    <Box
      borderStyle="round"
      borderColor={colors.secondary}
      paddingX={1}
      flexDirection="column"
      width={safeWidth}
    >
      <Box marginBottom={1} gap={1}>
        <Text bold color={colors.secondary}>
          Select a file (ESC to cancel)
        </Text>
        <Text color={colors.muted}>📂 {fileSelectorPath || '.'}</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={handleSelect}
        itemComponent={({ isSelected, label }) => (
          <Box marginBottom={1}>
            <Text color={isSelected ? colors.primary : colors.text}>
              {isSelected ? '❯ ' : '  '}
              {label.endsWith('/') ? '📁' : '📄'} {label}
            </Text>
          </Box>
        )}
        indicatorComponent={() => null}
        onHighlight={() => {}}
      />
    </Box>
  );
}
