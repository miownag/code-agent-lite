import { pick } from 'es-toolkit';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { MCPServerConfig, MCPServerState } from '@/types';
import type { ProviderConfig } from '@/types/provider';

export type MCPConfigMode = 'list' | 'add' | 'edit';
export type ProviderConfigMode = 'list' | 'add' | 'edit';

type State = {
  inputValue: string;
  showCommandPalette: boolean;
  showFileSelector: boolean;
  fileSelectorPath: string;
  inputKey: number;
  latestToolCallCollapsed: boolean;
  // MCP state
  showMcpConfig: boolean;
  mcpConfigMode: MCPConfigMode;
  mcpEditingServerId: string | null;
  mcpServers: MCPServerConfig[];
  mcpServerStates: Record<string, MCPServerState>;
  mcpIsConnecting: boolean;
  mcpError: string | null;
  // Provider state
  showProviderConfig: boolean;
  providerConfigMode: ProviderConfigMode;
  providerEditingId: string | null;
  providers: ProviderConfig[];
  providerError: string | null;
  providerSetupRequired: boolean;
};

type Action = {
  updateInputValue: (inputValue: State['inputValue']) => void;
  updateShowCommandPalette: (
    showCommandPalette: State['showCommandPalette'],
  ) => void;
  updateShowFileSelector: (showFileSelector: State['showFileSelector']) => void;
  updateFileSelectorPath: (path: string) => void;
  resetFileSelector: () => void;
  updateInputValueAndResetCursor: (inputValue: string) => void;
  toggleLatestToolCallCollapsed: () => void;
  // MCP actions
  updateShowMcpConfig: (show: boolean) => void;
  setMcpConfigMode: (mode: MCPConfigMode) => void;
  setMcpEditingServerId: (id: string | null) => void;
  setMcpServers: (servers: MCPServerConfig[]) => void;
  addMcpServer: (server: MCPServerConfig) => void;
  updateMcpServer: (id: string, updates: Partial<MCPServerConfig>) => void;
  removeMcpServer: (id: string) => void;
  setMcpServerStates: (states: Record<string, MCPServerState>) => void;
  setMcpIsConnecting: (connecting: boolean) => void;
  setMcpError: (error: string | null) => void;
  closeMcpConfig: () => void;
  // Provider actions
  updateShowProviderConfig: (show: boolean) => void;
  setProviderConfigMode: (mode: ProviderConfigMode) => void;
  setProviderEditingId: (id: string | null) => void;
  setProviders: (providers: ProviderConfig[]) => void;
  addProvider: (provider: ProviderConfig) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  removeProvider: (id: string) => void;
  setProviderError: (error: string | null) => void;
  setProviderSetupRequired: (required: boolean) => void;
  closeProviderConfig: () => void;
};

const useCodeStore = create<State & Action>((set) => ({
  inputValue: '',
  showCommandPalette: false,
  showFileSelector: false,
  fileSelectorPath: '',
  inputKey: 0,
  latestToolCallCollapsed: false,
  // MCP initial state
  showMcpConfig: false,
  mcpConfigMode: 'list',
  mcpEditingServerId: null,
  mcpServers: [],
  mcpServerStates: {},
  mcpIsConnecting: false,
  mcpError: null,
  // Provider initial state
  showProviderConfig: false,
  providerConfigMode: 'list',
  providerEditingId: null,
  providers: [],
  providerError: null,
  providerSetupRequired: false,

  updateInputValue: (inputValue) => set({ inputValue }),
  updateShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
  updateShowFileSelector: (showFileSelector) => set({ showFileSelector }),
  updateFileSelectorPath: (fileSelectorPath) => set({ fileSelectorPath }),
  resetFileSelector: () =>
    set({ fileSelectorPath: '', showFileSelector: false }),
  updateInputValueAndResetCursor: (inputValue) =>
    set((state) => ({ inputValue, inputKey: state.inputKey + 1 })),
  toggleLatestToolCallCollapsed: () =>
    set((state) => ({
      latestToolCallCollapsed: !state.latestToolCallCollapsed,
    })),

  // MCP actions
  updateShowMcpConfig: (showMcpConfig) => set({ showMcpConfig }),
  setMcpConfigMode: (mcpConfigMode) => set({ mcpConfigMode }),
  setMcpEditingServerId: (mcpEditingServerId) => set({ mcpEditingServerId }),
  setMcpServers: (mcpServers) => set({ mcpServers }),
  addMcpServer: (server) =>
    set((state) => ({ mcpServers: [...state.mcpServers, server] })),
  updateMcpServer: (id, updates) =>
    set((state) => ({
      mcpServers: state.mcpServers.map((s) =>
        s.id === id ? ({ ...s, ...updates } as MCPServerConfig) : s,
      ),
    })),
  removeMcpServer: (id) =>
    set((state) => ({
      mcpServers: state.mcpServers.filter((s) => s.id !== id),
    })),
  setMcpServerStates: (mcpServerStates) => set({ mcpServerStates }),
  setMcpIsConnecting: (mcpIsConnecting) => set({ mcpIsConnecting }),
  setMcpError: (mcpError) => set({ mcpError }),
  closeMcpConfig: () =>
    set({
      showMcpConfig: false,
      mcpConfigMode: 'list',
      mcpEditingServerId: null,
      mcpError: null,
    }),

  // Provider actions
  updateShowProviderConfig: (showProviderConfig) => set({ showProviderConfig }),
  setProviderConfigMode: (providerConfigMode) => set({ providerConfigMode }),
  setProviderEditingId: (providerEditingId) => set({ providerEditingId }),
  setProviders: (providers) => set({ providers }),
  addProvider: (provider) =>
    set((state) => ({ providers: [...state.providers, provider] })),
  updateProvider: (id, updates) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === id ? ({ ...p, ...updates } as ProviderConfig) : p,
      ),
    })),
  removeProvider: (id) =>
    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id),
    })),
  setProviderError: (providerError) => set({ providerError }),
  setProviderSetupRequired: (providerSetupRequired) =>
    set({ providerSetupRequired }),
  closeProviderConfig: () =>
    set({
      showProviderConfig: false,
      providerConfigMode: 'list',
      providerEditingId: null,
      providerError: null,
    }),
}));

const useSelectorStore = <T extends (keyof (State & Action))[]>(
  keys: T,
): Pick<State & Action, T[number]> =>
  useCodeStore(useShallow((state) => pick(state, keys)));

export default useSelectorStore;
