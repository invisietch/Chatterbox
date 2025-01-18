import { configureStore } from '@reduxjs/toolkit';
import modelReducer from './modelSlice';

export const store = configureStore({
  reducer: {
    model: modelReducer,  // Registering the model slice
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
