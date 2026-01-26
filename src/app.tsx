import { Box, Text, useApp, useInput } from 'ink';
import path from 'path';
import fs from 'fs';
import useTheme from '@/hooks/use-theme';
import useCodeAgent from '@/hooks/use-code-agent';
import Header from '@/components/header';
import ChatHistory from '@/components/chat-history.js';
import InputBox from '@/components/input-box';
import CommandPalette from '@/components/command-palette';
import FileSelector from '@/components/file-selector';
import MCPConfigPanel from '@/components/mcp-config-panel';
import ProviderConfigPanel from '@/components/provider-config-panel';
import { AVAILABLE_COMMANDS } from '@/services/mock-agent';
import type { Command } from '@/types';
import useSelectorStore from '@/stores';
import { FileOption } from '@/hooks/use-files-options';
import useResponsiveWidth from '@/hooks/use-main-width';
import useFullHeight from '@/hooks/use-full-height';
import Spinner from 'ink-spinner';

export default function App() {
  const { exit } = useApp();
  const { colors, mode: themeMode, toggleTheme } = useTheme();
  const { messages, isStreaming, sendMessage, clearMessages } = useCodeAgent();
  const {
    inputValue,
    showCommandPalette,
    showFileSelector,
    showMcpConfig,
    showProviderConfig,
    updateShowCommandPalette,
    updateShowMcpConfig,
    updateShowProviderConfig,
    updateFileSelectorPath,
    resetFileSelector,
    updateInputValue,
    updateInputValueAndResetCursor,
    toggleLatestToolCallCollapsed,
  } = useSelectorStore([
    'inputValue',
    'showCommandPalette',
    'showFileSelector',
    'showMcpConfig',
    'showProviderConfig',
    'updateShowCommandPalette',
    'updateShowMcpConfig',
    'updateShowProviderConfig',
    'updateFileSelectorPath',
    'resetFileSelector',
    'updateInputValue',
    'updateInputValueAndResetCursor',
    'toggleLatestToolCallCollapsed',
  ]);
  const responsiveWidth = useResponsiveWidth();

  const rows = useFullHeight();

  useInput(
    (input, key) => {
      if (key.escape && showCommandPalette) {
        updateShowCommandPalette(false);
      }

      if (key.escape && showFileSelector) {
        resetFileSelector();
      }

      // Note: MCP and Provider panels handle their own Esc key internally

      if ((key.ctrl && input === 'c') || (key.ctrl && input === 'd')) {
        exit();
      }

      // Ctrl/Cmd + H to toggle tool calls collapse
      if (key.ctrl && input === 'h') {
        toggleLatestToolCallCollapsed();
      }
    },
    { isActive: !showMcpConfig && !showProviderConfig }, // Disable when config panels are open
  );

  // Convert @-prefixed file paths to absolute paths if file exists
  const processFileReferences = (input: string): string => {
    const workDir = process.cwd();
    // Match @<path> followed by a space (path cannot contain spaces)
    return input.replace(/@([^\s@]+)\s/g, (match, relativePath) => {
      const absolutePath = path.join(workDir, relativePath);
      if (fs.existsSync(absolutePath)) {
        return `${absolutePath} `;
      }
      return match;
    });
  };

  const handleInputSubmit = (value: string) => {
    const trimmed = value.trim();

    if (
      trimmed.startsWith('/') &&
      AVAILABLE_COMMANDS.some((c) => c.name === trimmed)
    ) {
      return;
    } else {
      const processed = processFileReferences(trimmed);
      sendMessage(processed);
    }
  };

  const handleCommandSelect = (command: Command) => {
    {
      switch (command.name) {
        case '/help':
          sendMessage(
            'Help: Available commands are /help, /clear, /mcp, /provider, /model, /settings, /theme',
          );
          break;
        case '/clear':
          clearMessages();
          break;
        case '/mcp':
          updateShowMcpConfig(true);
          break;
        case '/provider':
          updateShowProviderConfig(true);
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
      width={responsiveWidth}
      gap={1}
      minHeight={rows}
      paddingY={1}
      flexShrink={0}
    >
      <Header colors={colors} mode={themeMode} model="GPT-5.2" />
      <Box flexGrow={1}>
        <ChatHistory
          messages={messages}
          colors={colors}
          width={responsiveWidth - 2}
        />
      </Box>
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
      {showMcpConfig && <MCPConfigPanel colors={colors} />}
      {showProviderConfig && <ProviderConfigPanel colors={colors} />}
      <InputBox
        colors={colors}
        onSubmit={handleInputSubmit}
        isStreaming={isStreaming}
        disabled={showMcpConfig || showProviderConfig}
      />
      <Box marginLeft={1} marginTop={-1}>
        {!isStreaming ? (
          <Text color={colors.muted} dimColor>
            Press `Enter` to send
          </Text>
        ) : (
          <Text color={colors.warning}>
            <Spinner type="star" /> Waiting for response...
          </Text>
        )}
      </Box>
    </Box>
  );
}
