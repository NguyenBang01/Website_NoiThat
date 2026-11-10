import { atom } from 'nanostores';
import type { User } from '../types';
import {
  migrateLegacyStorage,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '../lib/storage';
import { clientFetch } from '../lib/api';
import { toast } from 'sonner';

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
export const $authModalTab = atom<'login' | 'register' | 'forgot'>('login');

export function openAuthModal(tab: 'login' | 'register' | 'forgot' = 'login'): void {
  $authModalTab.set(tab);
  $isAuthModalOpen.set(true);
}

export function closeAuthModal(): void {
  $isAuthModalOpen.set(false);
}

/**
 * Khởi tạo auth state từ localStorage (chạy an toàn ở client)
 * Đồng thời tự động xác thực trạng thái tài khoản với server (khi F5)
 * Nếu Admin đã khóa tài khoản -> Lập tức đăng xuất và cảnh báo
 */
export function initAuth(): void {
  if (typeof window === 'undefined') return;

  // 1. Tự động chuyển đổi dữ liệu từ key cũ nếu có
  migrateLegacyStorage();

  try {
    const token = getStoredToken();
    const user = getStoredUser<User>();

    if (token && user && (user.id || user.email || user.full_name)) {
      $auth.set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // 2. Xác thực lại tức thì với server khi tải lại trang (F5)
      verifyAccountStatus();
    } else {
      if (token && !user) {
        removeStoredToken();
      }
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

  // 3. Lắng nghe sự kiện đăng xuất thông thường
  window.addEventListener('auth:logout', () => {
    logout();
  });

  // 4. Lắng nghe sự kiện tài khoản bị khóa
  window.addEventListener('auth:account_locked', ((e: CustomEvent<{ message?: string }>) => {
    const message = e.detail?.message || 'Tài khoản của bạn đã bị khóa bởi quản trị viên.';
    logout();
    toast.error(message, { duration: 6000 });
    if (window.location.pathname.startsWith('/account') || window.location.pathname.startsWith('/orders')) {
      window.location.href = '/';
    }
  }) as EventListener);
}

/**
 * Kiểm tra trạng thái tài khoản với Backend xem có bị khóa/chặn không
 */
export async function verifyAccountStatus(): Promise<void> {
  const currentToken = getStoredToken();
  if (!currentToken) return;

  try {
    const res = await clientFetch<User>('/auth/me');

    if (!res.success) {
      const msg = res.message || '';
      if (
        (res as any).code === 'ACCOUNT_LOCKED' ||
        msg.toLowerCase().includes('khóa') ||
        msg.toLowerCase().includes('blocked') ||
        msg.toLowerCase().includes('bị khóa')
      ) {
        logout();
        toast.error('Tài khoản của bạn đã bị khóa bởi quản trị viên. Hệ thống đã tự động đăng xuất.', {
          duration: 6000,
        });
        if (window.location.pathname.startsWith('/account') || window.location.pathname.startsWith('/orders')) {
          window.location.href = '/';
        }
        return;
      }
    }

    // Nếu tài khoản bị đánh dấu blocked trong data trả về
    if (res.data && ((res.data as any).status === 'blocked' || (res.data as any).status === 'locked')) {
      logout();
      toast.error('Tài khoản của bạn đã bị khóa bởi quản trị viên.', { duration: 6000 });
      if (window.location.pathname.startsWith('/account') || window.location.pathname.startsWith('/orders')) {
        window.location.href = '/';
      }
      return;
    }

    // Nếu dữ liệu hợp lệ, cập nhật thông tin mới nhất vào store
    if (res.data) {
      const current = $auth.get();
      const updatedUser = { ...current.user, ...res.data };
      setStoredUser(updatedUser);
      $auth.set({
        ...current,
        user: updatedUser,
      });
    }
  } catch {
    // Không làm gián đoạn nếu là lỗi mạng tạm thời
  }
}

/**
 * Lưu trạng thái đăng nhập
 */
export function setAuth(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    setStoredToken(token);
    setStoredUser(user);
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
    setStoredUser(updated);
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
    removeStoredToken();
    removeStoredUser();
  }
  $auth.set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
}
