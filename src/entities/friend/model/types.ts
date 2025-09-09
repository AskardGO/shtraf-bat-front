export interface FriendInvitation {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserLogin: string;
  toUserLogin: string;
  status: 'pending' | 'accepted' | 'rejected';
  chatId: string
  createdAt: Date
  updatedAt: Date;
}

export interface InteractiveMessage {
  id: string;
  type: 'friend_invitation' | 'system' | 'custom';
  chatId: string;
  senderId: string;
  content: {
    text: string;
    data?: any
  };
  actions?: MessageAction[];
  createdAt: Date;
  isInteractive: boolean;
}

export interface MessageAction {
  id: string;
  type: 'accept' | 'decline' | 'custom';
  label: string;
  icon?: string;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  disabled?: boolean;
}

export interface FriendRequest {
  _id: string;
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserLogin: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export type FriendStatus = 'friend' | 'pending' | 'rejected' | 'none';
