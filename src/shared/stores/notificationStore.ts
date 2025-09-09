import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MuteDuration = 1 | 5 | 10 | 15 | 30 | 60 | 'forever';

interface NotificationState {
  isMuted: boolean;
  muteUntil: Date | null;
  muteDuration: MuteDuration | null
  
  muteNotifications: (duration: MuteDuration) => void
  unmuteNotifications: () => void;
  checkMuteStatus: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      isMuted: false,
      muteUntil: null,
      muteDuration: null,

      muteNotifications: (duration: MuteDuration) => {
        if (duration === 'forever') {
          set({
            isMuted: true,
            muteUntil: null,
            muteDuration: duration,
          });
        } else {
          const muteUntil = new Date();
          muteUntil.setMinutes(muteUntil.getMinutes() + duration);
          
          set({
            isMuted: true,
            muteUntil,
            muteDuration: duration,
          });

          setTimeout(() => {
            get().checkMuteStatus();
          }, duration * 60 * 1000);
        }
      },

      unmuteNotifications: () => {
        set({
          isMuted: false,
          muteUntil: null,
          muteDuration: null,
        });
      },

      checkMuteStatus: () => {
        const { muteUntil, isMuted } = get();
        
        if (isMuted && muteUntil && new Date() >= muteUntil) {
          set({
            isMuted: false,
            muteUntil: null,
            muteDuration: null,
          });
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        isMuted: state.isMuted,
        muteUntil: state.muteUntil,
        muteDuration: state.muteDuration,
      }),
    }
  )
);
