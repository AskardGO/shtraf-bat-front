import { useCallback } from 'react';
import { Bubble } from "@chatui/core";
import { InteractiveMessageComponent } from "widgets/chat/interactive-message/ui/InteractiveMessage.component";
import { useFriendInvitationStore } from "shared/stores/friendInvitationStore";
import { getSystemMessage } from "shared/utils/localization";
import { Box, Typography } from "@mui/material";
import { Message as MsgType } from "entities/chat/model/type.ts";

interface MessageRendererProps {
  msg: any;
  currentMessages: MsgType[];
  activeChatId: string | null;
  interactiveMessages: Record<string, any[]>;
  userId: string;
}

export const MessageRenderer = ({
  msg,
  currentMessages,
  activeChatId,
  interactiveMessages,
  userId
}: MessageRendererProps) => {
  const renderMessageContent = useCallback(() => {
    const msgData = currentMessages.find(m => m.id === msg._id);
    const interactiveMsg = activeChatId ? interactiveMessages[activeChatId]?.find(im => im.id === msg._id) : null;
    
    if (msgData?.isInteractive && interactiveMsg) {
      return <InteractiveMessageComponent 
        message={interactiveMsg} 
        currentUserId={userId}
        onAction={async (actionId, messageId, data) => {
          try {
            const { handleInvitationAction } = useFriendInvitationStore.getState();
            await handleInvitationAction(actionId, messageId, data);
          } catch (error) {
            
          }
        }}
      />;
    }

    if (msgData?.senderId === 'system' && msgData?.isSystem) {
      return (
        <Box
          key={msg._id}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            my: 3,
            width: '100%',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'divider',
              zIndex: 0,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontStyle: 'italic',
              color: 'text.secondary',
              textAlign: 'center',
              px: 3,
              py: 1,
              backgroundColor: 'background.default',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              zIndex: 1,
              fontSize: '0.875rem',
            }}
          >
            {msgData.text === 'accept' ? getSystemMessage('accept') : msgData.text}
          </Typography>
        </Box>
      );
    }
    
    const isPending = (msgData as any)?.isPending;
    const isFailed = (msgData as any)?.isFailed;
    
    return (
      <Bubble
        content={msg.content}
        style={{
          backgroundColor: isFailed ? 'rgba(244, 67, 54, 0.1)' : isPending ? 'rgba(255, 193, 7, 0.1)' : undefined,
          borderColor: isFailed ? '#f44336' : isPending ? '#ffc107' : undefined,
          opacity: isPending ? 0.7 : 1
        }}
      />
    );
  }, [msg, currentMessages, activeChatId, interactiveMessages, userId]);

  return renderMessageContent();
};
