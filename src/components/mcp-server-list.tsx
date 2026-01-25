import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { ThemeColors, MCPServerConfig, MCPServerState } from '@/types';
import useSelectorStore from '@/stores';
import useSafeWidth from '@/hooks/use-safe-width';

interface MCPServerListProps {
  colors: ThemeColors;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onRefresh: () => void;
}

function getStatusIcon(
  server: MCPServerConfig,
  state?: MCPServerState,
): string {
  if (!server.enabled) return '⚫';
  if (!state) return '⚪';

  switch (state.status) {
    case 'connected':
      return '🟢';
    case 'connecting':
      return '🟡';
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}

function getServerLabel(
  server: MCPServerConfig,
  state?: MCPServerState,
): string {
  const icon = getStatusIcon(server, state);
  const type = server.transport === 'stdio' ? 'stdio' : 'http';
  const toolCount =
    state?.toolCount !== undefined ? ` (${state.toolCount} tools)` : '';
  const enabledStatus = server.enabled ? '' : ' [disabled]';

  return `${icon} ${server.name} [${type}]${toolCount}${enabledStatus}`;
}

export default function MCPServerList({
  colors,
  onRefresh,
}: MCPServerListProps) {
  const safeWidth = useSafeWidth(4);
  const { mcpServers, mcpServerStates, mcpIsConnecting, setMcpConfigMode } =
    useSelectorStore([
      'mcpServers',
      'mcpServerStates',
      'mcpIsConnecting',
      'setMcpConfigMode',
    ]);

  // Build items for SelectInput
  const items = [
    { label: '+ Add new server', value: '__add__' },
    { label: '↻ Refresh connections', value: '__refresh__' },
    ...mcpServers.map((server) => ({
      label: getServerLabel(server, mcpServerStates[server.id]),
      value: server.id,
    })),
  ];

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === '__add__') {
      setMcpConfigMode('add');
    } else if (item.value === '__refresh__') {
      onRefresh();
    } else {
      // Show action menu for this server
      // For now, directly show edit/delete options via a simple cycling action
      // In a full implementation, you'd show a sub-menu
    }
  };

  return (
    <Box flexDirection="column" width={safeWidth}>
      {mcpIsConnecting && (
        <Box marginBottom={1}>
          <Text color={colors.warning}>Connecting to MCP servers...</Text>
        </Box>
      )}

      {mcpServers.length === 0 ? (
        <Box marginBottom={1}>
          <Text color={colors.muted}>No MCP servers configured.</Text>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={colors.muted}>
            {mcpServers.length} server(s) configured
          </Text>
        </Box>
      )}

      <SelectInput
        items={items}
        onSelect={handleSelect}
        itemComponent={({ isSelected, label }) => {
          // Extract value from label matching
          const item = items.find((i) => i.label === label);
          const value = item?.value || '';
          const isAction = value === '__add__' || value === '__refresh__';
          const server = mcpServers.find((s) => s.id === value);
          const state = server ? mcpServerStates[server.id] : undefined;

          return (
            <Box flexDirection="column">
              <Box>
                <Text
                  color={
                    isSelected
                      ? colors.primary
                      : isAction
                        ? colors.secondary
                        : colors.text
                  }
                  bold={isSelected}
                >
                  {isSelected ? '❯ ' : '  '}
                  {label}
                </Text>
              </Box>
              {isSelected && server && (
                <Box marginLeft={4} flexDirection="column">
                  {state?.error && (
                    <Text color={colors.error} dimColor>
                      Error: {state.error}
                    </Text>
                  )}
                  <Box gap={2} marginTop={1}>
                    <Text color={colors.muted} dimColor>
                      [E]dit
                    </Text>
                    <Text color={colors.muted} dimColor>
                      [D]elete
                    </Text>
                    <Text color={colors.muted} dimColor>
                      [T]oggle {server.enabled ? 'off' : 'on'}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          );
        }}
        indicatorComponent={() => null}
      />

      <Box marginTop={1}>
        <Text color={colors.muted} dimColor>
          Use arrow keys to navigate, Enter to select
        </Text>
      </Box>
    </Box>
  );
}

export { MCPServerList };
