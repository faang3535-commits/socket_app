import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
   messages: any[];
   selectedUser: any;
   lastSeenChat: string;
   isTyping: boolean;
}

const initialState: ChatState = {
   messages: [],
   selectedUser: null,
   lastSeenChat: '',
   isTyping: false,
};

const chatSlice = createSlice({
   name: 'chat',
   initialState,
   reducers: {
      setMessages: (state, action: PayloadAction<any>) => {
         state.messages = action.payload;
      },
      addMessage: (state, action: PayloadAction<any>) => {
         state.messages.push(action.payload);
      },
      setSelectedUser: (state, action: PayloadAction<any>) => {
         state.selectedUser = action.payload;
      },
      setIsTyping: (state, action: PayloadAction<boolean>) => {
         state.isTyping = action.payload;
      },
      setLastSeenChat: (state, action: PayloadAction<string>) => {
         state.lastSeenChat = action.payload;
      },
      clearMessages: (state) => {
         state.messages = [];
      },
   }, 
});

export const { setMessages, addMessage, setSelectedUser, setIsTyping, setLastSeenChat, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;

