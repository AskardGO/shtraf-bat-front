import { FC } from "react";
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
import {useChatStore} from "features/chat/model/useChatStore.ts";

interface ChatItemProps {
    chat: Chat;
    onSelect?: (id: string) => void;
    isMinimized?: boolean;
}

export const ChatItem: FC<ChatItemProps> = ({ chat, onSelect, isMinimized = false }) => {

    const {activeChatId} = useChatStore();

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
                                        {chat.participants[1]}
                                    </Typography>
                                    <Typography variant="caption" color={Colors.LIGHT_GRAY}>
                                        {format(new Date(chat.lastMessage.createdAt), "HH:mm")}
                                    </Typography>
                                </Box>
                            }
                            secondary={
                                <Typography variant="body2" color={Colors.LIGHT_GRAY} noWrap>
                                    {chat.lastMessage.text}
                                </Typography>
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </ListItemButton>
    );
};
