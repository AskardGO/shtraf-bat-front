import { onCall, HttpsError } from "firebase-functions/v2/https";
// import { onUserCreated } from "firebase-functions/v2/auth";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const createChatWithMessage = onCall(async (request) => {
    try {
        // --- Проверка авторизации ---
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const senderId = request.auth.uid;
        const { recipientId, text } = request.data;

        // --- Проверка входных данных ---
        if (!recipientId || !text) {
            throw new HttpsError("invalid-argument", "recipientId and text are required");
        }

        if (recipientId === senderId) {
            throw new HttpsError("failed-precondition", "Cannot create a chat with yourself");
        }

        // --- Поиск существующего чата ---
        const chatQuery = await db
            .collection("chats")
            .where("participants", "in", [
                [senderId, recipientId],
                [recipientId, senderId],
            ])
            .limit(1)
            .get();

        if (!chatQuery.empty) {
            return {
                chatId: chatQuery.docs[0].id,
                message: "Chat already exists",
            };
        }

        // --- Создание нового чата ---
        const chatRef = await db.collection("chats").add({
            participants: [senderId, recipientId],
            lastMessage: {
                text,
                senderId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
        });

        await chatRef.collection("messages").add({
            text,
            senderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readBy: [senderId],
        });

        return { chatId: chatRef.id };
    } catch (err: any) {
        console.error("Unexpected error:", err);
        if (err instanceof HttpsError) throw err;
        throw new HttpsError("internal", "Internal server error");
    }
});

// export const createUserDoc = onUserCreated(async (event) => {
//     const user = event.data;
//
//     if (!user) return;
//
//     const uid = user.uid;
//
//     await db.collection("users").doc(uid).set({
//         email: user.email,
//         displayName: user.displayName || "Новый пользователь",
//         photoURL: user.photoURL || null,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     });
// });
