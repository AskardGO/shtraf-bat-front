import { create } from 'zustand';
import { apiService, User } from '../api';

interface UserState {
  users: Record<string, User>;
  loading: Set<string>
  
  getUserById: (uid: string) => User | null
  loadUser: (uid: string) => Promise<User | null>;
  setUser: (user: User) => void;
  clearUsers: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: {},
  loading: new Set(),

  getUserById: (uid: string) => {
    const { users } = get();
    return users[uid] || null;
  },

  loadUser: async (uid: string) => {
    const { users, loading } = get();
    
    if (users[uid]) {
      return users[uid];
    }
    
    if (loading.has(uid)) {
      return null;
    }

    try {
      set(state => ({
        loading: new Set([...state.loading, uid])
      }));

      const user = await apiService.getUserProfile(uid);
      
      set(state => ({
        users: { ...state.users, [uid]: user },
        loading: new Set([...state.loading].filter(id => id !== uid))
      }));

      return user;
    } catch (error) {
      console.error(`Failed to load user ${uid}:`, error);
      
      set(state => ({
        loading: new Set([...state.loading].filter(id => id !== uid))
      }));
      
      return null;
    }
  },

  setUser: (user: User) => {
    set(state => ({
      users: { ...state.users, [user.uid]: user }
    }));
  },

  clearUsers: () => {
    set({ users: {}, loading: new Set() });
  },
}));
