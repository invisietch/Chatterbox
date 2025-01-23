import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Default is localStorage
import { PersistConfig } from 'redux-persist';
import modelReducer from './modelSlice';
import quickSettingsReducer from './quickSettingsSlice';

// Persist configuration
const persistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
};

// Create a persisted reducer
const modelPersistedReducer = persistReducer(persistConfig, modelReducer);
const quickSettingsPersistedReducer = persistReducer(persistConfig, quickSettingsReducer);

export const store = configureStore({
  reducer: {
    model: modelPersistedReducer,
    quickSettings: quickSettingsPersistedReducer,
  },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
