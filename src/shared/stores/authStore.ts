import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService, httpClient, User, LoginRequest, RegisterRequest } from '../api';
import { wsClient } from '../api/websocketClient';
import { useChatStore } from './chatStore';
import { usePresenceStore } from './presenceStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean

  login: (credentials: LoginRequest) => Promise<void>
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        try {
          set({ loading: true });
          const authResponse = await apiService.login(credentials);

          httpClient.setAuthTokens({
            accessToken: authResponse.accessToken,
            refreshToken: authResponse.refreshToken,
          });

          const user: User = {
            uid: authResponse.uid,
            login: authResponse.login,
            avatar: authResponse.avatar,
            isOnline: true,
            lastSeen: new Date(),
          };

          set({
            user,
            loading: false,
            isAuthenticated: true
          });

          wsClient.connect(user.uid);

          const { initializePresenceTracking } = usePresenceStore.getState();
          initializePresenceTracking();
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (credentials: RegisterRequest) => {
        try {
          set({ loading: true });
          const authResponse = await apiService.register(credentials);

          httpClient.setAuthTokens({
            accessToken: authResponse.accessToken,
            refreshToken: authResponse.refreshToken,
          });

          const user: User = {
            uid: authResponse.uid,
            login: authResponse.login,
            avatar: authResponse.avatar,
            isOnline: true,
            lastSeen: new Date(),
            friends: [],
          };

          set({
            user,
            loading: false,
            isAuthenticated: true
          });

          wsClient.connect(user.uid);
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          httpClient.clearAuthTokens();

          const { cleanupPresenceTracking } = usePresenceStore.getState();
          cleanupPresenceTracking();

          const { disconnectWebSocket } = useChatStore.getState();
          disconnectWebSocket();

          wsClient.disconnect();

          set({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      },

      checkAuth: async () => {
        try {
          set({ loading: true });

          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            set({ loading: false, isAuthenticated: false });
            return;
          }

          const user = await apiService.getMe();

          set({
            user,
            loading: false,
            isAuthenticated: true
          });

          wsClient.connect(user.uid);

          const { initializePresenceTracking } = usePresenceStore.getState();
          initializePresenceTracking();
        } catch (error) {
          console.error('Auth check failed:', error);
          httpClient.clearAuthTokens();
          set({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          loading: false
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
