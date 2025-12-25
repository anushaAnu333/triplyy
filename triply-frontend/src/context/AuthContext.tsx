'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User, LoginCredentials, RegisterData } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('accessToken', response.accessToken);
    setUser(response.user);
    router.push('/dashboard');
  };

  const register = async (data: RegisterData) => {
    await authApi.register(data);
    router.push('/login?registered=true');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      router.push('/');
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const updatedUser = await authApi.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

