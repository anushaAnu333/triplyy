import api from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'affiliate';
  isEmailVerified: boolean;
  phoneNumber?: string;
  profileImage?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<{ userId: string; email: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/update-profile', data);
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { password, confirmPassword: password });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email/${token}`);
  },
};

