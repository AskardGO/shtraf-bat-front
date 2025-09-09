import { httpClient } from './httpClient';

export interface User {
  uid: string;
  login: string;
  avatar: string | null;
  friends: string[];
  isOnline: boolean;
  lastSeen: Date;
  displayedName?: string;
  displayedNameChanges?: Date[];
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  uid: string;
  login: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: string[];
  createdAt: Date;
  archivedAt?: Date | null;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  readBy?: string[];
}

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await httpClient.post<{ accessToken: string }>('/auth/refresh');
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await httpClient.get<User>('/users/me');
    return response.data;
  }

  async updateDisplayedName(displayedName: string): Promise<User> {
    const response = await httpClient.put<User>('/users/me/displayed-name', { displayedName });
    return response.data;
  }

  async getUserProfile(uid: string): Promise<User> {
    const response = await httpClient.get<User>(`/users/${uid}`);
    return response.data;
  }

  async getUserStatus(uid: string): Promise<{ isOnline: boolean; lastSeen: Date }> {
    const response = await httpClient.get<{ isOnline: boolean; lastSeen: Date }>(`/users/${uid}/status`);
    return response.data;
  }

  async addFriend(friendLogin: string): Promise<void> {
    await httpClient.post('/friends/add', { friendLogin });
  }

  async removeFriend(friendId: string): Promise<void> {
    await httpClient.post(`/friends/remove/${friendId}`);
  }

  async getFriendsList(): Promise<User[]> {
    const response = await httpClient.get<{friends: User[]}>('/friends/list');
    return response.data.friends;
  }

  async sendFriendInvitation(toUserLogin: string): Promise<any> {
    const response = await httpClient.post('/friends/invite', { toUserLogin });
    return response.data;
  }

  async acceptFriendInvitation(invitationId: string): Promise<void> {
    await httpClient.post(`/friends/invite/${invitationId}/accept`);
  }

  async declineFriendInvitation(invitationId: string): Promise<any> {
    const response = await httpClient.post(`/friends/invite/${invitationId}/decline`);
    return response.data;
  }

  async getFriendInvitations(): Promise<any[]> {
    const response = await httpClient.get('/friends/invitations');
    return response.data;
  }

  async getRejectedFriends(): Promise<any[]> {
    const response = await httpClient.get('/friends/rejected');
    return response.data;
  }

  async acceptRejectedFriend(friendRequestId: string): Promise<void> {
    await httpClient.post(`/friends/rejected/${friendRequestId}/accept`);
  }

  async deleteChat(chatId: string): Promise<void> {
    await httpClient.delete(`/chats/${chatId}`);
  }

  async getInteractiveMessages(chatId: string): Promise<any[]> {
    const response = await httpClient.get(`/friends/interactive-messages/${chatId}`);
    return response.data;
  }

  async createChat(participantIds: string[]): Promise<Chat> {
    const response = await httpClient.post<Chat>('/chats', { participantIds });
    return response.data;
  }

  async getMyChats(): Promise<any[]> {
    const response = await httpClient.get('/chats/my');
    return response.data;
  }

  async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await httpClient.get(`/chats/${chatId}/messages?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  async getChatBetween(friendId: string): Promise<Chat> {
    const response = await httpClient.get<Chat>(`/chats/with/${friendId}`);
    return response.data;
  }

  async sendMessage(chatId: string, text: string): Promise<Message> {
    const response = await httpClient.post<Message>('/chats/send', { chatId, text });
    return response.data;
  }

  async archiveChat(chatId: string): Promise<void> {
    await httpClient.post(`/chats/${chatId}/archive`);
  }

  async restoreChat(chatId: string): Promise<Chat> {
    const response = await httpClient.post<Chat>('/chats/restore', { chatId });
    return response.data;
  }
}

export const apiService = ApiService.getInstance();
