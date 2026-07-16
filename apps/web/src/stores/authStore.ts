import { create } from "zustand";
import type { UserSession } from "@visitflow/shared";

interface AuthState {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Login failed");

    // Extract token from response — the backend returns { data: { user, tokens: { accessToken, refreshToken } } }
    const token = json.data?.tokens?.accessToken;
    const refreshToken = json.data?.tokens?.refreshToken;
    const user = json.data?.user;

    if (!token || !user) throw new Error("Invalid response from server");

    localStorage.setItem("access_token", token);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        set({ user: json.data, token, isAuthenticated: true, isLoading: false });
      } else {
        // Token invalid — clear it
        localStorage.removeItem("access_token");
        set({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
