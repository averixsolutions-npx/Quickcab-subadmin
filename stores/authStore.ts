import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SubAdminState {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  setAuthenticated: (admin: AdminProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<SubAdminState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,

      setAuthenticated: (admin: AdminProfile) => {
        set({ admin, isAuthenticated: true });
      },

      logout: () => {
        set({ admin: null, isAuthenticated: false });
      },
    }),
    {
      name: "qc_subadmin_auth",
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
