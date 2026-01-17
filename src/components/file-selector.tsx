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

  const searchQuery = useMemo(() => {
    const match = inputValue.match(/@([^\s]*)$/);
    if (!match) return '';
    const fullPath = match[1];
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const query =
      lastSlashIndex >= 0 ? fullPath.slice(lastSlashIndex + 1) : fullPath;
    return query.toLowerCase();
  }, [inputValue]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return fileOptions;
    return fileOptions.filter((option) => {
      const fileName = option.label.toLowerCase().replace(/\/$/, '');
      return fileName.startsWith(searchQuery);
    });
  }, [fileOptions, searchQuery]);

  const items = useMemo(() => {
    return filteredOptions.map((i) => ({
      label: i.label,
      value: JSON.stringify({ value: i.value, type: i.type }),
    }));
  }, [filteredOptions]);

  useEffect(() => {
    if (
      inputValue.endsWith('@') &&
      !inputValue.endsWith('@@') &&
      filteredOptions.length
    ) {
      updateShowFileSelector(true);
    }
  }, [inputValue, filteredOptions.length, updateShowFileSelector]);

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
