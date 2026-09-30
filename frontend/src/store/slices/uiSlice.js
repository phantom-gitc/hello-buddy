import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'Home',
  searchQuery: '',
  isSidebarOpen: true,
  filterTimeRange: 'This Month',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setFilterTimeRange: (state, action) => {
      state.filterTimeRange = action.payload;
    },
  },
});

export const { setActiveTab, setSearchQuery, toggleSidebar, setFilterTimeRange } = uiSlice.actions;
export default uiSlice.reducer;
