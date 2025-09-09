import { FC } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
} from "@mui/material";
import {
  CheckOutlined,
  CloseOutlined,
  PersonAddOutlined,
} from "@mui/icons-material";
import { InteractiveMessage, MessageAction } from "entities/friend/model/types";

interface InteractiveMessageProps {
  message: InteractiveMessage;
  onAction: (actionId: string, messageId: string, data?: any) => void;
  currentUserId: string;
}

export const InteractiveMessageComponent: FC<InteractiveMessageProps> = ({
  message,
  onAction,
  currentUserId,
}) => {
  const handleActionClick = (action: MessageAction) => {
    onAction(action.id, message.id, message.content.data);
  };

  const getActionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'check':
        return <CheckOutlined />;
      case 'close':
        return <CloseOutlined />;
      case 'person_add':
        return <PersonAddOutlined />;
      default:
        return null;
    }
  };

  const getActionColor = (action: MessageAction) => {
    if (action.color) return action.color;
    
    switch (action.type) {
      case 'accept':
        return 'success';
      case 'decline':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: '70%',
          minWidth: '300px',
          p: 2,
          backgroundColor: message.senderId === currentUserId 
            ? 'rgba(25, 118, 210, 0.1)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Message Content */}
        <Box sx={{ mb: message.actions && message.actions.length > 0 ? 2 : 0 }}>
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              mb: 1,
            }}
          >
            {message.content.text}
          </Typography>
          
          {message.type === 'friend_invitation' && message.content.data && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {message.content.data.fromUserLogin?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {message.content.data.fromUserLogin}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Interactive Actions */}
        {message.actions && message.actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'contained'}
                color={getActionColor(action)}
                size="small"
                startIcon={getActionIcon(action.icon)}
                disabled={action.disabled}
                onClick={() => handleActionClick(action)}
                sx={{
                  minWidth: 'auto',
                  textTransform: 'none',
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Timestamp */}
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'block',
            textAlign: message.senderId === currentUserId ? 'right' : 'left',
            mt: 1,
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};
