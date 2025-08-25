import { create } from "zustand";
import { persist } from "zustand/middleware";

type LayoutState = {
    leftWidth: number;
    setLeftWidth: (value: number) => void;
};

export const useLayoutStore = create(
    persist<LayoutState>(
        (set) => ({
            leftWidth: 0.33,
            setLeftWidth: (value) => set({ leftWidth: value }),
        }),
        {
            name: "layout-storage",
        }
    )
);
