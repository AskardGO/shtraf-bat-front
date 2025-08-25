import { useCallback } from "react";
import { signOut } from "firebase/auth";
import { firebaseService } from "app/firebase";
import { useAuthStore } from "features/auth";

export const useLogout = () => {
    const setUser = useAuthStore((state) => state.setUser);

    return useCallback(async () => {
        try {
            await signOut(firebaseService.auth);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [setUser]);

};
