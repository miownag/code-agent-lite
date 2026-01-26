import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import type { ThemeColors, ProviderConfig } from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';

interface ProviderListProps {
  colors: ThemeColors;
  providers: ProviderConfig[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onSetDefault: (id: string) => void;
}

type ListAction =
  | { type: 'add' }
  | { type: 'edit'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string }
  | { type: 'setDefault'; id: string };

export default function ProviderList({
  colors,
  providers,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onSetDefault,
}: ProviderListProps) {
  const safeWidth = useSafeWidth(4);

  // Create items for SelectInput
  const items = [
    ...providers.map((provider) => ({
      key: provider.id,
      label: `${provider.enabled ? '🟢' : '⚫'} ${provider.name} [${provider.type}]${provider.isDefault ? ' [default]' : ''}`,
      value: provider.id,
    })),
    { key: 'add', label: '+ Add new provider', value: 'add' },
  ];

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'add') {
      onAdd();
    }
  };

  useInput((input, key) => {
    if (!key.ctrl && !key.meta) {
      // Find selected provider
      const selectedIndex = 0; // Default to first item
      const selectedId = items[selectedIndex]?.value;

      if (input === 'e' && selectedId !== 'add') {
        onEdit(selectedId);
      } else if (input === 'd' && selectedId !== 'add') {
        onDelete(selectedId);
      } else if (input === 't' && selectedId !== 'add') {
        onToggle(selectedId);
      } else if (input === 's' && selectedId !== 'add') {
        onSetDefault(selectedId);
      } else if (input === 'a') {
        onAdd();
      }
    }
  });

  const getProviderStatus = (provider: ProviderConfig): string => {
    if (!provider.enabled) {
      return '⚫ Disabled';
    }
    return '🟢 Enabled';
  };

  return (
    <Box flexDirection="column" width={safeWidth}>
      <Box marginBottom={1}>
        <Text bold color={colors.secondary}>
          Provider Configuration
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={colors.muted}>
          {providers.length} provider(s) configured
        </Text>
      </Box>

      {providers.length > 0 && (
        <Box marginBottom={1}>
          <Text color={colors.text}>
            Current:{' '}
            {providers.find((p) => p.isDefault)?.name || 'None'}
          </Text>
        </Box>
      )}

      <SelectInput
        items={items}
        onSelect={handleSelect}
        itemComponent={({ isSelected, label }) => (
          <Box>
            <Text color={isSelected ? colors.primary : colors.text}>
              {isSelected ? '❯ ' : '  '}
              {label}
            </Text>
          </Box>
        )}
        indicatorComponent={() => null}
      />

      {providers.length > 0 && (
        <Box marginTop={1} flexDirection="column" gap={0}>
          <Text color={colors.muted} dimColor>
            Actions: [A]dd [E]dit [D]elete [T]oggle [S]et default
          </Text>
          <Text color={colors.muted} dimColor>
            Enter to select • Esc to close
          </Text>
        </Box>
      )}

      {providers.length === 0 && (
        <Box marginTop={1}>
          <Text color={colors.warning}>
            No providers configured. Add one to get started.
          </Text>
        </Box>
      )}
    </Box>
  );
}

export { ProviderList };
