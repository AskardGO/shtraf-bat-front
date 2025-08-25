import { FC } from "react";
import { Button } from "@mui/material";
import { useAuthStore } from "features/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseService } from "app/firebase";

export const TestChatsButton: FC = () => {
    const { user } = useAuthStore(); // текущий пользователь
    const functions = getFunctions(firebaseService.app, "us-central1"); // регион функции

    const createTestChats = async () => {
        if (!user) {
            console.error("User is not logged in!");
            return;
        }

        const createChat = httpsCallable<
            { recipientId: string; text: string },
            { chatId: string; message?: string }
        >(functions, "createChatWithMessage");

        const testUsers = ["DFy0YRu1uCbFUXnsuAuwFOgWiMg1"];

        for (let i = 0; i < testUsers.length; i++) {
            try {
                const result = await createChat({
                    recipientId: testUsers[i],
                    text: `Hello, this is test chat ${i + 1}`,
                });

                console.log("Chat created:", result.data.chatId);
                if (result.data.message) console.log("Info:", result.data.message);
            } catch (err: any) {
                console.error(
                    "Error creating chat:",
                    err.code,
                    err.message,
                    err.details
                );
            }
        }
    };

    return (
        <Button variant="contained" color="secondary" onClick={createTestChats}>
            Create Test Chats
        </Button>
    );
};
