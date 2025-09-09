import { useCallback, useEffect, useState } from 'react';
import Chat, { MessageProps } from "@chatui/core";
import '@chatui/core/dist/index.css';
import { useChatStoreSubscription } from "../hooks/useChatStore";
import { useMessageManager } from "../hooks/useMessageManager";
import { useScrollManager } from "../hooks/useScrollManager";
import { MessageRenderer } from "../components/MessageRenderer";
import "features/chat/ui/chat-ui-overrides.css";

interface ChatUIWindowProps {
    userId: string;
}

export const ChatWindow = ({ userId }: ChatUIWindowProps) => {
    const storeState = useChatStoreSubscription();
    const { activeChatId, messages, messagesPagination, sendMessage, lastUpdate, loadMoreMessages, forceRender } = storeState;

    const { currentMessages, interactiveMessages } = useMessageManager({
        activeChatId,
        messages,
        lastUpdate,
        forceRender
    });

    const { scrollToBottom } = useScrollManager({
        activeChatId,
        loadMoreMessages,
        messagesPagination
    });

    const [animateMessages, setAnimateMessages] = useState(false);

    useEffect(() => {
        if (activeChatId) {
            setAnimateMessages(false);
            scrollToBottom(() => {
                setAnimateMessages(true);
            });
        }
    }, [activeChatId, scrollToBottom]);

    const handleSend = useCallback(async (type: string, val: string) => {
        if (!activeChatId || type !== "text" || !val.trim()) return;
        await sendMessage(activeChatId, val.trim());
    }, [activeChatId, sendMessage]);

    const transformedMessages = useCallback((): MessageProps[] => {
        return currentMessages
            .map((msg, index, arr) => {
                const showName = index === 0 || (arr[index - 1] && arr[index - 1].senderId !== msg.senderId);
                const position = msg.senderId === userId ? 'right' : 'left';
                const status = (msg as any).isPending ? 'pending' : (msg as any).isFailed ? 'failed' : (msg as any).isSent ? 'sent' : 'delivered';
                
                return {
                    _id: msg.id,
                    type: "text" as const,
                    content: msg.text,
                    user: {
                        id: msg.senderId,
                        ...(showName && { name: msg.senderId === userId ? "Вы" : "Собеседник" }),
                    },
                    position: position as 'right' | 'left',
                    status: status as 'pending' | 'failed' | 'sent' | 'delivered',
                } as MessageProps;
            })
            .reverse();
    }, [currentMessages, userId]);

    const renderMessageContent = useCallback((msg: any) => {
        return (
            <MessageRenderer
                msg={msg}
                currentMessages={currentMessages}
                activeChatId={activeChatId}
                interactiveMessages={interactiveMessages}
                userId={userId}
            />
        );
    }, [currentMessages, activeChatId, interactiveMessages, userId]);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Chat
                navbar={{ title: "Чат" }}
                placeholder="Введите сообщение..."
                messages={transformedMessages()}
                onSend={handleSend}
                renderMessageContent={renderMessageContent}
                locale={"Отправить"}
                colorScheme={"dark"}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                    .MessageList {
                        opacity: ${animateMessages ? 1 : 0};
                        transition: opacity 0.3s ease-out;
                    }
                `
            }} />
        </div>
    );
};
