import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserPublic, AuthResponse } from '@language-challenger/shared';
import { api } from '@/lib/api';

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .get<{ user: UserPublic }>('/auth/me')
        .then((res) => setUser(res.user))
        .catch(() => {
          api.clearToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { username, password });
    api.setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((u: UserPublic) => {
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
