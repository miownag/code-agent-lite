import { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type {
  ThemeColors,
  MCPTransport,
  MCPFormData,
  MCPFormErrors,
  DEFAULT_FORM_DATA,
} from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';

interface MCPServerFormProps {
  colors: ThemeColors;
  mode: 'add' | 'edit';
  initialData?: MCPFormData;
  onSubmit: (data: MCPFormData) => void;
  onCancel: () => void;
  errors?: MCPFormErrors;
}

type FormStep = 'transport' | 'details';

const TRANSPORT_OPTIONS = [
  { label: 'stdio (Command-line program)', value: 'stdio' as MCPTransport },
  { label: 'HTTP (Network service)', value: 'http' as MCPTransport },
];

const STDIO_FIELDS = ['name', 'command', 'args', 'env', 'cwd'] as const;
const HTTP_FIELDS = ['name', 'url', 'headers'] as const;

type StdioField = (typeof STDIO_FIELDS)[number];
type HttpField = (typeof HTTP_FIELDS)[number];
type FormField = StdioField | HttpField;

const FIELD_LABELS: Record<FormField, string> = {
  name: 'Name',
  command: 'Command',
  args: 'Arguments (JSON array)',
  env: 'Environment (JSON object)',
  cwd: 'Working Directory',
  url: 'URL',
  headers: 'Headers (JSON object)',
};

const FIELD_PLACEHOLDERS: Record<FormField, string> = {
  name: 'my-mcp-server',
  command: 'npx',
  args: '["@anthropic-ai/mcp-server-demo"]',
  env: '{"API_KEY": "xxx"}',
  cwd: '/path/to/working/dir',
  url: 'http://localhost:8000/mcp',
  headers: '{"Authorization": "Bearer xxx"}',
};

const DEFAULT_FORM: MCPFormData = {
  name: '',
  transport: 'stdio',
  command: '',
  args: '',
  env: '',
  cwd: '',
  url: '',
  headers: '',
};

export default function MCPServerForm({
  colors,
  mode,
  initialData,
  onSubmit,
  onCancel,
  errors = {},
}: MCPServerFormProps) {
  const safeWidth = useSafeWidth(4);
  const [step, setStep] = useState<FormStep>(
    mode === 'edit' ? 'details' : 'transport',
  );
  const [formData, setFormData] = useState<MCPFormData>(
    initialData || DEFAULT_FORM,
  );
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

  const currentFields =
    formData.transport === 'stdio' ? STDIO_FIELDS : HTTP_FIELDS;

  const updateField = useCallback(
    (field: FormField, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleTransportSelect = useCallback(
    (item: { value: MCPTransport }) => {
      setFormData((prev) => ({ ...prev, transport: item.value }));
      setStep('details');
      setActiveFieldIndex(0);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  useInput(
    (input, key) => {
      if (step === 'details') {
        if (key.tab || (key.downArrow && !key.shift)) {
          setActiveFieldIndex((prev) =>
            prev < currentFields.length - 1 ? prev + 1 : 0,
          );
        } else if (key.upArrow || (key.tab && key.shift)) {
          setActiveFieldIndex((prev) =>
            prev > 0 ? prev - 1 : currentFields.length - 1,
          );
        } else if (key.return && !key.shift) {
          handleSubmit();
        } else if (key.escape) {
          if (mode === 'add' && step === 'details') {
            setStep('transport');
          } else {
            onCancel();
          }
        }
      } else if (step === 'transport') {
        if (key.escape) {
          onCancel();
        }
      }
    },
    { isActive: true },
  );

  // Transport selection step
  if (step === 'transport') {
    return (
      <Box flexDirection="column" width={safeWidth}>
        <Box marginBottom={1}>
          <Text bold color={colors.secondary}>
            Step 1: Select Transport Type
          </Text>
        </Box>

        <SelectInput
          items={TRANSPORT_OPTIONS}
          onSelect={handleTransportSelect}
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

        <Box marginTop={1}>
          <Text color={colors.muted} dimColor>
            Esc to cancel
          </Text>
        </Box>
      </Box>
    );
  }

  // Details form step
  return (
    <Box flexDirection="column" width={safeWidth}>
      <Box marginBottom={1}>
        <Text bold color={colors.secondary}>
          Step 2: Configure {formData.transport === 'stdio' ? 'stdio' : 'HTTP'}{' '}
          Server
        </Text>
      </Box>

      {currentFields.map((field, index) => {
        const isActive = index === activeFieldIndex;
        const error = errors[field as keyof MCPFormErrors];
        const isRequired = field === 'name' || field === 'command' || field === 'url';

        return (
          <Box key={field} flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={isActive ? colors.primary : colors.muted}>
                {isActive ? '❯' : ' '}
              </Text>
              <Text color={isActive ? colors.primary : colors.text}>
                {FIELD_LABELS[field]}
                {isRequired && (
                  <Text color={colors.error}>*</Text>
                )}
                :
              </Text>
            </Box>
            <Box marginLeft={2}>
              {isActive ? (
                <Box borderStyle="round" borderColor={colors.primary} paddingX={1}>
                  <TextInput
                    value={formData[field]}
                    onChange={(value) => updateField(field, value)}
                    placeholder={FIELD_PLACEHOLDERS[field]}
                  />
                </Box>
              ) : (
                <Text color={colors.muted}>
                  {formData[field] || FIELD_PLACEHOLDERS[field]}
                </Text>
              )}
            </Box>
            {error && (
              <Box marginLeft={2}>
                <Text color={colors.error}>{error}</Text>
              </Box>
            )}
          </Box>
        );
      })}

      <Box marginTop={1} gap={2}>
        <Text color={colors.muted} dimColor>
          Tab/↑↓ to navigate
        </Text>
        <Text color={colors.muted} dimColor>
          Enter to {mode === 'add' ? 'add' : 'save'}
        </Text>
        <Text color={colors.muted} dimColor>
          Esc to {mode === 'add' ? 'go back' : 'cancel'}
        </Text>
      </Box>
    </Box>
  );
}

export { MCPServerForm };
