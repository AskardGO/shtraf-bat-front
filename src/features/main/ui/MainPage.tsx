import {FC, useEffect, useState} from "react";
import { SplitLayout } from "features/layout/ui/SplitLayout";
import { useLogout } from "features/auth/hooks";
import { Button } from "@mui/material";
import { ChatList } from "widgets/chat/chat-list/ui/ChatList.component.tsx";
import { useAuthStore } from "features/auth";
import {useChatStore} from "features/chat/model/useChatStore.ts";
import {ChatWindow} from "features/chat/ui";

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

    const { user } = useAuthStore();
    const { chats, subscribeChats, setActiveChat, activeChatId } = useChatStore();

    const selectChat = (chatId: string) => {
        setActiveChat(activeChatId === chatId ? '' : chatId);
    }

    useEffect(() => {
        if (chats.length === 0 && user) {
            subscribeChats(user.uid);
        }
    }, [chats, user]);

    if (!user) return;

    return (
        <SplitLayout
            left={<ChatList chats={chats} isMinimized={isMinimized} onSelect={selectChat}/>}
            right={activeChatId ? <ChatWindow userId={user.uid}/> : <MockNoChat />}
            onMinimized={(bool) => setIsMinimized(bool)}
        />
    );
};
