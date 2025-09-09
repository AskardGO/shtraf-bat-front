import { useState, useEffect, useMemo } from 'react';
import { Message as MsgType } from "entities/chat/model/type.ts";
import { useFriendInvitationStore } from "shared/stores/friendInvitationStore";

interface MessageManagerProps {
  activeChatId: string | null;
  messages: Record<string, MsgType[]>;
  lastUpdate: number;
  forceRender: number;
}

export const useMessageManager = ({
  activeChatId,
  messages,
  lastUpdate,
  forceRender
}: MessageManagerProps) => {
  const { interactiveMessages, loadInteractiveMessages } = useFriendInvitationStore();
  const [currentMessages, setCurrentMessages] = useState<MsgType[]>([]);

  const combinedMessages = useMemo(() => {
    if (!activeChatId || !messages[activeChatId]) {
      return [];
    }
    
    const chatMessages = messages[activeChatId];
    const interactiveMessagesForChat = interactiveMessages[activeChatId] || [];
    
    const combined = [...chatMessages];
    
    interactiveMessagesForChat.forEach(interactiveMsg => {
      const existsAsRegular = chatMessages.find(msg => msg.id === interactiveMsg.id);
      
      if (!existsAsRegular) {
        combined.push({
          id: interactiveMsg.id,
          senderId: interactiveMsg.senderId,
          text: interactiveMsg.content.text,
          createdAt: interactiveMsg.createdAt,
          isInteractive: true
        } as any);
      }
    });
    
    return combined.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      
      if (a.senderId === 'system' && b.senderId !== 'system')
        return -1;
      if (b.senderId === 'system' && a.senderId !== 'system') return 1;
      
      return aTime - bTime;
    });
  }, [activeChatId, messages, interactiveMessages, lastUpdate, forceRender]);

  useEffect(() => {
    setCurrentMessages(combinedMessages);
  }, [combinedMessages]);

  useEffect(() => {
    if (activeChatId) {
      loadInteractiveMessages(activeChatId);
    }
  }, [activeChatId, loadInteractiveMessages]);

  useEffect(() => {
    const handleReloadMessages = (event: CustomEvent) => {
      if (event.detail.chatId === activeChatId && activeChatId) {
        setTimeout(() => {
          loadInteractiveMessages(activeChatId);
        }, 100);
      }
    };

    window.addEventListener('reloadChatMessages', handleReloadMessages as EventListener);
    
    return () => {
      window.removeEventListener('reloadChatMessages', handleReloadMessages as EventListener);
    };
  }, [activeChatId, loadInteractiveMessages]);

  return {
    currentMessages,
    interactiveMessages
  };
};
