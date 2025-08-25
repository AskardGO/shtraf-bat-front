"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatWithMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
exports.createChatWithMessage = functions.https.onCall((data, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const recipientId = data === null || data === void 0 ? void 0 : data.recipientId;
    const text = data === null || data === void 0 ? void 0 : data.text;
    const senderId = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!senderId) {
        throw new functions.https.HttpsError("unauthenticated", "User is not authenticated", { code: "unauthenticated" });
    }
    if (!recipientId || !text) {
        throw new functions.https.HttpsError("invalid-argument", "recipientId and text are required", { code: "bad-message" });
    }
    if (!senderId) {
        throw new functions.https.HttpsError("unauthenticated", "User is not authenticated", { code: "unauthenticated" });
    }
    if (!recipientId || !text) {
        throw new functions.https.HttpsError("invalid-argument", "recipientId and text are required", { code: "bad-message" });
    }
    if (recipientId === senderId) {
        throw new functions.https.HttpsError("failed-precondition", "Cannot create a chat with yourself", { code: "self-message" });
    }
    // проверка существующего чата
    const chatQuery = yield db
        .collection("chats")
        .where("participants", "in", [
        [senderId, recipientId],
        [recipientId, senderId]
    ])
        .limit(1)
        .get();
    if (!chatQuery.empty) {
        return { chatId: chatQuery.docs[0].id, message: "Chat already exists" };
    }
    const chatRef = yield db.collection("chats").add({
        participants: [senderId, recipientId],
        lastMessage: {
            text,
            senderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
    });
    yield chatRef.collection("messages").add({
        text,
        senderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [senderId],
    });
    return { chatId: chatRef.id };
}));
