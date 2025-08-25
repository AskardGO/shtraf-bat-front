import { FC } from "react";
import { List } from "@mui/material";
import { ChatItem } from "widgets/chat/chat-list/components/chat-item";
import { Chat } from "entities/chat/model/type.ts";

interface ChatListProps {
    chats: Chat[];
    onSelect?: (id: string) => void;
    isMinimized?: boolean;
}

export const ChatList: FC<ChatListProps> = ({ chats, onSelect, isMinimized = false }) => {
    return (
        <List disablePadding sx={{ width: "100%", bgcolor: "transparent" }}>
            {chats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} onSelect={onSelect} isMinimized={isMinimized} />
            ))}
        </List>
    );
};
