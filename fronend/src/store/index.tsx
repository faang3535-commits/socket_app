import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import sessionReducer from "./slices/userSlice";

export const store = configureStore({
   reducer: {
      chat: chatReducer,
      session: sessionReducer,
   },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
