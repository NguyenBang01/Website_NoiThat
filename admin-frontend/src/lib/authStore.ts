import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User, refreshToken?: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

const REFRESH_TOKEN_KEY = 'furniture_admin_refresh_token';

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeStoredRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, user, refreshToken) => {
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    } else {
      // Nếu server trả token duy nhất thì lưu token đó làm token để refresh
      setStoredRefreshToken(accessToken);
    }
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    removeStoredRefreshToken();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
