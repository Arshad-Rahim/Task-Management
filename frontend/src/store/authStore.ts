import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/api";

import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "user"
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await api.post("/auth/login", { email, password });
          const { token, user } = response.data;
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          return false;
        }
      },
      logout: () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, isAuthenticated: false });
      },
      signup: async (
        email: string,
        password: string,
        name: string,
        role: "admin" | "user"
      ) => {
        try {
          const response = await api.post("/auth/signup", {
            email,
            password,
            name,
            role,
          });
          const { token, user } = response.data;
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
