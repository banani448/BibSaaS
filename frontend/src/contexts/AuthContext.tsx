import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/api';
import { authService, LoginPayload, RegisterPayload } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bibsaas_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bibsaas_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      localStorage.setItem('bibsaas_user', JSON.stringify(profile));
    } catch (error) {
      // Token might be invalid or expired - don't block the app
      console.error('Failed to refresh profile:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('bibsaas_token');
      localStorage.removeItem('bibsaas_user');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('bibsaas_token', data.accessToken);
    localStorage.setItem('bibsaas_user', JSON.stringify(data.user));
  };

  const register = async (payload: RegisterPayload) => {
    const data = await authService.register(payload);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('bibsaas_token', data.accessToken);
    localStorage.setItem('bibsaas_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('bibsaas_token');
      localStorage.removeItem('bibsaas_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
