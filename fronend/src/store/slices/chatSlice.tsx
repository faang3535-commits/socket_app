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
         const exists = state.messages.some((m: any) => 
            (action.payload.id && m.id === action.payload.id) || 
            (action.payload.tempId && m.tempId === action.payload.tempId)
         );
         if (!exists) {
            state.messages.push(action.payload);
         }
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
      updateReaction: (state, action: PayloadAction<{ messageId?: string, tempId?: string, reaction: string }>) => {
         const { messageId, tempId, reaction } = action.payload;
         state.messages = state.messages.map((m: any) => {
            if ((messageId && m.id === messageId) || (tempId && m.tempId === tempId)) {
               return { ...m, reaction };
            }
            return m;
         });
      },
   },
});

export const { setMessages, addMessage, setSelectedUser, setIsTyping, setLastSeenChat, clearMessages, updateReaction } = chatSlice.actions;
export default chatSlice.reducer;

