import { useCallback } from "react";
import { useAuthStore } from "shared/stores/authStore";

export const useLogout = () => {
    const { logout } = useAuthStore();

    return useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [logout]);
};
