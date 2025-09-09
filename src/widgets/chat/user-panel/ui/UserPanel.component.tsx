import { FC, useState } from "react";
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  LogoutOutlined,
  NotificationsOffOutlined,
  NotificationsOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useAuthStore } from "shared/stores/authStore";
import { useNotificationStore, MuteDuration } from "shared/stores/notificationStore";
import { useUserPresence } from "shared/hooks/useUserPresence";

interface UserPanelProps {
  onAvatarClick: () => void;
  isMinimized?: boolean;
}

const MUTE_OPTIONS: { value: MuteDuration; label: string }[] = [
  { value: 1, label: "1 минута" },
  { value: 5, label: "5 минут" },
  { value: 10, label: "10 минут" },
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 60, label: "1 час" },
  { value: "forever", label: "Навсегда" },
];

export const UserPanel: FC<UserPanelProps> = ({ onAvatarClick, isMinimized = false }) => {
  const { user, logout } = useAuthStore();
  const { isMuted, muteNotifications, unmuteNotifications } = useNotificationStore();
  const { isOnline } = useUserPresence(user?.uid || '');
  
  const [muteMenuAnchor, setMuteMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMuteClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isMuted) {
      unmuteNotifications();
    } else {
      setMuteMenuAnchor(event.currentTarget);
    }
  };

  const handleMuteOptionSelect = (duration: MuteDuration) => {
    muteNotifications(duration);
    setMuteMenuAnchor(null);
  };

  const handleCloseMuteMenu = () => {
    setMuteMenuAnchor(null);
  };

  if (!user) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: isMinimized ? 1 : 2,
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        gap: isMinimized ? 0.5 : 1,
      }}
    >
      {/* Avatar */}
      <Tooltip title="Открыть профиль">
        <IconButton
          onClick={onAvatarClick}
          sx={{ p: 0 }}
        >
          <Avatar
            src={user.avatar || undefined}
            sx={{
              width: isMinimized ? 32 : 40,
              height: isMinimized ? 32 : 40,
              cursor: "pointer",
            }}
          >
            {user.login.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* User info (only when not minimized) */}
      {!isMinimized && (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.login}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isOnline ? "#4caf50" : "rgba(255, 255, 255, 0.6)",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isOnline ? "#4caf50" : "#757575",
              }}
            />
            {isOnline ? "В сети" : "Не в сети"}
          </Typography>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {/* Mute notifications button */}
        <Tooltip title={isMuted ? "Включить уведомления" : "Отключить уведомления"}>
          <IconButton
            size="small"
            onClick={handleMuteClick}
            sx={{
              color: isMuted ? "#ff9800" : "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {isMuted ? <NotificationsOffOutlined /> : <NotificationsOutlined />}
          </IconButton>
        </Tooltip>

        {/* Settings button (only when not minimized) */}
        {!isMinimized && (
          <Tooltip title="Настройки">
            <IconButton
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <SettingsOutlined />
            </IconButton>
          </Tooltip>
        )}

        {/* Logout button */}
        <Tooltip title="Выйти">
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                color: "#f44336",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
              },
            }}
          >
            <LogoutOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Mute duration menu */}
      <Menu
        anchorEl={muteMenuAnchor}
        open={Boolean(muteMenuAnchor)}
        onClose={handleCloseMuteMenu}
        PaperProps={{
          sx: {
            backgroundColor: "#2a2a2a",
            color: "white",
            minWidth: 180,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Отключить уведомления на:
          </Typography>
        </MenuItem>
        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }} />
        {MUTE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleMuteOptionSelect(option.value)}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ListItemIcon>
              <NotificationsOffOutlined sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
