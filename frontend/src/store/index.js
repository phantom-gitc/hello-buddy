import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import learningReducer from './slices/learningSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    user: userReducer,
    learning: learningReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
