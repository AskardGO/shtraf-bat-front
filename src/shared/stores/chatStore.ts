import { create } from 'zustand';
import { apiService, Chat, Message } from '../api';
import { wsClient, SocketMessage, TypingEvent } from '../api/websocketClient';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  messagesPagination: Record<string, { hasMore: boolean; loading: boolean; offset: number }>;
  scrollPositions: Record<string, number>
  activeChat: string | null
  activeChatId: string | null;
  typingUsers: Record<string, string[]>
  loading: boolean
  isConnected: boolean;
  lastUpdate: number

  loadChats: () => Promise<void>
  subscribeChats: (userId: string) => Promise<void>;
  disconnectWebSocket: () => void;
  loadMessages: (chatId: string, limit?: number, offset?: number) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  createChat: (participantIds: string[]) => Promise<Chat>;
  saveScrollPosition: (chatId: string, position: number) => void;
  getScrollPosition: (chatId: string) => number | null
  
  handleIncomingMessage: (data: SocketMessage) => void
  handleTyping: (data: TypingEvent) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  messagesPagination: {},
  scrollPositions: {},
  activeChat: null,
  activeChatId: null,
  typingUsers: {},
  loading: false,
  isConnected: false,
  lastUpdate: Date.now(),

  loadChats: async () => {
    try {
      set({ loading: true });
      const chats = await apiService.getMyChats();
      set({ chats, loading: false });
      
      const { loadMessages } = get();
      await Promise.all(chats.map(chat => loadMessages(chat.id, 5, 0)));
    } catch (error) {
      console.error('Failed to load chats:', error);
      set({ loading: false });
    }
  },

  subscribeChats: async (userId: string) => {
    const { isConnected } = get();
    
    if (isConnected && wsClient.isConnected && wsClient.userId === userId) {
      return;
    }

    try {
      set({ loading: true });
      const chats = await apiService.getMyChats();
      set({ chats, loading: false });
      
      const { loadMessages } = get();
      await Promise.all(chats.map(chat => loadMessages(chat.id, 5, 0)));
      
      if (!wsClient.isConnected || wsClient.userId !== userId) {
        wsClient.connect(userId);
        set({ isConnected: true });
      }
    } catch (error) {
      console.error('Failed to subscribe to chats:', error);
      set({ loading: false });
    }
  },

  disconnectWebSocket: () => {
    wsClient.disconnect();
    set({ isConnected: false });
  },

  loadMessages: async (chatId: string, limit: number = 50, offset: number = 0) => {
    try {
      const { messagesPagination } = get();
      
      set({
        messagesPagination: {
          ...messagesPagination,
          [chatId]: {
            ...messagesPagination[chatId],
            loading: true
          }
        }
      });

      const chatMessages = await apiService.getChatMessages(chatId, limit, offset);
      
      const { messages } = get();
      const existingMessages = messages[chatId] || [];
      
      const updatedMessages = offset === 0 
        ? chatMessages 
        : [...chatMessages, ...existingMessages];

      set({
        messages: {
          ...messages,
          [chatId]: updatedMessages
        },
        messagesPagination: {
          ...messagesPagination,
          [chatId]: {
            hasMore: chatMessages.length === limit,
            loading: false,
            offset: offset + chatMessages.length
          }
        },
        lastUpdate: Date.now()
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      const { messages, messagesPagination } = get();
      
      set({
        messages: {
          ...messages,
          [chatId]: messages[chatId] || []
        },
        messagesPagination: {
          ...messagesPagination,
          [chatId]: {
            hasMore: false,
            loading: false,
            offset: 0
          }
        },
        lastUpdate: Date.now()
      });
    }
  },

  loadMoreMessages: async (chatId: string) => {
    const { messagesPagination } = get();
    const pagination = messagesPagination[chatId];
    
    if (!pagination || pagination.loading || !pagination.hasMore) {
      return;
    }

    await get().loadMessages(chatId, 50, pagination.offset);
  },

  sendMessage: async (chatId: string, text: string) => {
    const { messages } = get();
    const chatMessages = messages[chatId] || [];
    
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: wsClient.userId || '',
      text,
      createdAt: new Date(),
      isPending: true
    };
    
    set({
      messages: {
        ...messages,
        [chatId]: [...chatMessages, optimisticMessage]
      },
      lastUpdate: Date.now()
    });
    
    try {
      wsClient.sendMessage(chatId, text);
      
      const { messages: currentMessages } = get();
      const currentChatMessages = currentMessages[chatId] || [];
      const updatedMessages = currentChatMessages.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, isPending: false, isSent: true }
          : msg
      );
      
      set({
        messages: {
          ...currentMessages,
          [chatId]: updatedMessages
        },
        lastUpdate: Date.now()
      });
      
      const timeoutId = setTimeout(() => {
        const { messages: latestMessages } = get();
        const latestChatMessages = latestMessages[chatId] || [];
        const stillExists = latestChatMessages.find(msg => msg.id === optimisticMessage.id);
        
        if (stillExists) {}
      }, 5000);
      
      (optimisticMessage as any).timeoutId = timeoutId;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const { messages: currentMessages } = get();
      const currentChatMessages = currentMessages[chatId] || [];
      const updatedMessages = currentChatMessages.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, isPending: false, isFailed: true }
          : msg
      );
      
      set({
        messages: {
          ...currentMessages,
          [chatId]: updatedMessages
        },
        lastUpdate: Date.now()
      });
      
      throw error;
    }
  },

  setActiveChat: (chatId: string | null) => {
    set({ activeChat: chatId, activeChatId: chatId });
    
    if (chatId) {
      get().loadMessages(chatId);
    }
  },

  createChat: async (participantIds: string[]) => {
    try {
      const chat = await apiService.createChat(participantIds);
      const { chats } = get();
      set({ chats: [...chats, chat] });
      return chat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  },

  handleIncomingMessage: (data: SocketMessage) => {
    const { messages } = get();
    const chatMessages = messages[data.chatId] || [];
    
    const messageExists = chatMessages.find(msg => msg.id === data.message.id);
    if (messageExists) {
      return;
    }
    
    const currentUserId = wsClient.userId;
    const isFromCurrentUser = data.message.senderId === currentUserId;
    
    let filteredMessages = chatMessages;
    if (isFromCurrentUser) {
      chatMessages.forEach(msg => {
        if (msg.id.startsWith('temp-') && (msg as any).timeoutId) {
          clearTimeout((msg as any).timeoutId);
        }
      });
      filteredMessages = chatMessages.filter(msg => !msg.id.startsWith('temp-'));
    }
    
    const newMessages = {
      ...messages,
      [data.chatId]: [...filteredMessages, data.message]
    };
    
    set({
      messages: newMessages,
      lastUpdate: Date.now()
    });
  },

  handleTyping: (data: TypingEvent) => {
    const { typingUsers } = get();
    const chatTypingUsers = typingUsers[data.chatId] || [];
    
    let newTypingUsers: string[];
    if (data.isTyping) {
      newTypingUsers = chatTypingUsers.includes(data.userId) 
        ? chatTypingUsers 
        : [...chatTypingUsers, data.userId];
    } else {
      newTypingUsers = chatTypingUsers.filter(uid => uid !== data.userId);
    }
    
    set({
      typingUsers: {
        ...typingUsers,
        [data.chatId]: newTypingUsers
      }
    });
  },

  sendTyping: (chatId: string, isTyping: boolean) => {
    wsClient.sendTyping(chatId, isTyping);
  },

  saveScrollPosition: (chatId: string, position: number) => {
    const { scrollPositions } = get();
  },

  getScrollPosition: (chatId: string) => {
    const { scrollPositions } = get();
    return scrollPositions[chatId] ?? null;
  },
}));

wsClient.onMessage((data) => {
  const store = useChatStore.getState();
  store.handleIncomingMessage(data);
  
  useChatStore.setState({ lastUpdate: Date.now() });
  
  window.dispatchEvent(new CustomEvent('chatMessageReceived', { 
    detail: { chatId: data.chatId, message: data.message } 
  }));
});

wsClient.onTyping((data) => {
  useChatStore.getState().handleTyping(data);
});
