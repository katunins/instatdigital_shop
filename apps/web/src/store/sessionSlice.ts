import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type SessionState = {
  token: string | null;
  sessionId: string | null;
};

const initialState: SessionState = {
  token: null,
  sessionId: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ token: string; sessionId: string }>) {
      state.token = action.payload.token;
      state.sessionId = action.payload.sessionId;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
