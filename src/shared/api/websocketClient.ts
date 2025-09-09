import { io, Socket } from 'socket.io-client';
import { activityTracker } from '../utils/activityTracker';

export interface SocketMessage {
  chatId: string;
  message: {
    id: string;
    chatId: string;
    senderId: string;
    text: string;
    createdAt: Date;
  };
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface UserStatusUpdate {
  userId: string;
  isActive: boolean;
}

class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private activityUnsubscribe: (() => void) | null = null;
  private messageCallbacks: ((data: SocketMessage) => void)[] = [];

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public connect(userId: string) {
    if (this.socket?.connected && this.currentUserId === userId) {
      return;
    }

    if (this.socket?.connected && this.currentUserId !== userId) {
      this.disconnect();
    }

    this.currentUserId = userId;
    
    this.socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', {
      auth: {
        uid: userId,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
    this.setupActivityTracking();
  }

  public disconnect() {
    if (this.activityUnsubscribe) {
      this.activityUnsubscribe();
      this.activityUnsubscribe = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
  }

  private setupActivityTracking() {
    if (this.activityUnsubscribe) {
      this.activityUnsubscribe();
    }

    this.activityUnsubscribe = activityTracker.onActivityChange((isActive) => {
      this.sendPresenceUpdate(isActive);
    });

    this.sendPresenceUpdate(activityTracker.getIsActive());
  }

  private sendPresenceUpdate(isActive: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('presence', {
      isActive,
      timestamp: new Date(),
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.sendPresenceUpdate(activityTracker.getIsActive());
      
      if (this.currentUserId) {
        import('../stores/presenceStore').then(({ usePresenceStore }) => {
          const { updateUserPresence } = usePresenceStore.getState();
          updateUserPresence(this.currentUserId!, true, new Date());
        });
      }
    });

    this.socket.on('disconnect', () => {});

    this.socket.on('error', () => {});

    this.socket.on('message', (data: SocketMessage) => {
      this.messageCallbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {}
      });
    });
  }

  public sendMessage(chatId: string, text: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('message', {
      chatId,
      text,
    });
  }

  public sendTyping(chatId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      chatId,
      isTyping,
    });
  }

  public onMessage(callback: (data: SocketMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  public onTyping(callback: (data: TypingEvent) => void) {
    if (!this.socket) return;
    this.socket.on('typing', callback);
  }

  public onPresence(callback: (data: PresenceEvent) => void) {
    if (!this.socket) return;
    this.socket.on('presence', callback);
  }

  public offMessage(callback?: (data: SocketMessage) => void) {
    if (!this.socket) return;
    this.socket.off('message', callback);
  }

  public offTyping(callback?: (data: TypingEvent) => void) {
    if (!this.socket) return;
    this.socket.off('typing', callback);
  }

  public offPresence(callback?: (data: PresenceEvent) => void) {
    if (!this.socket) return;
    this.socket.off('presence', callback);
  }

  public get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public get userId(): string | null {
    return this.currentUserId;
  }
}

export const wsClient = WebSocketClient.getInstance();
