import { useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ThemeColors } from '@/types';
import useSelectorStore from '@/stores';
import Spinner from 'ink-spinner';
import fs from 'fs';
import path from 'path';
import useSafeWidth from '@/hooks/use-safe-width';

interface InputBoxProps {
  colors: ThemeColors;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export default function InputBox({
  colors,
  onSubmit,
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
  const prevValueRef = useRef('');

  useEffect(() => {
    const prevValue = prevValueRef.current;

    if (showCommandPalette && prevValue === '/' && inputValue !== '/') {
      updateShowCommandPalette(false);
    }

    prevValueRef.current = inputValue;
  }, [inputValue, showCommandPalette, updateShowCommandPalette]);

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
        if (inputValue.trim() && !disabled) {
          onSubmit(inputValue);
          updateInputValue('');
        }
      }

      if (input === '@' || (key.shift && input === '2')) {
        updateInputValue(`${inputValue}@`);
        updateShowFileSelector(true);
      }
    },
    { isActive: !showFileSelector },
  );

  return (
    <Box
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      flexDirection="column"
      width={safeWidth}
    >
      <Box marginBottom={1} overflow="hidden">
        <Text color={colors.primary} bold>
          ❯{' '}
        </Text>
        <TextInput
          key={inputKey}
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
