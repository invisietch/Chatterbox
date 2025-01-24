import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuickSettingsState {
  rpMode: boolean;
  authorsNote?: string;
  authorsNoteLoc?: number;
  realTimeProcessText: boolean;
}

const initialState: QuickSettingsState = {
  rpMode: false,
  authorsNote: undefined,
  authorsNoteLoc: undefined,
  realTimeProcessText: false,
};

const quickSettingsSlice = createSlice({
  name: 'quick-settings',
  initialState,
  reducers: {
    setQuickSettings(state, action: PayloadAction<QuickSettingsState>) {
      return { ...state, ...action.payload };
    }
  },
});

export const { setQuickSettings } = quickSettingsSlice.actions;
export default quickSettingsSlice.reducer;
