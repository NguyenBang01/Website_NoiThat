import { atom } from 'nanostores';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const $auth = atom<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
});

export const $isAuthModalOpen = atom<boolean>(false);
export const $authModalTab = atom<'login' | 'register'>('login');

export function openAuthModal(tab: 'login' | 'register' = 'login'): void {
  $authModalTab.set(tab);
  $isAuthModalOpen.set(true);
}

export function closeAuthModal(): void {
  $isAuthModalOpen.set(false);
}

/**
 * Khởi tạo auth state từ localStorage (chạy an toàn ở client)
 */
export function initAuth(): void {
  if (typeof window === 'undefined') return;

  try {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (token && user) {
      $auth.set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      $auth.set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  } catch {
    $auth.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  // Lắng nghe sự kiện đăng xuất từ api.ts khi token hết hạn
  window.addEventListener('auth:logout', () => {
    logout();
  });
}

/**
 * Lưu trạng thái đăng nhập
 */
export function setAuth(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  $auth.set({
    user,
    token,
    isAuthenticated: true,
    isLoading: false,
  });
}

/**
 * Cập nhật thông tin profile của user hiện tại
 */
export function updateUser(partialUser: Partial<User>): void {
  const current = $auth.get();
  if (!current.user) return;

  const updated = { ...current.user, ...partialUser };
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(updated));
  }
  $auth.set({
    ...current,
    user: updated,
  });
}

/**
 * Đăng xuất
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  $auth.set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
}
