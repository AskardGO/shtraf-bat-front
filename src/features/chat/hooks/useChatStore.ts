import { useState, useEffect } from 'react';
import { useChatStore as useOriginalChatStore } from "features/chat/model/useChatStore.ts";

export const useChatStoreSubscription = () => {
  const [storeState, setStoreState] = useState(() => useOriginalChatStore.getState());
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    const unsubscribe = useOriginalChatStore.subscribe((state, prevState) => {
      const { scrollPositions: _, ...stateWithoutScroll } = state;
      const { scrollPositions: __, ...prevStateWithoutScroll } = prevState || {};
      
      if (JSON.stringify(stateWithoutScroll) !== JSON.stringify(prevStateWithoutScroll)) {
        setStoreState(state);
        setForceRender(prev => prev + 1);
      } else {
        setStoreState(state);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      if (event.detail.chatId === storeState.activeChatId) {
        setForceRender(prev => prev + 1);
      }
    };

    window.addEventListener('chatMessageReceived', handleMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('chatMessageReceived', handleMessageReceived as EventListener);
    };
  }, [storeState.activeChatId]);

  return { ...storeState, forceRender };
};
