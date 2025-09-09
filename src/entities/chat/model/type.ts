export interface Chat {
    id: string;
    participants: string[];
}

export interface Message {
    id: string;
    chatId?: string;
    senderId: string;
    text: string;
    createdAt: Date;
    readBy?: string[];
    isInteractive?: boolean;
    isSystem?: boolean;
}
