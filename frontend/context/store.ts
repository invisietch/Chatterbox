import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Default is localStorage
import { PersistConfig } from 'redux-persist';
import modelReducer from './modelSlice';

// Persist configuration
const persistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, modelReducer);

export const store = configureStore({
  reducer: {
    model: persistedReducer, // Persisted reducer
  },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
