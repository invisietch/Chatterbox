import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModelState {
  selectedModel: string; // Model name
  samplers: Record<string, any>; // Sampler settings
  samplerOrder: number[]; // Order of samplers
  llmUrl: string; // LLM URL
  selectedPresetId: string | null; // Selected preset ID
  maxContext: number | null;
  engine: string;
  apiKey: string | null;
}

const initialState: ModelState = {
  selectedModel: '',
  samplers: {},
  samplerOrder: [],
  llmUrl: '',
  selectedPresetId: null,
  maxContext: null,
  engine: 'kobold',
  apiKey: null,
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setPreset(state, action: PayloadAction<ModelState>) {
      return { ...state, ...action.payload };
    },
    setSelectedPresetId(state, action: PayloadAction<string | null>) {
      state.selectedPresetId = action.payload;
    },
  },
});

export const { setPreset, setSelectedPresetId } = modelSlice.actions;
export default modelSlice.reducer;
