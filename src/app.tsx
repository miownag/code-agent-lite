import { Box, useApp, useInput } from 'ink';
import { useTheme } from '@/hooks/use-theme';
import { useCodeAgent } from '@/hooks/use-code-agent';
import { Header } from '@/components/header';
import { ChatHistory } from '@/components/chat-history.js';
import { InputBox } from '@/components/input-box';
import { CommandPalette } from '@/components/command-palette';
import { AVAILABLE_COMMANDS } from '@/services/mock-agent';
import type { Command } from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';
import useSelectorStore from '@/stores';
import { FileSelector } from './components/file-selector';
import { FileOption } from './hooks/use-files-options';

type Props = {
  mode?: string;
};

export default function App({}: Props) {
  const { exit } = useApp();
  const { colors, mode: themeMode, toggleTheme } = useTheme();
  const { messages, isStreaming, sendMessage, clearMessages } = useCodeAgent();
  const {
    inputValue,
    showCommandPalette,
    showFileSelector,
    updateShowCommandPalette,
    updateFileSelectorPath,
    resetFileSelector,
    updateInputValue,
    updateInputValueAndResetCursor,
  } = useSelectorStore([
    'inputValue',
    'showCommandPalette',
    'showFileSelector',
    'updateShowCommandPalette',
    'updateFileSelectorPath',
    'resetFileSelector',
    'updateInputValue',
    'updateInputValueAndResetCursor',
  ]);
  const safeWidth = useSafeWidth();

  useInput(
    (input, key) => {
      if (key.escape && showCommandPalette) {
        updateShowCommandPalette(false);
      }

      if (key.escape && showFileSelector) {
        resetFileSelector();
      }

      if ((key.ctrl && input === 'c') || (key.ctrl && input === 'd')) {
        exit();
      }
    },
    { isActive: true },
  );

  const handleInputSubmit = (value: string) => {
    const trimmed = value.trim();

    if (
      trimmed.startsWith('/') &&
      AVAILABLE_COMMANDS.some((c) => c.name === trimmed)
    ) {
      return;
    } else {
      sendMessage(trimmed);
    }
  };

  const handleCommandSelect = (command: Command) => {
    {
      switch (command.name) {
        case '/help':
          sendMessage(
            'Help: Available commands are /help, /clear, /mcp, /model, /settings, /theme',
          );
          break;
        case '/clear':
          clearMessages();
          break;
        case '/mcp':
          sendMessage('MCP Tools: Read, Write, Edit, Bash, Grep, Glob');
          break;
        case '/model':
          sendMessage(
            'Available models: gpt-4, claude-3-opus, claude-3-sonnet',
          );
          break;
        case '/settings':
          sendMessage(
            'Settings: [Theme: ' +
              themeMode +
              ', Model: gpt-4, Temperature: 0.7]',
          );
          break;
        case '/theme':
          toggleTheme();
          break;
      }
      updateInputValue('');
      updateShowCommandPalette(false);
    }
  };

  const handleFileSelect = (item: FileOption) => {
    if (item.type === 'directory') {
      const dirPath = item.value.endsWith('/')
        ? item.value.slice(0, -1)
        : item.value;
      updateFileSelectorPath(dirPath);
      const newValue = inputValue.replace(/@[^\s]*$/, `@${dirPath}/`);
      updateInputValueAndResetCursor(newValue);
    } else {
      const newValue = inputValue.replace(/@[^\s]*$/, `@${item.value} `);
      updateInputValueAndResetCursor(newValue);
      resetFileSelector();
    }
  };

  return (
    <Box
      flexDirection="column"
      height="100%"
      width={safeWidth || '99%'}
      gap={1}
    >
      <Header colors={colors} mode={themeMode} model="GPT-5.2" />
      <Box flexGrow={1} flexDirection="column" overflowY="hidden">
        <ChatHistory messages={messages} colors={colors} />
      </Box>
      <InputBox
        colors={colors}
        onSubmit={handleInputSubmit}
        disabled={isStreaming}
      />
      {showCommandPalette && (
        <CommandPalette
          commands={AVAILABLE_COMMANDS}
          colors={colors}
          onSelect={handleCommandSelect}
        />
      )}
      {showFileSelector && (
        <FileSelector colors={colors} onSelect={handleFileSelect} />
      )}
    </Box>
  );
}
