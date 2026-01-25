import { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ThemeColors } from '@/types';
import useSelectorStore from '@/stores';
import fs from 'fs';
import path from 'path';
import useSafeWidth from '@/hooks/use-safe-width';

interface InputBoxProps {
  colors: ThemeColors;
  onSubmit: (value: string) => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export default function InputBox({
  colors,
  onSubmit,
  isStreaming = false,
  disabled = false,
}: InputBoxProps) {
  const safeWidth = useSafeWidth(2); // Reserve 2 chars for borders
  const {
    inputValue,
    updateInputValue,
    inputKey,
    showCommandPalette,
    updateShowCommandPalette,
    showFileSelector,
    updateShowFileSelector,
    updateFileSelectorPath,
    resetFileSelector,
  } = useSelectorStore([
    'inputValue',
    'updateInputValue',
    'inputKey',
    'showCommandPalette',
    'updateShowCommandPalette',
    'showFileSelector',
    'updateShowFileSelector',
    'updateFileSelectorPath',
    'resetFileSelector',
  ]);

  useEffect(() => {
    if (!showFileSelector) return;

    const match = inputValue.match(/@([^\s]*)$/);
    if (match) {
      const inputPath = match[1];
      if (inputPath.endsWith('/')) {
        const dirPath = inputPath.slice(0, -1);
        const fullPath = path.join(process.cwd(), dirPath);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
          updateFileSelectorPath(dirPath);
        }
      }
    } else if (!inputValue.includes('@')) {
      resetFileSelector();
    }
  }, [inputValue, showFileSelector, resetFileSelector, updateFileSelectorPath]);

  useEffect(() => {
    if (inputValue === '/') {
      updateShowCommandPalette(true);
      return;
    }
  }, [inputValue, updateShowCommandPalette]);

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
        if (inputValue.trim() && !isStreaming && !disabled) {
          onSubmit(inputValue);
          updateInputValue('');
        }
      }

      if (input === '@' || (key.shift && input === '2')) {
        updateInputValue(`${inputValue}@`);
        !showCommandPalette && updateShowFileSelector(true);
      }
    },
    { isActive: !showFileSelector && !disabled },
  );

  const handleOnUpdate = (value: string) => {
    !disabled && updateInputValue(value);
  };

  return (
    <Box
      borderStyle="round"
      borderColor={colors.border}
      gap={1}
      padding={1}
      width={safeWidth}
      flexShrink={0}
    >
      <Text color={colors.primary} bold>
        ❯
      </Text>
      <TextInput
        key={inputKey}
        value={inputValue}
        onChange={handleOnUpdate}
        placeholder="Type a message... (@ for files, / for commands)"
      />
    </Box>
  );
}
