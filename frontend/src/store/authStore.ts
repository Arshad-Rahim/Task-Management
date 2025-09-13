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
  restoreAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await api.post("/auth/login", { email, password });
          // Check if response.data is valid
          if (!response.data || typeof response.data !== "object") {
            console.error("Invalid login response:", response.data);
            throw new Error("Invalid server response");
          }
          const { token, user } = response.data;
          if (!token || !user) {
            console.error("Missing token or user in response:", response.data);
            throw new Error("Incomplete login data");
          }
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          set({ user, isAuthenticated: true });
          console.log("Login successful:", { user, token });
          return true;
        } catch (error: any) {
          console.error("Login failed:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          return false;
        }
      },
      logout: () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, isAuthenticated: false });
        console.log("Logged out");
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
          if (!response.data || typeof response.data !== "object") {
            console.error("Invalid signup response:", response.data);
            throw new Error("Invalid server response");
          }
          const { token, user } = response.data;
          if (!token || !user) {
            console.error("Missing token or user in response:", response.data);
            throw new Error("Incomplete signup data");
          }
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          set({ user, isAuthenticated: true });
          console.log("Signup successful:", { user, token });
          return true;
        } catch (error: any) {
          console.error("Signup failed:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          return false;
        }
      },
      restoreAuth: async () => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const response = await api.get("/auth/me");
            if (!response.data || typeof response.data !== "object") {
              console.error("Invalid /auth/me response:", response.data);
              throw new Error("Invalid server response");
            }
            set({ user: response.data, isAuthenticated: true });
            console.log("Auth restored:", { user: response.data, token });
          } catch (error: any) {
            console.error("Auth restoration failed:", {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
            });
            localStorage.removeItem("token");
            delete api.defaults.headers.common["Authorization"];
            set({ user: null, isAuthenticated: false });
          }
        } else {
          console.log("No token found in localStorage");
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);