import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  notificationCount: 0,
  unreadCounts: {},
  activeChatUserId: null,
  lastMessages: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    setNotificationCount: (state, action) => {
      state.notificationCount = Math.max(0, action.payload);
    },
    incrementNotificationCount: (state) => {
      state.notificationCount += 1;
    },
    decrementNotificationCount: (state) => {
      state.notificationCount = Math.max(0, state.notificationCount - 1);
    },
    clearNotifications: (state) => {
      state.notificationCount = 0;
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload;
    },
    incrementUnreadForUser: (state, action) => {
      const userId = action.payload;
      state.unreadCounts[userId] = (state.unreadCounts[userId] || 0) + 1;
    },
    clearUnreadForUser: (state, action) => {
      delete state.unreadCounts[action.payload];
    },
    setActiveChatUserId: (state, action) => {
      state.activeChatUserId = action.payload;
    },
    setLastMessages: (state, action) => {
      state.lastMessages = action.payload;
    },
    setLastMessageForUser: (state, action) => {
      state.lastMessages[action.payload.userId] = action.payload.message;
    },
    clearLastMessageForUser: (state, action) => {
      delete state.lastMessages[action.payload];
    },
    clearLastMessageIfMatches: (state, action) => {
      const { userId, messageId } = action.payload;
      if (state.lastMessages[userId]?.id === messageId) delete state.lastMessages[userId];
    },
  },
});

export const {
  setConversations, setActiveConversation, setMessages, addMessage,
  setOnlineUsers, setTypingUsers, setNotificationCount,
  incrementNotificationCount, decrementNotificationCount, clearNotifications, setUnreadCounts,
  incrementUnreadForUser, clearUnreadForUser,
  setActiveChatUserId, setLastMessages, setLastMessageForUser,
  clearLastMessageForUser,
  clearLastMessageIfMatches,
} = chatSlice.actions;
export default chatSlice.reducer;
