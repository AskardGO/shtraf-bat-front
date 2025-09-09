import { useCallback, useEffect } from 'react';

interface ScrollManagerProps {
  activeChatId: string | null;
  loadMoreMessages: (chatId: string) => void;
  messagesPagination: Record<string, { hasMore: boolean; loading: boolean }>;
}

export const useScrollManager = ({
  activeChatId,
  loadMoreMessages,
  messagesPagination
}: ScrollManagerProps) => {
  const scrollToBottom = useCallback((onComplete?: () => void) => {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.PullToRefresh');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        onComplete?.();
      }
    }, 100);
  }, []);

  const handleScroll = useCallback((event: Event) => {
    const container = event.target as Element;
    const scrollTop = container.scrollTop;

    if (scrollTop < 100 && activeChatId) {
      const pagination = messagesPagination[activeChatId];
      if (pagination && pagination.hasMore && !pagination.loading) {
        loadMoreMessages(activeChatId);
      }
    }
  }, [activeChatId, messagesPagination, loadMoreMessages]);

  useEffect(() => {
    const messagesContainer = document.querySelector('.PullToRefresh');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return {
    scrollToBottom
  };
};
