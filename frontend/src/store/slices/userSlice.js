import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: {
    id: 'user_1',
    name: 'Rohit Kumar',
    email: 'rohit@skillora.ai',
    plan: 'Free Plan',
    avatarUrl: '/assets/avatar.png',
    unreadNotifications: 2,
  },
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
  },
});

export const { updateProfile } = userSlice.actions;
export default userSlice.reducer;
