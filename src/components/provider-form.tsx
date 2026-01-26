import { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type {
  ThemeColors,
  ProviderType,
  ProviderFormData,
  ProviderFormErrors,
} from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';

interface ProviderFormProps {
  colors: ThemeColors;
  mode: 'add' | 'edit';
  initialData?: ProviderFormData;
  onSubmit: (data: ProviderFormData) => void;
  onCancel: () => void;
  errors?: ProviderFormErrors;
}

type FormStep = 'type' | 'details';

const PROVIDER_TYPE_OPTIONS = [
  { label: 'OpenAI (GPT-4, GPT-3.5, etc.)', value: 'openai' as ProviderType },
  { label: 'Anthropic (Claude)', value: 'anthropic' as ProviderType },
  {
    label: 'Custom Endpoint (OpenAI-compatible)',
    value: 'custom-openai' as const,
  },
  {
    label: 'Custom Endpoint (Anthropic-compatible)',
    value: 'custom-anthropic' as const,
  },
];

const BASE_FIELDS = ['name', 'model', 'apiKey'] as const;
const OPTIONAL_FIELDS = ['baseURL', 'temperature', 'maxTokens'] as const;

type BaseField = (typeof BASE_FIELDS)[number];
type OptionalField = (typeof OPTIONAL_FIELDS)[number];
type FormField = BaseField | OptionalField;

const FIELD_LABELS: Record<FormField, string> = {
  name: 'Name',
  model: 'Model',
  apiKey: 'API Key',
  baseURL: 'Base URL',
  temperature: 'Temperature',
  maxTokens: 'Max Tokens',
};

const FIELD_PLACEHOLDERS: Record<FormField, string> = {
  name: 'GPT-4',
  model: 'gpt-4-turbo-preview',
  apiKey: 'sk-...',
  baseURL: 'https://api.openai.com/v1',
  temperature: '0.7',
  maxTokens: '4096',
};

const DEFAULT_FORM: ProviderFormData = {
  name: '',
  type: 'openai',
  model: '',
  apiKey: '',
  baseURL: '',
  temperature: '0.7',
  maxTokens: '4096',
};

export default function ProviderForm({
  colors,
  mode,
  initialData,
  onSubmit,
  onCancel,
  errors = {},
}: ProviderFormProps) {
  const safeWidth = useSafeWidth(4);
  const [step, setStep] = useState<FormStep>(mode === 'edit' ? 'details' : 'type');
  const [formData, setFormData] = useState<ProviderFormData>(
    initialData || DEFAULT_FORM,
  );
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

  // Determine which fields to show based on provider type
  const getFieldsForType = useCallback(
    (type: ProviderType, isCustom: boolean): FormField[] => {
      const fields: FormField[] = [...BASE_FIELDS];

      // Add baseURL for custom providers (it's required) or optional for others
      if (isCustom) {
        fields.push('baseURL');
      }

      // Add optional fields
      fields.push(...OPTIONAL_FIELDS);

      // Remove baseURL from optional if already added
      const finalFields = fields.filter(
        (f, i, arr) => arr.indexOf(f) === i,
      );

      return finalFields;
    },
    [],
  );

  const currentFields = getFieldsForType(
    formData.type,
    formData.type === 'custom',
  );

  const updateField = useCallback((field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTypeSelect = useCallback(
    (item: { value: ProviderType | 'custom-openai' | 'custom-anthropic' }) => {
      if (item.value === 'custom-openai') {
        setFormData((prev) => ({ ...prev, type: 'custom', protocol: 'openai' }));
      } else if (item.value === 'custom-anthropic') {
        setFormData((prev) => ({ ...prev, type: 'custom', protocol: 'anthropic' }));
      } else {
        setFormData((prev) => ({ ...prev, type: item.value as ProviderType }));
      }
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
            setStep('type');
          } else {
            onCancel();
          }
        }
      } else if (step === 'type') {
        if (key.escape) {
          onCancel();
        }
      }
    },
    { isActive: true },
  );

  // Type selection step
  if (step === 'type') {
    return (
      <Box flexDirection="column" width={safeWidth}>
        <Box marginBottom={1}>
          <Text bold color={colors.secondary}>
            Step 1: Select Provider Type
          </Text>
        </Box>

        <SelectInput
          items={PROVIDER_TYPE_OPTIONS}
          onSelect={handleTypeSelect}
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
  const isFieldRequired = (field: FormField): boolean => {
    if (BASE_FIELDS.includes(field as BaseField)) {
      return true;
    }
    if (field === 'baseURL' && formData.type === 'custom') {
      return true;
    }
    return false;
  };

  const maskApiKey = (value: string): string => {
    if (!value || value.length <= 8) return value;
    return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
  };

  return (
    <Box flexDirection="column" width={safeWidth}>
      <Box marginBottom={1}>
        <Text bold color={colors.secondary}>
          Step 2: Configure{' '}
          {formData.type === 'openai'
            ? 'OpenAI'
            : formData.type === 'anthropic'
              ? 'Anthropic'
              : `Custom (${formData.protocol})`}{' '}
          Provider
        </Text>
      </Box>

      {currentFields.map((field, index) => {
        const isActive = index === activeFieldIndex;
        const error = errors[field as keyof ProviderFormErrors];
        const isRequired = isFieldRequired(field);
        const fieldValue = formData[field];

        return (
          <Box key={field} flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={isActive ? colors.primary : colors.muted}>
                {isActive ? '❯' : ' '}
              </Text>
              <Text color={isActive ? colors.primary : colors.text}>
                {FIELD_LABELS[field]}
                {isRequired && <Text color={colors.error}>*</Text>}:
              </Text>
            </Box>
            <Box marginLeft={2}>
              {isActive ? (
                <Box borderStyle="round" borderColor={colors.primary} paddingX={1}>
                  <TextInput
                    value={fieldValue}
                    onChange={(value) => updateField(field, value)}
                    placeholder={FIELD_PLACEHOLDERS[field]}
                    mask={field === 'apiKey' ? undefined : undefined}
                  />
                </Box>
              ) : (
                <Text color={colors.muted}>
                  {field === 'apiKey' && fieldValue
                    ? maskApiKey(fieldValue)
                    : fieldValue || FIELD_PLACEHOLDERS[field]}
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

export { ProviderForm };
