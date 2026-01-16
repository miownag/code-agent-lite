import { create } from 'zustand';

type State = {
  inputValue: string;
  showCommandPalette: boolean;
};

type Action = {
  updateInputValue: (inputValue: State['inputValue']) => void;
  updateShowCommandPalette: (
    showCommandPalette: State['showCommandPalette'],
  ) => void;
};

const useCodeStore = create<State & Action>((set) => ({
  inputValue: '',
  showCommandPalette: false,
  updateInputValue: (inputValue) => set({ inputValue }),
  updateShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
}));

export default useCodeStore;
