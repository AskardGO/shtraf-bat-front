import { create } from "zustand";
import {
    collection,
    where,
    doc,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    updateDoc,
    serverTimestamp,
    limit,
    startAfter,
    getDocs,
} from "firebase/firestore";
import { firebaseService } from "app/firebase";
import { Chat, Message } from "entities/chat/model/type.ts";

interface ChatState {
    chats: Chat[];
    messages: Record<string, Message[]>;
    activeChatId: string | null;
    subscribeChats: (userId: string) => void;
    subscribeMessages: (chatId: string, pageSize?: number) => void;
    loadMoreMessages: (chatId: string, pageSize?: number) => Promise<void>;
    sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
    setActiveChat: (chatId: string) => void;
}

const db = firebaseService.db;

export const useChatStore = create<ChatState>((set, get) => {

    const activeChatSubscriptions = new Set<string>();
    let chatsUnsubscribe: (() => void) | null = null;

    return {
        chats: [],
        messages: {},
        activeChatId: null,

        subscribeChats: (userId: string) => {
            if (chatsUnsubscribe) return;

            const q = query(
                collection(db, "chats"),
                where("participants", "array-contains", userId)
            );

            chatsUnsubscribe = onSnapshot(q, (snapshot) => {
                const chats: Chat[] = snapshot.docs
                    .map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            participants: data.participants,
                            createdAt: data.createdAt?.toDate() ?? new Date(),
                            lastMessage: data.lastMessage
                                ? {
                                    id: "last",
                                    senderId: data.lastMessage.senderId,
                                    text: data.lastMessage.text,
                                    createdAt: data.lastMessage.createdAt?.toDate() ?? new Date(),
                                    readBy: data.lastMessage.readBy ?? [],
                                }
                                : undefined,
                        } as Chat;
                    })
                    .sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));

                set({ chats });
            });
        },

        subscribeMessages: (chatId: string, pageSize = 20) => {
            if (activeChatSubscriptions.has(chatId)) return;
            activeChatSubscriptions.add(chatId);

            const q = query(
                collection(db, "chats", chatId, "messages"),
                orderBy("createdAt", "desc"),
                limit(pageSize)
            );

            onSnapshot(q, (snapshot) => {
                const newMessages: Message[] = [];

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        newMessages.push({
                            id: change.doc.id,
                            chatId,
                            senderId: data.senderId,
                            text: data.text,
                            createdAt: data.createdAt?.toDate() ?? new Date(),
                            readBy: data.readBy ?? [],
                        });
                    }
                });

                if (newMessages.length > 0) {
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [chatId]: [...(state.messages[chatId] ?? []), ...newMessages].sort(
                                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                            ),
                        },
                    }));
                }
            });
        },

        loadMoreMessages: async (chatId: string, pageSize = 20) => {
            const messages = get().messages[chatId];
            if (!messages || messages.length === 0) return;

            const lastVisible = messages[0];
            const q = query(
                collection(db, "chats", chatId, "messages"),
                orderBy("createdAt", "desc"),
                startAfter(lastVisible.createdAt),
                limit(pageSize)
            );

            const snapshot = await getDocs(q);
            const olderMessages: Message[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    chatId,
                    senderId: data.senderId,
                    text: data.text,
                    createdAt: data.createdAt?.toDate() ?? new Date(),
                    readBy: data.readBy ?? [],
                };
            });

            olderMessages.reverse();

            set((state) => ({
                messages: {
                    ...state.messages,
                    [chatId]: [...olderMessages, ...state.messages[chatId]],
                },
            }));
        },

        sendMessage: async (chatId: string, senderId: string, text: string) => {
            const newMsg = { senderId, text, createdAt: serverTimestamp(), readBy: [senderId] };
            await addDoc(collection(db, "chats", chatId, "messages"), newMsg);

            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                lastMessage: { senderId, text, createdAt: serverTimestamp(), readBy: [senderId] },
            });
        },

        setActiveChat: (chatId: string) => set({ activeChatId: chatId }),
    };
});
