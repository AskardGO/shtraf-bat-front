import { FC, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBackOutlined,
  EditOutlined,
  PersonAddOutlined,
  PersonRemoveOutlined,
  SaveOutlined,
  CancelOutlined,
  CheckOutlined,
} from "@mui/icons-material";
import { useAuthStore } from "shared/stores/authStore";
import { apiService, User } from "shared/api";
import { useUserPresence } from "shared/hooks/useUserPresence";
import { useFriendInvitationStore } from "shared/stores/friendInvitationStore";

// Separate component for friend list item to properly use hooks
interface FriendListItemProps {
  friend: User;
  index: number;
  totalFriends: number;
  onRemove: (friendId: string, friendLogin: string) => void;
}

const FriendListItem: FC<FriendListItemProps> = ({ friend, index, totalFriends, onRemove }) => {
  const { isOnline: friendIsOnline } = useUserPresence(friend.uid);
  
  return (
    <ListItem
      sx={{
        px: 0,
        borderBottom:
          index < totalFriends - 1
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "none",
      }}
    >
      <ListItemAvatar>
        <Avatar src={friend.avatar || undefined}>
          {(friend.displayedName || friend.login)?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={friend.displayedName || friend.login || 'Unknown User'}
        primaryTypographyProps={{ sx: { color: "white" } }}
        secondary={
          <span style={{ 
            color: friendIsOnline ? "#4caf50" : "rgba(255, 255, 255, 0.6)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: friendIsOnline ? "#4caf50" : "rgba(255, 255, 255, 0.3)",
                display: "inline-block"
              }}
            />
            {friendIsOnline ? "В сети" : friend.lastSeen ? `Был в сети ${new Date(friend.lastSeen).toLocaleString('ru-RU', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit', 
              minute: '2-digit' 
            })}` : "Не в сети"}
          </span>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          onClick={() => onRemove(friend.uid, friend.login || 'Unknown User')}
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            "&:hover": { color: "#f44336" },
          }}
        >
          <PersonRemoveOutlined />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

interface ProfileEditorProps {
  onBack: () => void;
}

export const ProfileEditor: FC<ProfileEditorProps> = ({ onBack }) => {
  const { user, setUser } = useAuthStore();
  const { isOnline: userIsOnline } = useUserPresence(user?.uid || '');
  const { 
    sendFriendInvitation, 
    rejectedFriends, 
    acceptRejectedFriend, 
    loadRejectedFriends,
    loading: invitationLoading 
  } = useFriendInvitationStore();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [isEditingDisplayedName, setIsEditingDisplayedName] = useState(false);
  const [editedDisplayedName, setEditedDisplayedName] = useState(user?.displayedName || "");
  const [newFriendLogin, setNewFriendLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    friendId: string;
    friendLogin: string;
  }>({ open: false, friendId: "", friendLogin: "" });

  useEffect(() => {
    loadFriends();
    loadRejectedFriends();
  }, [loadRejectedFriends]);

  // Listen for friends list reload events
  useEffect(() => {
    const handleReloadFriends = () => {
      console.log('Reloading friends list due to event');
      loadFriends();
    };

    const handleUserRefetch = async () => {
      console.log('Refetching user data due to event');
      try {
        const updatedUser = await apiService.getMe();
        // Update user in auth store or wherever it's stored
        const userRefetchEvent = new CustomEvent('userUpdated', { detail: updatedUser });
        window.dispatchEvent(userRefetchEvent);
        
        // Also reload friends list
        loadFriends();
      } catch (error) {
        console.error('Failed to refetch user:', error);
      }
    };

    window.addEventListener('reloadFriendsList', handleReloadFriends);
    window.addEventListener('refetchUser', handleUserRefetch);
    
    return () => {
      window.removeEventListener('reloadFriendsList', handleReloadFriends);
      window.removeEventListener('refetchUser', handleUserRefetch);
    };
  }, []);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const friendsList = await apiService.getFriendsList();
      console.log('Loaded friends from API:', friendsList);
      setFriends(Array.isArray(friendsList) ? friendsList : []);
    } catch (error) {
      console.error("Failed to load friends:", error);
      setError("Не удалось загрузить список друзей");
      setFriends([]); // Ensure friends is always an array
    } finally {
      setFriendsLoading(false);
    }
  };


  const handleSaveDisplayedName = async () => {
    if (!editedDisplayedName.trim()) {
      setError("Отображаемое имя не может быть пустым");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await apiService.updateDisplayedName(editedDisplayedName.trim());
      setUser(updatedUser);
      
      setSuccess("Отображаемое имя успешно обновлено");
      setIsEditingDisplayedName(false);
    } catch (error: any) {
      console.error("Failed to update displayed name:", error);
      if (error.response?.status === 429) {
        setError("Вы можете изменять отображаемое имя только 2 раза в сутки");
      } else {
        setError(error.response?.data?.error || "Не удалось обновить отображаемое имя");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDisplayedNameEdit = () => {
    setEditedDisplayedName(user?.displayedName || "");
    setIsEditingDisplayedName(false);
    setError(null);
  };

  const canChangeDisplayedName = () => {
    if (!user?.displayedNameChanges) return true;
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentChanges = user.displayedNameChanges.filter(change => new Date(change) > oneDayAgo);
    
    return recentChanges.length < 2;
  };

  const handleAddFriend = async () => {
    if (!newFriendLogin.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await sendFriendInvitation(newFriendLogin.trim());
      setSuccess(`Приглашение отправлено пользователю ${newFriendLogin}`);
      setNewFriendLogin("");
    } catch (error: any) {
      setError(error.response?.data?.message || "Не удалось отправить приглашение");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.removeFriend(friendId);
      await loadFriends();
      
      setSuccess("Друг удален из списка");
      setConfirmDialog({ open: false, friendId: "", friendLogin: "" });
    } catch (error) {
      console.error("Failed to remove friend:", error);
      setError("Не удалось удалить друга");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (friendId: string, friendLogin: string) => {
    setConfirmDialog({ open: true, friendId, friendLogin });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, friendId: "", friendLogin: "" });
  };

  if (!user) return null;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <IconButton onClick={onBack} sx={{ color: "white", mr: 1 }}>
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Профиль пользователя
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Profile Section */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
          <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            Информация профиля
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              src={user.avatar || undefined}
              sx={{ width: 80, height: 80 }}
            >
              {user.login.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              {/* Login (read-only) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Логин:
                </Typography>
                <Typography variant="body1" sx={{ color: "white" }}>
                  {user.login}
                </Typography>
              </Box>
              
              {/* Displayed Name (editable) */}
              {isEditingDisplayedName ? (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    value={editedDisplayedName}
                    onChange={(e) => setEditedDisplayedName(e.target.value)}
                    placeholder="Введите отображаемое имя"
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                        "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                        "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "rgba(255, 255, 255, 0.5)",
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSaveDisplayedName}
                    disabled={loading}
                    sx={{ color: "#4caf50" }}
                  >
                    {loading ? <CircularProgress size={20} /> : <SaveOutlined />}
                  </IconButton>
                  <IconButton onClick={handleCancelDisplayedNameEdit} sx={{ color: "#f44336" }}>
                    <CancelOutlined />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    Отображаемое имя:
                  </Typography>
                  <Typography variant="h6" sx={{ color: "white" }}>
                    {user.displayedName || user.login}
                  </Typography>
                  <IconButton
                    onClick={() => setIsEditingDisplayedName(true)}
                    disabled={!canChangeDisplayedName()}
                    size="small"
                    sx={{ 
                      color: canChangeDisplayedName() ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.3)",
                      cursor: canChangeDisplayedName() ? "pointer" : "not-allowed"
                    }}
                    title={canChangeDisplayedName() ? "Редактировать отображаемое имя" : "Вы можете изменять имя только 2 раза в сутки"}
                  >
                    <EditOutlined />
                  </IconButton>
                </Box>
              )}
              
              <Typography
                variant="body2"
                sx={{
                  color: userIsOnline ? "#4caf50" : "rgba(255, 255, 255, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: userIsOnline ? "#4caf50" : "#757575",
                  }}
                />
                {userIsOnline ? "В сети" : `Был в сети ${user.lastSeen.toLocaleString()}`}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Friends Section */}
        <Paper sx={{ p: 3, backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 2,
              "& .MuiTab-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-selected": {
                  color: "white",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#1976d2",
              },
            }}
          >
            <Tab label={`Друзья (${friends.length})`} />
            <Tab label={`Отклоненные (${rejectedFriends.length})`} />
          </Tabs>
          
          {/* Tab Content */}
          {activeTab === 0 ? (
            <>
              {/* Add Friend */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  value={newFriendLogin}
                  onChange={(e) => setNewFriendLogin(e.target.value)}
                  placeholder="Введите логин пользователя"
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                      "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddFriend();
                    }
                  }}
                />
                <Button
                  onClick={handleAddFriend}
                  disabled={loading || invitationLoading || !newFriendLogin.trim()}
                  variant="contained"
                  startIcon={(loading || invitationLoading) ? <CircularProgress size={16} /> : <PersonAddOutlined />}
                >
                  Пригласить
                </Button>
              </Box>

              <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.12)", mb: 2 }} />

              {/* Friends List */}
              {friendsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : !Array.isArray(friends) || friends.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", py: 2 }}
                >
                  У вас пока нет друзей. Отправьте приглашение по логину!
                </Typography>
              ) : (
                <List disablePadding>
                  {friends.map((friend, index) => (
                    <FriendListItem
                      key={friend.uid}
                      friend={friend}
                      index={index}
                      totalFriends={friends.length}
                      onRemove={openConfirmDialog}
                    />
                  ))}
                </List>
              )}
            </>
          ) : (
            <>
              {/* Rejected Friends List */}
              {rejectedFriends.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", py: 2 }}
                >
                  Нет отклоненных приглашений
                </Typography>
              ) : (
                <List disablePadding>
                  {rejectedFriends.map((rejected, index) => (
                    <ListItem
                      key={rejected._id}
                      sx={{
                        px: 0,
                        borderBottom:
                          index < rejectedFriends.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "none",
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {rejected.fromUserLogin.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={rejected.fromUserLogin}
                        primaryTypographyProps={{ sx: { color: "white" } }}
                        secondary={`Отклонено ${new Date(rejected.createdAt).toLocaleDateString()}`}
                        secondaryTypographyProps={{ 
                          variant: "body2",
                          sx: { color: "rgba(255, 255, 255, 0.6)" }
                        }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => acceptRejectedFriend(rejected._id)}
                          disabled={invitationLoading}
                          sx={{
                            color: "rgba(255, 255, 255, 0.7)",
                            "&:hover": { color: "#4caf50" },
                          }}
                        >
                          {invitationLoading ? <CircularProgress size={20} /> : <CheckOutlined />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        PaperProps={{
          sx: {
            backgroundColor: "#2a2a2a",
            color: "white",
          },
        }}
      >
        <DialogTitle>Удалить друга</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить {confirmDialog.friendLogin} из списка друзей?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Отмена
          </Button>
          <Button
            onClick={() => handleRemoveFriend(confirmDialog.friendId)}
            disabled={loading}
            sx={{ color: "#f44336" }}
          >
            {loading ? <CircularProgress size={16} /> : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
