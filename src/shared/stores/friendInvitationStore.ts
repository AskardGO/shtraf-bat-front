import { create } from 'zustand';
import { FriendInvitation, InteractiveMessage, FriendRequest } from 'entities/friend/model/types';
import { apiService } from 'shared/api';

interface FriendInvitationState {
  invitations: FriendInvitation[];
  rejectedFriends: FriendRequest[];
  interactiveMessages: Record<string, InteractiveMessage[]>
  loading: boolean
  
  sendFriendInvitation: (toUserLogin: string) => Promise<void>
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  acceptRejectedFriend: (friendRequestId: string) => Promise<void>;
  loadInvitations: () => Promise<void>;
  loadRejectedFriends: () => Promise<void>;
  loadInteractiveMessages: (chatId: string) => Promise<void>;
  addInteractiveMessage: (chatId: string, message: InteractiveMessage) => void;
  removeInteractiveMessage: (chatId: string, messageId: string) => void;
  handleInvitationAction: (actionId: string, messageId: string, data?: any) => Promise<void>;
}

export const useFriendInvitationStore = create<FriendInvitationState>((set, get) => ({
  invitations: [],
  rejectedFriends: [],
  interactiveMessages: {},
  loading: false,

  sendFriendInvitation: async (toUserLogin: string) => {
    set({ loading: true });
    try {
      const result = await apiService.sendFriendInvitation(toUserLogin);
      
      const invitation: FriendInvitation = {
        id: result.invitation._id,
        fromUserId: result.invitation.fromUserId,
        toUserId: result.invitation.toUserId,
        fromUserLogin: result.invitation.fromUserLogin,
        toUserLogin: result.invitation.toUserLogin,
        status: result.invitation.status,
        chatId: result.invitation.chatId,
        createdAt: new Date(result.invitation.createdAt),
        updatedAt: new Date(result.invitation.updatedAt)
      };

      set(state => ({
        invitations: [...state.invitations, invitation],
        loading: false
      }));

      get().addInteractiveMessage(invitation.chatId, {
        id: `msg_${Date.now()}`,
        type: 'friend_invitation',
        chatId: invitation.chatId,
        senderId: invitation.fromUserId,
        content: {
          text: `${invitation.fromUserLogin} отправил вам приглашение в друзья`,
          data: { invitationId: invitation.id }
        },
        actions: [
          {
            id: 'accept',
            type: 'accept',
            label: 'Принять',
            icon: 'CheckOutlined',
            color: 'success'
          },
          {
            id: 'decline',
            type: 'decline',
            label: 'Отклонить',
            icon: 'CloseOutlined',
            color: 'error'
          }
        ],
        createdAt: new Date(),
        isInteractive: true
      });
    } catch (error) {
      console.error('Failed to send friend invitation:', error);
      set({ loading: false });
      throw error;
    }
  },

  acceptInvitation: async (invitationId: string) => {
    console.log('acceptInvitation called with invitationId:', invitationId);
    set((state) => ({ ...state, invitationLoading: true }));
    
    try {
      await apiService.acceptFriendInvitation(invitationId);
      
      set((state) => ({
        ...state,
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
        invitationLoading: false
      }));
      
      const state = get();
      const currentChatInteractiveMessages = Object.entries(state.interactiveMessages);
      
      for (const [chatId, messages] of currentChatInteractiveMessages) {
        const messageToRemove = messages.find(msg => 
          msg.content.data?.invitationId === invitationId
        );
        if (messageToRemove) {
          console.log('Cleaning up interactive message after accept:', messageToRemove.id, 'from chat:', chatId);
          get().removeInteractiveMessage(chatId, messageToRemove.id);
          
          setTimeout(() => {
            const event = new CustomEvent('reloadChatMessages', { detail: { chatId } });
            window.dispatchEvent(event);
            
            const friendsReloadEvent = new CustomEvent('reloadFriendsList');
            window.dispatchEvent(friendsReloadEvent);
            
            const userRefetchEvent = new CustomEvent('refetchUser');
            window.dispatchEvent(userRefetchEvent);
          }, 1000);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      set((state) => ({ ...state, invitationLoading: false }));
      throw error;
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      set({ loading: true });
      
      const declinedRequest = await apiService.declineFriendInvitation(invitationId);
      
      set((state) => ({
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
        rejectedFriends: [...state.rejectedFriends, declinedRequest],
        loading: false,
      }));

      const state = get();
      const currentChatInteractiveMessages = Object.entries(state.interactiveMessages);
      
      for (const [chatId, messages] of currentChatInteractiveMessages) {
        const messageToRemove = messages.find(msg => 
          msg.content.data?.invitationId === invitationId
        );
        if (messageToRemove) {
          console.log('Removing interactive message after decline:', messageToRemove.id, 'from chat:', chatId);
          get().removeInteractiveMessage(chatId, messageToRemove.id);
          
          setTimeout(() => {
            const chatReloadEvent = new CustomEvent('reloadChatList');
            window.dispatchEvent(chatReloadEvent);
          }, 500);
          break;
        }
      }
      
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      set({ loading: false });
      throw error;
    }
  },

  acceptRejectedFriend: async (friendRequestId: string) => {
    try {
      set({ loading: true });
      
      await apiService.acceptRejectedFriend(friendRequestId);
      
      set((state) => ({
        rejectedFriends: state.rejectedFriends.filter(req => req.id !== friendRequestId),
        loading: false,
      }));

    } catch (error) {
      console.error('Failed to accept rejected friend:', error);
      set({ loading: false });
      throw error;
    }
  },

  loadInvitations: async () => {
    try {
      set({ loading: true });
      const invitations = await apiService.getFriendInvitations();
      set({ invitations, loading: false });
    } catch (error) {
      console.error('Failed to load invitations:', error);
      set({ loading: false });
    }
  },

  loadRejectedFriends: async () => {
    try {
      const rejectedFriends = await apiService.getRejectedFriends();
      set({ rejectedFriends });
    } catch (error) {
      console.error('Failed to load rejected friends:', error);
    }
  },

  loadInteractiveMessages: async (chatId: string) => {
    try {
      const messages = await apiService.getInteractiveMessages(chatId);
      const formattedMessages: InteractiveMessage[] = messages.map(msg => ({
        id: msg._id,
        type: msg.type,
        chatId: msg.chatId,
        senderId: msg.senderId,
        content: msg.content,
        actions: msg.actions,
        createdAt: new Date(msg.createdAt),
        isInteractive: msg.isInteractive
      }));

      set(state => ({
        interactiveMessages: {
          ...state.interactiveMessages,
          [chatId]: formattedMessages
        }
      }));
    } catch (error) {
      console.error('Failed to load interactive messages:', error);
    }
  },

  addInteractiveMessage: (chatId: string, message: InteractiveMessage) => {
    set((state) => ({
      interactiveMessages: {
        ...state.interactiveMessages,
        [chatId]: [...(state.interactiveMessages[chatId] || []), message],
      },
    }));
  },

  removeInteractiveMessage: (chatId: string, messageId: string) => {
    set((state) => ({
      interactiveMessages: {
        ...state.interactiveMessages,
        [chatId]: (state.interactiveMessages[chatId] || []).filter(
          msg => msg.id !== messageId
        ),
      },
    }));
  },

  handleInvitationAction: async (actionId: string, _messageId: string, data?: any) => {
    const { acceptInvitation, declineInvitation } = get();
    
    console.log('handleInvitationAction called with:', { actionId, data });
    console.log('data.invitationId:', data?.invitationId);
    console.log('Full data object:', JSON.stringify(data, null, 2));
    
    if (!data?.invitationId) {
      console.error('No invitation ID provided for action', data);
      return;
    }

    try {
      switch (actionId) {
        case 'accept':
          await acceptInvitation(data.invitationId);
          break;
        case 'decline':
          await declineInvitation(data.invitationId);
          break;
        default:
          console.warn('Unknown invitation action:', actionId);
      }
    } catch (error) {
      console.error('Error handling invitation action:', error);
    }
  },
}));
