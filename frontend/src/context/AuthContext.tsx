"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("VoiceCortex-token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem("VoiceCortex-token");
      setToken(null);
      setUser(null);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem("VoiceCortex-token", newToken);
    setToken(newToken);
    await fetchUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem("VoiceCortex-token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
