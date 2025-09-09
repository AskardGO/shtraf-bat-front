import { FC, useEffect, useState } from "react";
import {
    Avatar,
    Badge,
    Box,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Typography
} from "@mui/material";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Chat } from "entities/chat/model/type";
import { Colors } from "shared/ui";
import { useChatStore } from "features/chat/model/useChatStore.ts";
import { useUserStore } from "shared/stores/userStore";
import { useAuthStore } from "shared/stores/authStore";

interface ChatItemProps {
    chat: Chat;
    onSelect?: (id: string) => void;
    isMinimized?: boolean;
}

export const ChatItem: FC<ChatItemProps> = ({ chat, onSelect, isMinimized = false }) => {
    const { activeChatId, messages } = useChatStore();
    const { user: currentUser } = useAuthStore();
    const { getUserById, loadUser } = useUserStore();
    const [displayName, setDisplayName] = useState<string>('');

    // Get last message from store messages
    const chatMessages = messages[chat.id] || [];
    const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

    // Helper function to safely format date
    const formatMessageTime = (createdAt: Date | string | undefined) => {
        if (!createdAt) return "";
        const date = new Date(createdAt);
        return !isNaN(date.getTime()) ? format(date, "HH:mm") : "";
    };

    // Get the other participant's ID (not current user)
    const otherParticipantId = chat.participants.find(id => id !== currentUser?.uid);

    useEffect(() => {
        if (!otherParticipantId) {
            setDisplayName(chat.id); // Fallback to chat ID
            return;
        }

        // Check if we already have user data
        const cachedUser = getUserById(otherParticipantId);
        if (cachedUser) {
            setDisplayName(cachedUser.displayedName || cachedUser.login);
            return;
        }

        // Load user data if not cached
        loadUser(otherParticipantId).then(user => {
            if (user) {
                setDisplayName(user.displayedName || user.login);
            } else {
                setDisplayName(otherParticipantId); // Fallback to ID
            }
        });
    }, [otherParticipantId, getUserById, loadUser, chat.id]);

    return (
        <ListItemButton
            onClick={() => onSelect?.(chat.id)}
            sx={{
                bgcolor: activeChatId === chat.id ? Colors.DARK_GRAY : "transparent",
                borderBottom: `1px solid ${Colors.MID_GRAY}`,
                "&:hover": { bgcolor: Colors.MID_GRAY },
                overflow: "hidden",
            }}
        >
            <ListItemAvatar>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    variant="dot"
                    invisible={true}
                    sx={{
                        "& .MuiBadge-dot": {
                            backgroundColor: "limegreen",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${Colors.DARK_GRAY}`,
                        },
                    }}
                >
                    <Avatar />
                </Badge>
            </ListItemAvatar>

            <AnimatePresence initial={false}>
                {!isMinimized && (
                    <motion.div
                        key="chat-text"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "100%" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <ListItemText
                            primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body1" fontWeight="bold">
                                        {displayName}
                                    </Typography>
                                    <Typography variant="caption" color={Colors.LIGHT_GRAY}>
                                        {formatMessageTime(lastMessage?.createdAt)}
                                    </Typography>
                                </Box>
                            }
                            secondary={
                                <Typography variant="body2" color={Colors.LIGHT_GRAY} noWrap>
                                    {lastMessage ? lastMessage.text : "No messages yet"}
                                </Typography>
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </ListItemButton>
    );
};
