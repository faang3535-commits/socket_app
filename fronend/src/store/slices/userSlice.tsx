import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SessionState {
   session: any;
}

const initialState: SessionState = {
   session: null,
};

const sessionSlice = createSlice({
   name: 'session',
   initialState,
   reducers: {
      setSession: (state, action: PayloadAction<any>) => {
         state.session = action.payload;
      },
   }, 
});

export const { setSession } = sessionSlice.actions;
export default sessionSlice.reducer;
