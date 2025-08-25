import { create } from "zustand";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebaseService } from "app/firebase/firebase";

type AuthState = {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
}));

onAuthStateChanged(firebaseService.auth, (user) => {
    useAuthStore.getState().setUser(user);
});
