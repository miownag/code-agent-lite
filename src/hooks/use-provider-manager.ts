import { useState, useCallback, useEffect } from 'react';
import type {
  ProviderFormData,
  ProviderFormErrors,
  OpenAIProviderConfig,
  AnthropicProviderConfig,
  CustomProviderConfig,
} from '@/types/provider';
import { providerConfigService } from '@/services/provider-config';
import codeAgent from '@/core';
import useSelectorStore from '@/stores';

export function useProviderManager() {
  const [formErrors, setFormErrors] = useState<ProviderFormErrors>({});

  const {
    setProviders,
    addProvider,
    updateProvider,
    removeProvider,
    setProviderError,
    setProviderConfigMode,
    setProviderEditingId,
    setProviderSetupRequired,
  } = useSelectorStore([
    'setProviders',
    'addProvider',
    'updateProvider',
    'removeProvider',
    'setProviderError',
    'setProviderConfigMode',
    'setProviderEditingId',
    'setProviderSetupRequired',
  ]);

  // Load providers on mount
  useEffect(() => {
    const providers = providerConfigService.getProviders();
    setProviders(providers);
  }, [setProviders]);

  // Validate form data
  const validateForm = useCallback((data: ProviderFormData): ProviderFormErrors => {
    const errors: ProviderFormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!data.model.trim()) {
      errors.model = 'Model is required';
    }

    // API key can be empty if provided via environment
    if (!data.apiKey.trim()) {
      const envKey = process.env[`${data.type.toUpperCase()}_API_KEY`];
      if (!envKey) {
        errors.apiKey = 'API Key is required (config or environment)';
      }
    }

    if (data.type === 'custom' && !data.baseURL.trim()) {
      errors.baseURL = 'Base URL is required for custom providers';
    }

    if (data.baseURL.trim()) {
      try {
        new URL(data.baseURL);
      } catch {
        errors.baseURL = 'Invalid URL format';
      }
    }

    if (data.temperature.trim()) {
      const temp = Number(data.temperature);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        errors.temperature = 'Temperature must be between 0 and 2';
      }
    }

    if (data.maxTokens.trim()) {
      const tokens = Number(data.maxTokens);
      if (isNaN(tokens) || tokens <= 0) {
        errors.maxTokens = 'Max tokens must be a positive number';
      }
    }

    return errors;
  }, []);

  // Convert form data to config
  const formDataToConfig = useCallback(
    (
      data: ProviderFormData,
    ):
      | Omit<OpenAIProviderConfig, 'id'>
      | Omit<AnthropicProviderConfig, 'id'>
      | Omit<CustomProviderConfig, 'id'> => {
      const baseConfig = {
        name: data.name.trim(),
        enabled: true,
      };

      const optionalFields: any = {};
      if (data.apiKey.trim()) {
        optionalFields.apiKey = data.apiKey.trim();
      }
      if (data.baseURL.trim()) {
        optionalFields.baseURL = data.baseURL.trim();
      }
      if (data.temperature.trim()) {
        optionalFields.temperature = Number(data.temperature);
      }
      if (data.maxTokens.trim()) {
        optionalFields.maxTokens = Number(data.maxTokens);
      }

      if (data.type === 'openai') {
        return {
          ...baseConfig,
          type: 'openai',
          model: data.model.trim(),
          apiKey: optionalFields.apiKey || '',
          ...optionalFields,
        } as Omit<OpenAIProviderConfig, 'id'>;
      } else if (data.type === 'anthropic') {
        return {
          ...baseConfig,
          type: 'anthropic',
          model: data.model.trim(),
          apiKey: optionalFields.apiKey || '',
          ...optionalFields,
        } as Omit<AnthropicProviderConfig, 'id'>;
      } else {
        return {
          ...baseConfig,
          type: 'custom',
          protocol: data.protocol || 'openai',
          model: data.model.trim(),
          apiKey: optionalFields.apiKey || '',
          baseURL: data.baseURL.trim(),
          ...optionalFields,
        } as Omit<CustomProviderConfig, 'id'>;
      }
    },
    [],
  );

  // Add a new provider
  const addNewProvider = useCallback(
    async (data: ProviderFormData) => {
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        setProviderError(null);
        const config = formDataToConfig(data);
        const newProvider = providerConfigService.addProvider(config);

        addProvider(newProvider);

        // Reinitialize agent to use new provider if it's the only one
        if (providerConfigService.getProviders().length === 1) {
          await codeAgent.reinitialize();
          setProviderSetupRequired(false);
        }

        // Go back to list
        setProviderConfigMode('list');
        setFormErrors({});
      } catch (error) {
        setProviderError(
          error instanceof Error ? error.message : 'Failed to add provider',
        );
      }
    },
    [
      validateForm,
      formDataToConfig,
      addProvider,
      setProviderError,
      setProviderConfigMode,
      setProviderSetupRequired,
    ],
  );

  // Update an existing provider
  const updateExistingProvider = useCallback(
    async (id: string, data: ProviderFormData) => {
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        setProviderError(null);
        const config = formDataToConfig(data);
        const updated = providerConfigService.updateProvider(id, config);

        if (updated) {
          updateProvider(id, updated);

          // Reinitialize agent if this is the default provider
          const defaultProvider = providerConfigService.getDefaultProvider();
          if (defaultProvider?.id === id) {
            await codeAgent.reinitialize();
          }
        }

        // Go back to list
        setProviderConfigMode('list');
        setProviderEditingId(null);
        setFormErrors({});
      } catch (error) {
        setProviderError(
          error instanceof Error ? error.message : 'Failed to update provider',
        );
      }
    },
    [
      validateForm,
      formDataToConfig,
      updateProvider,
      setProviderError,
      setProviderConfigMode,
      setProviderEditingId,
    ],
  );

  // Delete a provider
  const deleteExistingProvider = useCallback(
    async (id: string) => {
      try {
        setProviderError(null);
        const wasDefault = providerConfigService.getProviderById(id)?.isDefault;

        providerConfigService.deleteProvider(id);
        removeProvider(id);

        // Reinitialize agent if we deleted the default provider
        if (wasDefault && providerConfigService.hasValidProvider()) {
          await codeAgent.reinitialize();
        }
      } catch (error) {
        setProviderError(
          error instanceof Error ? error.message : 'Failed to delete provider',
        );
      }
    },
    [removeProvider, setProviderError],
  );

  // Toggle provider enabled/disabled
  const toggleExistingProvider = useCallback(
    async (id: string) => {
      try {
        setProviderError(null);
        const wasDefault = providerConfigService.getProviderById(id)?.isDefault;

        const updated = providerConfigService.toggleProvider(id);

        if (updated) {
          updateProvider(id, { enabled: updated.enabled, isDefault: updated.isDefault });

          // Reinitialize agent if we toggled the default provider
          if (wasDefault && !updated.enabled) {
            await codeAgent.reinitialize();
          }
        }
      } catch (error) {
        setProviderError(
          error instanceof Error ? error.message : 'Failed to toggle provider',
        );
      }
    },
    [updateProvider, setProviderError],
  );

  // Set default provider
  const setDefault = useCallback(
    async (id: string) => {
      try {
        setProviderError(null);
        const updated = providerConfigService.setDefaultProvider(id);

        if (updated) {
          // Update all providers in state
          const allProviders = providerConfigService.getProviders();
          setProviders(allProviders);

          // Reinitialize agent to use new default
          await codeAgent.reinitialize();
        }
      } catch (error) {
        setProviderError(
          error instanceof Error ? error.message : 'Failed to set default provider',
        );
      }
    },
    [setProviders, setProviderError],
  );

  return {
    validateForm,
    addProvider: addNewProvider,
    updateProvider: updateExistingProvider,
    deleteProvider: deleteExistingProvider,
    toggleProvider: toggleExistingProvider,
    setDefaultProvider: setDefault,
    formErrors,
    setFormErrors,
  };
}
