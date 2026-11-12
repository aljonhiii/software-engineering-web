import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';
import {
  getStoredToken,
  setStoredToken,
  loginUser,
  fetchCurrentUser,
} from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(existingToken);
      const res = await fetchCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      }
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (identifier: string, password: string): Promise<AuthUser> => {
    const res = await loginUser(identifier, password);
    if (res.success && res.token && res.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Authentication failed.');
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await fetchCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch {
      // Ignore refresh error
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
