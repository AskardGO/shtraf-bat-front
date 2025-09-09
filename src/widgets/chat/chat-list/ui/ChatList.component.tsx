import { FC } from "react";
import { Box, List } from "@mui/material";
import { ChatItem } from "widgets/chat/chat-list/components/chat-item";
import { Chat } from "entities/chat/model/type.ts";
import { UserPanel } from "widgets/chat/user-panel/ui/UserPanel.component";

interface ChatListProps {
    chats: Chat[];
    onSelect?: (id: string) => void;
    onProfileClick?: () => void;
    isMinimized?: boolean;
}

export const ChatList: FC<ChatListProps> = ({ 
    chats, 
    onSelect, 
    onProfileClick, 
    isMinimized = false 
}) => {
    return (
        <Box sx={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: "column",
            bgcolor: "transparent" 
        }}>
            {/* Chat List */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
                <List disablePadding sx={{ width: "100%", bgcolor: "transparent" }}>
                    {chats.map((chat) => (
                        <ChatItem key={chat.id} chat={chat} onSelect={onSelect} isMinimized={isMinimized} />
                    ))}
                </List>
            </Box>
            
            {/* User Panel */}
            <UserPanel 
                onAvatarClick={onProfileClick || (() => {})} 
                isMinimized={isMinimized} 
            />
        </Box>
    );
};
