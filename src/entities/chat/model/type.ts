export interface Chat {
    id: string;
    participants: string[];
    lastMessage: Message;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: Date;
    readBy: string[];
}
