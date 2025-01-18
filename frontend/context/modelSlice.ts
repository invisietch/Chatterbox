import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state for the selected model
interface ModelState {
  selectedModel: string;
}

export const initialState: ModelState = {
  selectedModel: 'unsloth/Llama-3.3-70B-Instruct',  // Default model
};

// Create the slice
const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    // Action to update the selected model
    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
  },
});

// Export the action to change the model
export const { setSelectedModel } = modelSlice.actions;

// Export the reducer to use in the store
export default modelSlice.reducer;
