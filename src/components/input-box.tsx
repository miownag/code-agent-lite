import { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { ThemeColors, FileItem } from '@/types';
import useCodeStore from '@/stores';
import Spinner from 'ink-spinner';

interface InputBoxProps {
  colors: ThemeColors;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  availableFiles: FileItem[];
}

export function InputBox({
  colors,
  onSubmit,
  disabled = false,
  availableFiles,
}: InputBoxProps) {
  const { inputValue, updateInputValue } = useCodeStore();
  const [showFileSelector, setShowFileSelector] = useState(false);
  const { showCommandPalette, updateShowCommandPalette } = useCodeStore();
  const prevValueRef = useRef('');

  useEffect(() => {
    const prevValue = prevValueRef.current;

    if (showCommandPalette && prevValue === '/' && inputValue !== '/') {
      updateShowCommandPalette(false);
    }

    prevValueRef.current = inputValue;
  }, [inputValue, showCommandPalette, updateShowCommandPalette]);

  useInput(
    (input, key) => {
      if (showFileSelector) return;

      if (
        key.return &&
        !key.shift &&
        !key.ctrl &&
        !showCommandPalette &&
        !showFileSelector
      ) {
        if (inputValue.trim() && !disabled) {
          onSubmit(inputValue);
          updateInputValue('');
        }
      }

      if (input === '@' || (key.shift && input === '2')) {
        setShowFileSelector(true);
      }
    },
    { isActive: !showFileSelector },
  );

  const handleFileSelect = (item: { value: FileItem }) => {
    const file = item.value;
    updateInputValue(inputValue + file.path + ' ');
    setShowFileSelector(false);
  };

  if (showFileSelector) {
    const items = availableFiles.map((file) => ({
      label: file.path,
      value: file,
      key: file.path,
    }));

    return (
      <Box
        borderStyle="round"
        borderColor={colors.secondary}
        paddingX={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            Select a file (ESC to cancel)
          </Text>
        </Box>
        <SelectInput
          items={items}
          onSelect={handleFileSelect}
          itemComponent={({ isSelected, label }) => (
            <Box>
              <Text color={isSelected ? colors.primary : colors.text}>
                {isSelected ? '❯ ' : '  '}📄 {label}
              </Text>
            </Box>
          )}
          indicatorComponent={() => null}
          onHighlight={() => {}}
        />
      </Box>
    );
  }

  return (
    <Box
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      flexDirection="column"
    >
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          ❯{' '}
        </Text>
        <TextInput
          value={inputValue}
          onChange={updateInputValue}
          placeholder="Type a message... (@ for files, / for commands)"
        />
      </Box>
      <Box justifyContent="space-between" marginTop={0}>
        <Text color={colors.muted} dimColor>
          Press `Enter` to send
        </Text>
        {disabled && (
          <Text color={colors.warning}>
            <Spinner type="star" /> Waiting for response...
          </Text>
        )}
      </Box>
    </Box>
  );
}
