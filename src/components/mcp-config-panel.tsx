import { Box, Text, useInput } from 'ink';
import type { ThemeColors, MCPFormData } from '@/types';
import useSelectorStore from '@/stores';
import useSafeWidth from '@/hooks/use-safe-width';
import MCPServerList from './mcp-server-list';
import MCPServerForm from './mcp-server-form';
import { useMcpManager } from '@/hooks/use-mcp-manager';
import { useMemo } from 'react';

interface MCPConfigPanelProps {
  colors: ThemeColors;
}

export default function MCPConfigPanel({ colors }: MCPConfigPanelProps) {
  const safeWidth = useSafeWidth(2);
  const {
    mcpConfigMode,
    mcpEditingServerId,
    mcpServers,
    mcpError,
    setMcpConfigMode,
    setMcpEditingServerId,
    closeMcpConfig,
  } = useSelectorStore([
    'mcpConfigMode',
    'mcpEditingServerId',
    'mcpServers',
    'mcpError',
    'setMcpConfigMode',
    'setMcpEditingServerId',
    'closeMcpConfig',
  ]);

  const {
    addServer,
    updateServer,
    deleteServer,
    toggleServer,
    refreshConnections,
    formErrors,
    setFormErrors,
  } = useMcpManager();

  // Get editing server data
  const editingServer = useMemo(() => {
    if (mcpConfigMode !== 'edit' || !mcpEditingServerId) return null;
    return mcpServers.find((s) => s.id === mcpEditingServerId);
  }, [mcpConfigMode, mcpEditingServerId, mcpServers]);

  // Convert server config to form data for editing
  const editingFormData = useMemo((): MCPFormData | undefined => {
    if (!editingServer) return undefined;

    if (editingServer.transport === 'stdio') {
      return {
        name: editingServer.name,
        transport: 'stdio',
        command: editingServer.command,
        args: editingServer.args ? JSON.stringify(editingServer.args) : '',
        env: editingServer.env ? JSON.stringify(editingServer.env) : '',
        cwd: editingServer.cwd || '',
        url: '',
        headers: '',
      };
    } else {
      return {
        name: editingServer.name,
        transport: 'http',
        command: '',
        args: '',
        env: '',
        cwd: '',
        url: editingServer.url,
        headers: editingServer.headers
          ? JSON.stringify(editingServer.headers)
          : '',
      };
    }
  }, [editingServer]);

  const handleFormSubmit = async (data: MCPFormData) => {
    setFormErrors({});

    if (mcpConfigMode === 'add') {
      await addServer(data);
    } else if (mcpConfigMode === 'edit' && mcpEditingServerId) {
      await updateServer(mcpEditingServerId, data);
    }
  };

  const handleFormCancel = () => {
    setFormErrors({});
    setMcpConfigMode('list');
    setMcpEditingServerId(null);
  };

  const handleEdit = (id: string) => {
    setMcpEditingServerId(id);
    setMcpConfigMode('edit');
  };

  const handleDelete = async (id: string) => {
    await deleteServer(id);
  };

  const handleToggle = async (id: string) => {
    await toggleServer(id);
  };

  const handleRefresh = async () => {
    await refreshConnections();
  };

  // Handle Esc key at panel level
  useInput(
    (input, key) => {
      if (key.escape) {
        if (mcpConfigMode === 'list') {
          closeMcpConfig();
        } else {
          handleFormCancel();
        }
      }

      // Handle keyboard shortcuts for server actions in list mode
      if (mcpConfigMode === 'list') {
        const selectedServerId = mcpServers[0]?.id; // This should be the highlighted item
        if (selectedServerId) {
          if (input === 'e' || input === 'E') {
            handleEdit(selectedServerId);
          } else if (input === 'd' || input === 'D') {
            handleDelete(selectedServerId);
          } else if (input === 't' || input === 'T') {
            handleToggle(selectedServerId);
          }
        }
      }
    },
    { isActive: true },
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.secondary}
      paddingX={1}
      paddingY={1}
      width={safeWidth}
    >
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>
          🔌 MCP Configuration
        </Text>
        <Text color={colors.warning} dimColor>
          Esc to {mcpConfigMode === 'list' ? 'close' : 'go back'}
        </Text>
      </Box>

      {/* Error display */}
      {mcpError && (
        <Box marginBottom={1}>
          <Text color={colors.error}>[!] {mcpError}</Text>
        </Box>
      )}

      {/* Content based on mode */}
      {mcpConfigMode === 'list' && (
        <MCPServerList
          colors={colors}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onRefresh={handleRefresh}
        />
      )}

      {mcpConfigMode === 'add' && (
        <MCPServerForm
          colors={colors}
          mode="add"
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          errors={formErrors}
        />
      )}

      {mcpConfigMode === 'edit' && editingFormData && (
        <MCPServerForm
          colors={colors}
          mode="edit"
          initialData={editingFormData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          errors={formErrors}
        />
      )}
    </Box>
  );
}

export { MCPConfigPanel };
