import { atom, computed } from 'nanostores';
import type { Product, WishlistItem } from '../types';
import { clientFetch } from '../lib/api';
import { $auth } from './authStore';
import { toast } from 'sonner';

const GUEST_WISHLIST_KEY = 'gnd_guest_wishlist';

export const $wishlistItems = atom<WishlistItem[]>([]);
export const $wishlistIds = atom<number[]>([]);
export const $isWishlistLoading = atom<boolean>(false);

export const $wishlistCount = computed($wishlistIds, (ids) => ids.length);

/**
 * Kiểm tra xem một ID sản phẩm đã có trong danh sách yêu thích chưa
 */
export function isInWishlist(productId: number): boolean {
  return $wishlistIds.get().includes(productId);
}

/**
 * Khởi tạo wishlist (chạy an toàn trên trình duyệt)
 */
export async function initWishlist(): Promise<void> {
  if (typeof window === 'undefined') return;

  const auth = $auth.get();
  if (auth.isAuthenticated) {
    await fetchServerWishlist();
  } else {
    loadGuestWishlist();
  }

  // Lắng nghe thay đổi trạng thái đăng nhập để tự động đồng bộ
  $auth.listen(async (currentAuth, prevAuth) => {
    if (currentAuth.isAuthenticated && !prevAuth?.isAuthenticated) {
      await syncGuestWishlistToServer();
      await fetchServerWishlist();
    } else if (!currentAuth.isAuthenticated && prevAuth?.isAuthenticated) {
      loadGuestWishlist();
    }
  });
}

/**
 * Đọc wishlist của khách vãng lai từ localStorage
 */
function loadGuestWishlist(): void {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) {
      $wishlistIds.set([]);
      $wishlistItems.set([]);
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'number') {
        $wishlistIds.set(parsed);
        $wishlistItems.set([]);
      } else {
        const items = parsed as WishlistItem[];
        $wishlistItems.set(items);
        const ids = items.map((it) => it.product_id || it.product?.id).filter(Boolean) as number[];
        $wishlistIds.set(ids);
      }
    }
  } catch {
    $wishlistIds.set([]);
    $wishlistItems.set([]);
  }
}

/**
 * Lưu wishlist của khách vãng lai vào localStorage
 */
function saveGuestWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

/**
 * Lấy toàn bộ wishlist từ server cho khách đã đăng nhập
 */
export async function fetchServerWishlist(): Promise<void> {
  $isWishlistLoading.set(true);
  try {
    const res = await clientFetch<any>('/wishlist?limit=100');
    if (res.success && res.data) {
      const items: WishlistItem[] = Array.isArray(res.data) ? res.data : (res.data.items || []);
      $wishlistItems.set(items);
      const ids = items.map((it) => it.product_id || it.product?.id).filter(Boolean) as number[];
      $wishlistIds.set(ids);
    }
  } catch {
    // Bỏ qua lỗi kết nối nền
  } finally {
    $isWishlistLoading.set(false);
  }
}

/**
 * Đồng bộ các sản phẩm đã thích từ localStorage lên database sau khi đăng nhập
 */
async function syncGuestWishlistToServer(): Promise<void> {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    let guestIds: number[] = [];
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'number') {
        guestIds = parsed;
      } else {
        guestIds = parsed.map((it: any) => it.product_id || it.product?.id).filter(Boolean);
      }
    }
    if (guestIds.length > 0) {
      for (const pid of guestIds) {
        try {
          await clientFetch('/wishlist', {
            method: 'POST',
            body: JSON.stringify({ product_id: pid }),
          });
        } catch {
          // Bỏ qua nếu đã thích
        }
      }
      localStorage.removeItem(GUEST_WISHLIST_KEY);
    }
  } catch {
    // Bỏ qua
  }
}

/**
 * Thao tác Thêm / Xóa sản phẩm khỏi danh sách yêu thích (Toggle)
 */
export async function toggleWishlist(product: Product): Promise<boolean> {
  const currentIds = $wishlistIds.get();
  const isAlreadyLiked = currentIds.includes(product.id);
  const auth = $auth.get();

  if (isAlreadyLiked) {
    // 1. XÓA KHỎI YÊU THÍCH
    const newIds = currentIds.filter((id) => id !== product.id);
    const newItems = $wishlistItems.get().filter((it) => (it.product_id || it.product?.id) !== product.id);
    $wishlistIds.set(newIds);
    $wishlistItems.set(newItems);

    if (auth.isAuthenticated) {
      try {
        await clientFetch(`/wishlist/${product.id}`, { method: 'DELETE' });
      } catch {
        // Bỏ qua
      }
    } else {
      saveGuestWishlist(newItems);
    }

    toast.info(`Đã xóa "${product.name}" khỏi danh sách yêu thích`);
    return false;
  } else {
    // 2. THÊM VÀO YÊU THÍCH
    const newIds = [...currentIds, product.id];
    $wishlistIds.set(newIds);

    const newItem: WishlistItem = {
      id: Date.now(),
      user_id: auth.user?.id || 0,
      product_id: product.id,
      product: product,
      created_at: new Date().toISOString(),
    };
    const newItems = [newItem, ...$wishlistItems.get()];
    $wishlistItems.set(newItems);

    if (auth.isAuthenticated) {
      try {
        await clientFetch('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id }),
        });
      } catch {
        // Bỏ qua
      }
    } else {
      saveGuestWishlist(newItems);
    }

    toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích!`, {
      description: 'Bạn có thể xem lại tại mục Sản phẩm yêu thích.',
    });
    return true;
  }
}
