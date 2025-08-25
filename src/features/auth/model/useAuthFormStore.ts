import { create } from "zustand";

type AuthFormState = {
    isRegister: boolean;
    toggleMode: () => void;
};

export const useAuthFormStore = create<AuthFormState>((set) => ({
    isRegister: false,
    toggleMode: () => set((state) => ({ isRegister: !state.isRegister })),
}));
