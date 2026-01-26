import { useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ThemeColors, ProviderFormData } from '@/types';
import useSelectorStore from '@/stores';
import { useProviderManager } from '@/hooks/use-provider-manager';
import ProviderList from './provider-list';
import ProviderForm from './provider-form';
import useSafeWidth from '@/hooks/use-safe-width';

interface ProviderConfigPanelProps {
  colors: ThemeColors;
}

export default function ProviderConfigPanel({
  colors,
}: ProviderConfigPanelProps) {
  const safeWidth = useSafeWidth(4);

  const {
    providerConfigMode,
    providerEditingId,
    providers,
    providerError,
    providerSetupRequired,
    closeProviderConfig,
    setProviderConfigMode,
    setProviderEditingId,
  } = useSelectorStore([
    'providerConfigMode',
    'providerEditingId',
    'providers',
    'providerError',
    'providerSetupRequired',
    'closeProviderConfig',
    'setProviderConfigMode',
    'setProviderEditingId',
  ]);

  const {
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    setDefaultProvider,
    formErrors,
    setFormErrors,
  } = useProviderManager();

  const handleAdd = useCallback(() => {
    setProviderConfigMode('add');
    setFormErrors({});
  }, [setProviderConfigMode, setFormErrors]);

  const handleEdit = useCallback(
    (id: string) => {
      setProviderEditingId(id);
      setProviderConfigMode('edit');
      setFormErrors({});
    },
    [setProviderEditingId, setProviderConfigMode, setFormErrors],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteProvider(id);
    },
    [deleteProvider],
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleProvider(id);
    },
    [toggleProvider],
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultProvider(id);
    },
    [setDefaultProvider],
  );

  const handleSubmit = useCallback(
    (data: ProviderFormData) => {
      if (providerConfigMode === 'add') {
        addProvider(data);
      } else if (providerConfigMode === 'edit' && providerEditingId) {
        updateProvider(providerEditingId, data);
      }
    },
    [providerConfigMode, providerEditingId, addProvider, updateProvider],
  );

  const handleCancel = useCallback(() => {
    setProviderConfigMode('list');
    setProviderEditingId(null);
    setFormErrors({});
  }, [setProviderConfigMode, setProviderEditingId, setFormErrors]);

  useInput((input, key) => {
    if (key.escape && providerConfigMode === 'list' && !providerSetupRequired) {
      closeProviderConfig();
    }
  });

  // Get initial data for edit mode
  const getInitialData = (): ProviderFormData | undefined => {
    if (providerConfigMode === 'edit' && providerEditingId) {
      const provider = providers.find((p) => p.id === providerEditingId);
      if (provider) {
        return {
          name: provider.name,
          type: provider.type,
          protocol: provider.type === 'custom' ? provider.protocol : undefined,
          model: provider.model,
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || '',
          temperature: provider.temperature?.toString() || '0.7',
          maxTokens: provider.maxTokens?.toString() || '4096',
        };
      }
    }
    return undefined;
  };

  return (
    <Box
      flexDirection="column"
      width={safeWidth}
      borderStyle="round"
      borderColor={colors.primary}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🤖 Provider Configuration
        </Text>
        {providerConfigMode === 'list' && !providerSetupRequired && (
          <Text color={colors.muted} dimColor>
            {' '}
            • Esc to close
          </Text>
        )}
      </Box>

      {providerSetupRequired && providerConfigMode === 'list' && (
        <Box
          marginBottom={1}
          paddingX={1}
          borderStyle="round"
          borderColor={colors.warning}
        >
          <Text color={colors.warning}>
            No provider configured! Please add a provider to continue.
          </Text>
        </Box>
      )}

      {providerError && (
        <Box marginBottom={1}>
          <Text color={colors.error}>{providerError}</Text>
        </Box>
      )}

      {providerConfigMode === 'list' && (
        <ProviderList
          colors={colors}
          providers={providers}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onSetDefault={handleSetDefault}
        />
      )}

      {(providerConfigMode === 'add' || providerConfigMode === 'edit') && (
        <ProviderForm
          colors={colors}
          mode={providerConfigMode}
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          errors={formErrors}
        />
      )}
    </Box>
  );
}

export { ProviderConfigPanel };
