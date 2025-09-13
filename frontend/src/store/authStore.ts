import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StorageValue } from "zustand/middleware";

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "user"
  ) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (response.ok && data.token && data.user) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },
      signup: async (
        email: string,
        password: string,
        name: string,
        role: "admin" | "user"
      ) => {
        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name, role }),
          });
          const data = await response.json();
          if (response.ok && data.token && data.user) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Signup error:", error);
          return false;
        }
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name: string): StorageValue<AuthState> | null => {
          const value = localStorage.getItem(name);
          if (value === null) return null;
          return JSON.parse(value) as StorageValue<AuthState>;
        },
        setItem: (name: string, value: StorageValue<AuthState>) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      },
    }
  )
);
