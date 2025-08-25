import { useEffect, useState, useRef } from "react";
import Chat, {Bubble, MessageProps} from "@chatui/core";
import '@chatui/core/dist/index.css';
import { useChatStore } from "features/chat/model/useChatStore.ts";
import { Message as MsgType } from "entities/chat/model/type.ts";
import "features/chat/ui/chat-ui-overrides.css"

interface ChatUIWindowProps {
    userId: string;
}

export const ChatWindow = ({ userId }: ChatUIWindowProps) => {
    const { activeChatId, messages, subscribeMessages, sendMessage, loadMoreMessages } = useChatStore();
    const [currentMessages, setCurrentMessages] = useState<MsgType[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeChatId) subscribeMessages(activeChatId);
    }, [activeChatId]);

    useEffect(() => {
        if (activeChatId && messages[activeChatId]) {
            setCurrentMessages(messages[activeChatId]);
        }
    }, [messages, activeChatId]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && currentMessages.length > 0) {
                loadMoreMessages(activeChatId!);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [activeChatId, currentMessages.length, loadMoreMessages]);

    const handleSend = async (type: string, val: string) => {
        if (!activeChatId || type !== "text" || !val.trim()) return;
        await sendMessage(activeChatId, userId, val.trim());
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Chat
                ref={chatContainerRef}
                navbar={{ title: "Чат" }}
                placeholder="Введите сообщение..."
                messages={currentMessages
                    .map((msg, index, arr) => {
                        const showName = index === 0 || (arr[index - 1] && arr[index - 1].senderId !== msg.senderId);
                        return {
                            _id: msg.id,
                            type: "text",
                            content: msg.text,
                            user: {
                                id: msg.senderId,
                                ...(showName && { name: msg.senderId === userId ? "Вы" : "Собеседник" }),
                            },
                            position: msg.senderId === userId ? 'right' : 'left',
                        };
                    })
                    .reverse() as MessageProps[]
                }
                onSend={handleSend}
                renderMessageContent={(msg) => (
                    <Bubble
                        content={msg.content}
                    />
                )}
                loadMoreText={"Загрузить еще сообщения"}
                locale={"Отправить"}
                colorScheme={"dark"}
            />
        </div>
    );
};
