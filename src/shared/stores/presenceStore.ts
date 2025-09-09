import { create } from 'zustand';
import { wsClient, PresenceEvent } from '../api/websocketClient';

interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface PresenceState {
  userPresences: Record<string, UserPresence>
  
  updateUserPresence: (userId: string, isOnline: boolean, lastSeen: Date) => void
  getUserPresence: (userId: string) => UserPresence | null;
  initializePresenceTracking: () => void;
  cleanupPresenceTracking: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  userPresences: {},

  updateUserPresence: (userId: string, isOnline: boolean, lastSeen: Date) => {
    set((state) => ({
      userPresences: {
        ...state.userPresences,
        [userId]: {
          userId,
          isOnline,
          lastSeen,
        },
      },
    }));
  },

  getUserPresence: (userId: string) => {
    const { userPresences } = get();
    return userPresences[userId] || null;
  },

  initializePresenceTracking: () => {
    wsClient.onPresence((data: PresenceEvent) => {
      get().updateUserPresence(data.userId, data.isOnline, data.lastSeen);
    });
    
    const currentUserId = wsClient.userId;
    if (currentUserId) {
      get().updateUserPresence(currentUserId, true, new Date());
    }
  },

  cleanupPresenceTracking: () => {
    wsClient.offPresence();
  },
}));
