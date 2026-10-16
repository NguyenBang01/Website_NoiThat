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
const USER_KEY = 'furniture_admin_user';

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeStoredRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Tự động kiểm tra nếu có token hoặc user truyền qua URL (ví dụ redirect từ Storefront)
try {
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    let urlToken = searchParams.get('token');
    let urlUser = searchParams.get('user');

    // Nếu token bị bọc bên trong query param redirect (ví dụ: ?redirect=/?token=...)
    if (!urlToken && searchParams.get('redirect')) {
      const redirectVal = decodeURIComponent(searchParams.get('redirect')!);
      const tMatch = redirectVal.match(/[?&]token=([^&]+)/);
      if (tMatch) urlToken = decodeURIComponent(tMatch[1]);
      const uMatch = redirectVal.match(/[?&]user=([^&]+)/);
      if (uMatch) urlUser = decodeURIComponent(uMatch[1]);
    }

    if (urlToken) {
      setStoredRefreshToken(urlToken);
      if (urlUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(urlUser));
          if (parsedUser) setStoredUser(parsedUser);
        } catch {}
      }
    }
  }
} catch {}

const initialToken = getStoredRefreshToken();
const initialUser = getStoredUser();
const isInitiallyAuthed = !!(
  initialToken &&
  initialUser &&
  initialUser.role === 'admin'
);

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  user: initialUser,
  isAuthenticated: isInitiallyAuthed,
  setAuth: (accessToken, user, refreshToken) => {
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    } else {
      setStoredRefreshToken(accessToken);
    }
    setStoredUser(user);
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearAuth: () => {
    removeStoredRefreshToken();
    removeStoredUser();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
