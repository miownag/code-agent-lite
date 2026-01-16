import { Box, useApp, useInput } from 'ink';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/hooks/use-chat';
import { Header } from '@/components/header';
import { ChatHistory } from '@/components/chat-history.js';
import { InputBox } from '@/components/input-box';
import { CommandPalette } from '@/components/command-palette';
import { AVAILABLE_COMMANDS, AVAILABLE_FILES } from '@/services/mock-agent';
import type { Command } from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';
import useCodeStore from '@/stores';

type Props = {
  mode?: string;
};

export default function App({}: Props) {
  const { exit } = useApp();
  const { colors, mode: themeMode, toggleTheme } = useTheme();
  const { messages, isStreaming, sendMessage, clearMessages } = useChat();
  const { showCommandPalette, updateShowCommandPalette, updateInputValue } =
    useCodeStore();
  const safeWidth = useSafeWidth();

  useInput(
    (input, key) => {
      if (key.escape && showCommandPalette) {
        updateShowCommandPalette(false);
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

  // TODO: support every command
  const handleCommand = (commandName: string) => {
    switch (commandName) {
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
        sendMessage('Available models: gpt-4, claude-3-opus, claude-3-sonnet');
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
  };

  const handleCommandSelect = (command: Command) => {
    handleCommand(command.name);
  };

  useInput(
    (input) => {
      if (input === '/' && !isStreaming) {
        updateShowCommandPalette(true);
      }
    },
    { isActive: !showCommandPalette },
  );

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
        availableFiles={AVAILABLE_FILES}
      />
      {showCommandPalette && (
        <CommandPalette
          commands={AVAILABLE_COMMANDS}
          colors={colors}
          onSelect={handleCommandSelect}
          onCancel={() => updateShowCommandPalette(false)}
        />
      )}
    </Box>
  );
}
