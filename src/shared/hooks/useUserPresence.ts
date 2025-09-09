import { usePresenceStore } from '../stores/presenceStore';

export const useUserPresence = (userId: string) => {
  const getUserPresence = usePresenceStore((state) => state.getUserPresence);
  
  const presence = getUserPresence(userId);
  
  return {
    isOnline: presence?.isOnline ?? false,
    lastSeen: presence?.lastSeen ?? new Date(),
  };
};
