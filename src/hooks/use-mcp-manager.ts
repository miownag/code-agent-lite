import { useState, useCallback, useEffect } from 'react';
import type {
  MCPFormData,
  MCPFormErrors,
  MCPStdioConfig,
  MCPHttpConfig,
} from '@/types';
import { mcpConfigService } from '@/services/mcp-config';
import codeAgent from '@/core';
import useSelectorStore from '@/stores';

export function useMcpManager() {
  const [formErrors, setFormErrors] = useState<MCPFormErrors>({});

  const {
    setMcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    setMcpServerStates,
    setMcpIsConnecting,
    setMcpError,
    setMcpConfigMode,
    setMcpEditingServerId,
  } = useSelectorStore([
    'setMcpServers',
    'addMcpServer',
    'updateMcpServer',
    'removeMcpServer',
    'setMcpServerStates',
    'setMcpIsConnecting',
    'setMcpError',
    'setMcpConfigMode',
    'setMcpEditingServerId',
  ]);

  // Load servers on mount
  useEffect(() => {
    const servers = mcpConfigService.getServers();
    setMcpServers(servers);

    // Also load server states if agent is already initialized
    const states = codeAgent.getMcpServerStates();
    const statesObj = Object.fromEntries(states.entries());
    setMcpServerStates(statesObj);
  }, [setMcpServers, setMcpServerStates]);

  // Validate form data
  const validateForm = useCallback((data: MCPFormData): MCPFormErrors => {
    const errors: MCPFormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }

    if (data.transport === 'stdio') {
      if (!data.command.trim()) {
        errors.command = 'Command is required';
      }

      if (data.args.trim()) {
        try {
          const parsed = JSON.parse(data.args);
          if (!Array.isArray(parsed)) {
            errors.args = 'Arguments must be a JSON array';
          }
        } catch {
          errors.args = 'Invalid JSON format';
        }
      }

      if (data.env.trim()) {
        try {
          const parsed = JSON.parse(data.env);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            errors.env = 'Environment must be a JSON object';
          }
        } catch {
          errors.env = 'Invalid JSON format';
        }
      }
    } else {
      if (!data.url.trim()) {
        errors.url = 'URL is required';
      } else {
        try {
          new URL(data.url);
        } catch {
          errors.url = 'Invalid URL format';
        }
      }

      if (data.headers.trim()) {
        try {
          const parsed = JSON.parse(data.headers);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            errors.headers = 'Headers must be a JSON object';
          }
        } catch {
          errors.headers = 'Invalid JSON format';
        }
      }
    }

    return errors;
  }, []);

  // Convert form data to server config
  const formDataToConfig = useCallback(
    (
      data: MCPFormData,
    ): Omit<MCPStdioConfig, 'id'> | Omit<MCPHttpConfig, 'id'> => {
      if (data.transport === 'stdio') {
        const config: Omit<MCPStdioConfig, 'id'> = {
          name: data.name.trim(),
          transport: 'stdio',
          command: data.command.trim(),
          enabled: true,
        };

        if (data.args.trim()) {
          config.args = JSON.parse(data.args);
        }
        if (data.env.trim()) {
          config.env = JSON.parse(data.env);
        }
        if (data.cwd.trim()) {
          config.cwd = data.cwd.trim();
        }

        return config;
      } else {
        const config: Omit<MCPHttpConfig, 'id'> = {
          name: data.name.trim(),
          transport: 'http',
          url: data.url.trim(),
          enabled: true,
        };

        if (data.headers.trim()) {
          config.headers = JSON.parse(data.headers);
        }

        return config;
      }
    },
    [],
  );

  // Add a new server
  const addServer = useCallback(
    async (data: MCPFormData) => {
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        setMcpError(null);
        const config = formDataToConfig(data);
        const newServer = mcpConfigService.addServer(config);

        addMcpServer(newServer);

        // Reinitialize agent to connect to new server
        setMcpIsConnecting(true);
        await codeAgent.reinitialize();
        setMcpIsConnecting(false);

        // Update server states
        const states = codeAgent.getMcpServerStates();
        setMcpServerStates(Object.fromEntries(states.entries()));

        // Go back to list
        setMcpConfigMode('list');
        setFormErrors({});
      } catch (error) {
        setMcpError(
          error instanceof Error ? error.message : 'Failed to add server',
        );
        setMcpIsConnecting(false);
      }
    },
    [
      validateForm,
      formDataToConfig,
      addMcpServer,
      setMcpError,
      setMcpIsConnecting,
      setMcpServerStates,
      setMcpConfigMode,
    ],
  );

  // Update an existing server
  const updateServer = useCallback(
    async (id: string, data: MCPFormData) => {
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        setMcpError(null);
        const config = formDataToConfig(data);
        const updated = mcpConfigService.updateServer(id, config);

        if (updated) {
          updateMcpServer(id, updated);

          // Reinitialize agent
          setMcpIsConnecting(true);
          await codeAgent.reinitialize();
          setMcpIsConnecting(false);

          // Update server states
          const states = codeAgent.getMcpServerStates();
          setMcpServerStates(Object.fromEntries(states.entries()));
        }

        // Go back to list
        setMcpConfigMode('list');
        setMcpEditingServerId(null);
        setFormErrors({});
      } catch (error) {
        setMcpError(
          error instanceof Error ? error.message : 'Failed to update server',
        );
        setMcpIsConnecting(false);
      }
    },
    [
      validateForm,
      formDataToConfig,
      updateMcpServer,
      setMcpError,
      setMcpIsConnecting,
      setMcpServerStates,
      setMcpConfigMode,
      setMcpEditingServerId,
    ],
  );

  // Delete a server
  const deleteServer = useCallback(
    async (id: string) => {
      try {
        setMcpError(null);
        mcpConfigService.deleteServer(id);
        removeMcpServer(id);

        // Reinitialize agent
        setMcpIsConnecting(true);
        await codeAgent.reinitialize();
        setMcpIsConnecting(false);

        // Update server states
        const states = codeAgent.getMcpServerStates();
        setMcpServerStates(Object.fromEntries(states.entries()));
      } catch (error) {
        setMcpError(
          error instanceof Error ? error.message : 'Failed to delete server',
        );
        setMcpIsConnecting(false);
      }
    },
    [removeMcpServer, setMcpError, setMcpIsConnecting, setMcpServerStates],
  );

  // Toggle server enabled/disabled
  const toggleServer = useCallback(
    async (id: string) => {
      try {
        setMcpError(null);
        const updated = mcpConfigService.toggleServer(id);

        if (updated) {
          updateMcpServer(id, { enabled: updated.enabled });

          // Reinitialize agent
          setMcpIsConnecting(true);
          await codeAgent.reinitialize();
          setMcpIsConnecting(false);

          // Update server states
          const states = codeAgent.getMcpServerStates();
          setMcpServerStates(Object.fromEntries(states.entries()));
        }
      } catch (error) {
        setMcpError(
          error instanceof Error ? error.message : 'Failed to toggle server',
        );
        setMcpIsConnecting(false);
      }
    },
    [updateMcpServer, setMcpError, setMcpIsConnecting, setMcpServerStates],
  );

  // Refresh all connections
  const refreshConnections = useCallback(async () => {
    try {
      setMcpError(null);
      setMcpIsConnecting(true);
      await codeAgent.reinitialize();
      setMcpIsConnecting(false);

      // Update server states
      const states = codeAgent.getMcpServerStates();
      setMcpServerStates(Object.fromEntries(states.entries()));
    } catch (error) {
      setMcpError(
        error instanceof Error
          ? error.message
          : 'Failed to refresh connections',
      );
      setMcpIsConnecting(false);
    }
  }, [setMcpError, setMcpIsConnecting, setMcpServerStates]);

  return {
    validateForm,
    addServer,
    updateServer,
    deleteServer,
    toggleServer,
    refreshConnections,
    formErrors,
    setFormErrors,
  };
}
