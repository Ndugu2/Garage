import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGetMe, apiLogin, apiLogout, apiRegister, fetchCsrfToken } from '../services/api';
import { User, UserRole } from '../services/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      await fetchCsrfToken();
      const currentUser = await apiGetMe();
      setUser(currentUser);
    } catch {
      // Not logged in or session expired
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiLogin(email, pass);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, role: UserRole): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRegister(name, email, pass, role);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await apiGetMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
