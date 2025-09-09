import {FC, useEffect, useState} from "react";
import { SplitLayout } from "features/layout/ui/SplitLayout";
import { useLogout } from "features/auth/hooks";
import { Button } from "@mui/material";
import { ChatList } from "widgets/chat/chat-list/ui/ChatList.component.tsx";
import { useAuthStore } from "features/auth";
import {useChatStore} from "features/chat/model/useChatStore.ts";
import {ChatWindow} from "features/chat/ui";
import { ProfileEditor } from "widgets/chat/profile-editor/ui/ProfileEditor.component";

const MockNoChat = () => {
    const logout = useLogout();
    return (<div>
        <Button onClick={logout} variant="contained" color="secondary">
            Выйти
        </Button>
    </div>)
}

export const MainPage: FC = () => {
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [showProfile, setShowProfile] = useState<boolean>(false);

    const { user } = useAuthStore();
    const { chats, subscribeChats, setActiveChat, activeChatId, isConnected } = useChatStore();

    const selectChat = (chatId: string) => {
        setActiveChat(activeChatId === chatId ? '' : chatId);
        setShowProfile(false); // Close profile when selecting a chat
    }

    const handleProfileClick = () => {
        setShowProfile(true);
        setActiveChat(null); // Clear active chat when opening profile
    }

    const handleProfileBack = () => {
        setShowProfile(false);
    }

    useEffect(() => {
        if (user && !isConnected) {
            subscribeChats(user.uid);
        }
    }, [user, isConnected, subscribeChats]);

    if (!user) return;

    const getRightComponent = () => {
        if (showProfile) {
            return <ProfileEditor onBack={handleProfileBack} />;
        }
        if (activeChatId) {
            return <ChatWindow userId={user.uid} />;
        }
        return <MockNoChat />;
    };

    return (
        <SplitLayout
            left={
                <ChatList 
                    chats={chats} 
                    isMinimized={isMinimized} 
                    onSelect={selectChat}
                    onProfileClick={handleProfileClick}
                />
            }
            right={getRightComponent()}
            onMinimized={(bool) => setIsMinimized(bool)}
        />
    );
};
