import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface UiState {
  alert: AlertState;
  filterOpen: boolean;
  topicFilter: string;
}

const initialState: UiState = {
  alert: {
    open: false,
    message: '',
    severity: 'success',
  },
  filterOpen: false,
  topicFilter: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<Omit<AlertState, 'open'>>) => {
      state.alert = {
        ...action.payload,
        open: true,
      };
    },
    hideAlert: (state) => {
      state.alert.open = false;
    },
    setFilterOpen: (state, action: PayloadAction<boolean>) => {
      state.filterOpen = action.payload;
    },
    setTopicFilter: (state, action: PayloadAction<string>) => {
      state.topicFilter = action.payload;
    },
    clearTopicFilter: (state) => {
      state.topicFilter = '';
    },
  },
});

export const { showAlert, hideAlert, setFilterOpen, setTopicFilter, clearTopicFilter } = uiSlice.actions;
export default uiSlice.reducer;