"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Get, Post } from "@/lib/clientUtil";
import { AUTH_TOKEN_KEY } from "@/lib/token";

export type AuthUser = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  roles: string[];
  branch: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }

    Get<{ user: AuthUser }>("/api/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await Post<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      { username, password },
    );
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    await Post("/api/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
