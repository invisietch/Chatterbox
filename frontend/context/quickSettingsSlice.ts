import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuickSettingsState {
  rpMode: boolean;
}

const initialState: QuickSettingsState = {
  rpMode: false,
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
