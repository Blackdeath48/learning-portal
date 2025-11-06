"use client";

import { useCallback, useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "LEARNER";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const TOKEN_KEY = "ethixlearn.token";
const USER_KEY = "ethixlearn.user";

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored auth user", error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = (await response.json()) as { user: AuthUser };
      login(token, data.user);
    } catch (error) {
      console.error("Failed to refresh auth", error);
      logout();
    }
  }, [login, logout, token]);

  return { user, token, loading, login, logout, refresh };
}
