import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/lib/api/client";

interface SubAdminState {
  subAdminName: string | null;
  isAuthenticated: boolean;
  isNameSet: boolean;
  setAuthenticated: (token: string) => void;
  setName: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<SubAdminState>()(
  persist(
    (set) => ({
      subAdminName: null,
      isAuthenticated: false,
      isNameSet: false,

      setAuthenticated: (token: string) => {
        tokenStorage.setToken(token);
        set({ isAuthenticated: true });
      },

      setName: (name: string) => {
        set({ subAdminName: name, isNameSet: true });
      },

      logout: () => {
        tokenStorage.clear();
        set({ subAdminName: null, isAuthenticated: false, isNameSet: false });
      },
    }),
    {
      name: "qc_subadmin_auth",
      partialize: (state) => ({
        subAdminName: state.subAdminName,
        isAuthenticated: state.isAuthenticated,
        isNameSet: state.isNameSet,
      }),
    }
  )
);
