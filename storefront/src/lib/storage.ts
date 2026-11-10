/**
 * Quản lý định danh các khóa (keys) lưu trữ trong trình duyệt (localStorage) cho Storefront.
 * Sử dụng tiền tố riêng 'gnd_storefront_*' để tránh xung đột với Admin hoặc các ứng dụng khác cùng domain/localhost.
 */

export const STORAGE_KEYS = {
  TOKEN: 'gnd_storefront_token',
  USER: 'gnd_storefront_user',
  CART: 'gnd_storefront_cart',
  WISHLIST: 'gnd_storefront_wishlist',
  NOTIFICATIONS_READ: 'gnd_storefront_read_notifs',
} as const;

/**
 * Tự động di chuyển dữ liệu từ key cũ ('token', 'user', 'gnd_guest_cart', ...) sang key mới có tiền tố chuẩn
 * Đảm bảo người dùng không bị mất phiên đăng nhập hoặc giỏ hàng hiện tại khi nâng cấp hệ thống.
 */
export function migrateLegacyStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Chuyển token cũ
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) {
      if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, legacyToken);
      }
      localStorage.removeItem('token');
    }

    // 2. Chuyển user cũ
    const legacyUser = localStorage.getItem('user');
    if (legacyUser) {
      if (!localStorage.getItem(STORAGE_KEYS.USER)) {
        localStorage.setItem(STORAGE_KEYS.USER, legacyUser);
      }
      localStorage.removeItem('user');
    }

    // 3. Chuyển giỏ hàng khách cũ
    const legacyCart = localStorage.getItem('gnd_guest_cart');
    if (legacyCart) {
      if (!localStorage.getItem(STORAGE_KEYS.CART)) {
        localStorage.setItem(STORAGE_KEYS.CART, legacyCart);
      }
      localStorage.removeItem('gnd_guest_cart');
    }

    // 4. Chuyển wishlist khách cũ
    const legacyWishlist = localStorage.getItem('gnd_guest_wishlist');
    if (legacyWishlist) {
      if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) {
        localStorage.setItem(STORAGE_KEYS.WISHLIST, legacyWishlist);
      }
      localStorage.removeItem('gnd_guest_wishlist');
    }
  } catch {
    // Bỏ qua lỗi trình duyệt nếu localStorage bị chặn
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function removeStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
}

