import { pick } from 'es-toolkit';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

type State = {
  inputValue: string;
  showCommandPalette: boolean;
  showFileSelector: boolean;
  fileSelectorPath: string;
  inputKey: number;
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
};

const useCodeStore = create<State & Action>((set) => ({
  inputValue: '',
  showCommandPalette: false,
  showFileSelector: false,
  fileSelectorPath: '',
  inputKey: 0,
  updateInputValue: (inputValue) => set({ inputValue }),
  updateShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
  updateShowFileSelector: (showFileSelector) => set({ showFileSelector }),
  updateFileSelectorPath: (fileSelectorPath) => set({ fileSelectorPath }),
  resetFileSelector: () =>
    set({ fileSelectorPath: '', showFileSelector: false }),
  updateInputValueAndResetCursor: (inputValue) =>
    set((state) => ({ inputValue, inputKey: state.inputKey + 1 })),
}));

const useSelectorStore = <T extends (keyof (State & Action))[]>(
  keys: T,
): Pick<State & Action, T[number]> =>
  useCodeStore(useShallow((state) => pick(state, keys)));

export default useSelectorStore;
