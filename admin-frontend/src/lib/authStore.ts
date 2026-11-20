import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User, refreshToken?: string, permissions?: string[]) => void;
  setAccessToken: (accessToken: string) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
}

const REFRESH_TOKEN_KEY = 'furniture_admin_refresh_token';
const USER_KEY = 'furniture_admin_user';
const PERMISSIONS_KEY = 'furniture_admin_permissions';

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
  } catch { }
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const getStoredPermissions = (): string[] => {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setStoredPermissions = (permissions: string[]): void => {
  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch { }
};

export const removeStoredPermissions = (): void => {
  localStorage.removeItem(PERMISSIONS_KEY);
};

// Tự động kiểm tra nếu có token hoặc user truyền qua URL Hash hoặc Search (ví dụ redirect từ Storefront)
try {
  if (typeof window !== 'undefined') {
    let urlToken: string | null = null;
    let urlUser: string | null = null;

    // 1. Kiểm tra trong URL Hash (#token=...&user=...) - an toàn hơn, không gửi qua HTTP header
    if (window.location.hash && window.location.hash.length > 1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      urlToken = hashParams.get('token');
      urlUser = hashParams.get('user');
    }

    // 2. Dự phòng: Kiểm tra search params (?token=...&user=...)
    if (!urlToken) {
      const searchParams = new URLSearchParams(window.location.search);
      urlToken = searchParams.get('token');
      urlUser = searchParams.get('user');

      // Nếu token bị bọc bên trong query param redirect (ví dụ: ?redirect=/?token=...)
      if (!urlToken && searchParams.get('redirect')) {
        const redirectVal = decodeURIComponent(searchParams.get('redirect')!);
        const tMatch = redirectVal.match(/[?&]token=([^&]+)/);
        if (tMatch) urlToken = decodeURIComponent(tMatch[1]);
        const uMatch = redirectVal.match(/[?&]user=([^&]+)/);
        if (uMatch) urlUser = decodeURIComponent(uMatch[1]);
      }
    }

    if (urlToken) {
      setStoredRefreshToken(urlToken);
      if (urlUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(urlUser));
          if (parsedUser) setStoredUser(parsedUser);
        } catch { }
      }

      // Xóa ngay token khỏi URL thanh địa chỉ trình duyệt để tránh lưu vào lịch sử hoặc rò rỉ qua Referer
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }
} catch { }

const initialToken = getStoredRefreshToken();
const initialUser = getStoredUser();
const initialPermissions = getStoredPermissions();
const isInitiallyAuthed = !!(
  initialToken &&
  initialUser &&
  initialUser.role !== 'customer'
);

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  user: initialUser,
  permissions: initialPermissions.length > 0 ? initialPermissions : (initialUser?.permissions || []),
  isAuthenticated: isInitiallyAuthed,
  setAuth: (accessToken, user, refreshToken, permissions) => {
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    } else {
      setStoredRefreshToken(accessToken);
    }
    setStoredUser(user);
    const perms = permissions || user.permissions || [];
    setStoredPermissions(perms);
    set({
      accessToken,
      user,
      permissions: perms,
      isAuthenticated: true,
    });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  setPermissions: (permissions) => {
    setStoredPermissions(permissions);
    set({ permissions });
  },
  clearAuth: () => {
    removeStoredRefreshToken();
    removeStoredUser();
    removeStoredPermissions();
    set({
      accessToken: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
    });
  },
}));
