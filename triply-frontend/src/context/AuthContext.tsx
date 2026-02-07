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
  refreshUser: () => Promise<void>;
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
    
    // Check for redirect URL in localStorage (set by pages that need redirect)
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
      return;
    }
    
    // Redirect based on user role
    if (response.user.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (response.user.role === 'affiliate') {
      router.push('/affiliate/dashboard');
    } else if (response.user.role === 'merchant') {
      router.push('/merchant/dashboard');
    } else {
      router.push('/');
    }
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

  const refreshUser = async () => {
    await fetchUser();
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
        refreshUser,
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

