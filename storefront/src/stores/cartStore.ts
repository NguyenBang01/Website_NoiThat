import { atom, computed } from 'nanostores';
import type { CartItem } from '../types';
import { clientFetch } from '../lib/api';
import { $auth } from './authStore';

export interface CartStoreState {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  isLoading: boolean;
}

const GUEST_CART_STORAGE_KEY = 'gnd_guest_cart';

export const $cart = atom<CartStoreState>({
  items: [],
  totalQuantity: 0,
  subtotal: 0,
  isLoading: false,
});

export const $isCartOpen = atom<boolean>(false);

export const $cartCount = computed($cart, (cart) => cart.totalQuantity);
export const $cartSubtotal = computed($cart, (cart) => cart.subtotal);

export function openCart(): void {
  $isCartOpen.set(true);
}

export function closeCart(): void {
  $isCartOpen.set(false);
}

export function toggleCart(): void {
  $isCartOpen.set(!$isCartOpen.get());
}

/**
 * Tính toán tổng số lượng và tổng tiền từ danh sách items
 */
function recalculate(items: CartItem[]): { totalQuantity: number; subtotal: number } {
  let totalQuantity = 0;
  let subtotal = 0;

  for (const item of items) {
    totalQuantity += item.quantity;
    subtotal += item.unit_price * item.quantity;
  }

  return { totalQuantity, subtotal };
}

/**
 * Khởi tạo giỏ hàng (chạy ở browser)
 */
export async function initCart(): Promise<void> {
  if (typeof window === 'undefined') return;

  const auth = $auth.get();
  if (auth.isAuthenticated) {
    await fetchServerCart();
  } else {
    loadGuestCart();
  }
}

/**
 * Đọc giỏ hàng khách từ localStorage
 */
function loadGuestCart(): void {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    const { totalQuantity, subtotal } = recalculate(items);

    $cart.set({
      items,
      totalQuantity,
      subtotal,
      isLoading: false,
    });
  } catch {
    $cart.set({
      items: [],
      totalQuantity: 0,
      subtotal: 0,
      isLoading: false,
    });
  }
}

/**
 * Lưu giỏ hàng khách vào localStorage
 */
function saveGuestCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Lấy giỏ hàng từ server cho user đã đăng nhập
 */
export async function fetchServerCart(): Promise<void> {
  $cart.set({ ...$cart.get(), isLoading: true });
  try {
    const res = await clientFetch<any>('/cart');
    if (res.success && res.data) {
      // Backend format có thể là { items: [...] } hoặc danh sách items trực tiếp
      const rawItems: any[] = Array.isArray(res.data) ? res.data : (res.data.items || []);
      const items: CartItem[] = rawItems.map((it: any) => ({
        id: it.id || it.variant_id,
        variant_id: it.variant_id,
        product_id: it.product_id,
        product_name: it.product_name,
        product_slug: it.product_slug || '',
        sku: it.variant_sku || it.sku || '',
        color: it.color,
        size: it.size,
        material: it.material,
        image_url: it.product_image || it.image_url,
        original_price: it.price || 0,
        unit_price: it.sale_price || it.price || 0,
        quantity: it.quantity,
        line_total: it.subtotal || (it.sale_price || it.price || 0) * it.quantity,
        stock_quantity: it.stock_quantity ?? 999,
        available: it.in_stock ?? true,
      }));

      const { totalQuantity, subtotal } = recalculate(items);
      $cart.set({
        items,
        totalQuantity,
        subtotal,
        isLoading: false,
      });
    } else {
      $cart.set({ ...$cart.get(), isLoading: false });
    }
  } catch {
    $cart.set({ ...$cart.get(), isLoading: false });
  }
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export async function addToCart(
  item: Omit<CartItem, 'id' | 'line_total'>
): Promise<{ success: boolean; message: string }> {
  const auth = $auth.get();

  if (auth.isAuthenticated) {
    try {
      const res = await clientFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: item.variant_id,
          quantity: item.quantity,
        }),
      });

      if (res.success) {
        await fetchServerCart();
        openCart();
        return { success: true, message: 'Đã thêm vào giỏ hàng' };
      }
      return { success: false, message: res.message || 'Thêm thất bại' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi kết nối' };
    }
  }

  // Khách chưa đăng nhập: lưu vào localStorage
  const current = $cart.get();
  const existingIdx = current.items.findIndex((i) => i.variant_id === item.variant_id);
  let updatedItems: CartItem[];

  if (existingIdx >= 0) {
    updatedItems = [...current.items];
    const existing = updatedItems[existingIdx];
    const newQty = existing.quantity + item.quantity;
    updatedItems[existingIdx] = {
      ...existing,
      quantity: newQty,
      line_total: existing.unit_price * newQty,
    };
  } else {
    const newItem: CartItem = {
      ...item,
      id: Date.now(),
      line_total: item.unit_price * item.quantity,
    };
    updatedItems = [newItem, ...current.items];
  }

  saveGuestCart(updatedItems);
  const { totalQuantity, subtotal } = recalculate(updatedItems);
  $cart.set({
    items: updatedItems,
    totalQuantity,
    subtotal,
    isLoading: false,
  });

  openCart();
  return { success: true, message: 'Đã thêm vào giỏ hàng' };
}

/**
 * Cập nhật số lượng của một mục giỏ hàng
 */
export async function updateQuantity(
  itemOrId: CartItem | number,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  const current = $cart.get();
  
  // Tìm item tương ứng trong giỏ
  let targetItem: CartItem | undefined;
  if (typeof itemOrId === 'object' && itemOrId !== null) {
    targetItem = itemOrId;
  } else {
    targetItem = current.items.find(
      (it) => it.id === itemOrId || it.variant_id === itemOrId
    );
  }

  if (!targetItem) {
    return { success: false, message: 'Không tìm thấy sản phẩm trong giỏ' };
  }

  // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ
  if (quantity <= 0) {
    return removeFromCart(targetItem);
  }

  // Cập nhật lạc quan (optimistic update) trên state để UI phản hồi ngay lập tức
  const previousItems = [...current.items];
  const updatedItems = current.items.map((it) => {
    if (it.variant_id === targetItem!.variant_id || (targetItem!.id && it.id === targetItem!.id)) {
      return {
        ...it,
        quantity,
        line_total: it.unit_price * quantity,
      };
    }
    return it;
  });

  const { totalQuantity, subtotal } = recalculate(updatedItems);
  $cart.set({
    ...current,
    items: updatedItems,
    totalQuantity,
    subtotal,
  });

  const auth = $auth.get();
  if (auth.isAuthenticated) {
    try {
      // Backend dùng cart_items.id (targetItem.id)
      const serverItemId = targetItem.id || targetItem.variant_id;
      const res = await clientFetch(`/cart/items/${serverItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });

      if (res.success) {
        await fetchServerCart();
        return { success: true };
      }

      // Rollback nếu thất bại (ví dụ vượt quá tồn kho)
      const prevCalc = recalculate(previousItems);
      $cart.set({
        ...current,
        items: previousItems,
        totalQuantity: prevCalc.totalQuantity,
        subtotal: prevCalc.subtotal,
      });
      return { success: false, message: res.message || 'Cập nhật số lượng thất bại' };
    } catch (e: any) {
      const prevCalc = recalculate(previousItems);
      $cart.set({
        ...current,
        items: previousItems,
        totalQuantity: prevCalc.totalQuantity,
        subtotal: prevCalc.subtotal,
      });
      return { success: false, message: e.message || 'Lỗi kết nối' };
    }
  }

  // Khách chưa đăng nhập: lưu vào localStorage
  saveGuestCart(updatedItems);
  return { success: true };
}

/**
 * Xóa một mục khỏi giỏ hàng
 */
export async function removeFromCart(
  itemOrId: CartItem | number
): Promise<{ success: boolean; message?: string }> {
  const current = $cart.get();

  let targetItem: CartItem | undefined;
  if (typeof itemOrId === 'object' && itemOrId !== null) {
    targetItem = itemOrId;
  } else {
    targetItem = current.items.find(
      (it) => it.id === itemOrId || it.variant_id === itemOrId
    );
  }

  if (!targetItem) {
    return { success: false, message: 'Không tìm thấy sản phẩm trong giỏ' };
  }

  // Cập nhật lạc quan (optimistic removal)
  const previousItems = [...current.items];
  const updatedItems = current.items.filter(
    (it) => it.variant_id !== targetItem!.variant_id && (!targetItem!.id || it.id !== targetItem!.id)
  );

  const { totalQuantity, subtotal } = recalculate(updatedItems);
  $cart.set({
    ...current,
    items: updatedItems,
    totalQuantity,
    subtotal,
  });

  const auth = $auth.get();
  if (auth.isAuthenticated) {
    try {
      const serverItemId = targetItem.id || targetItem.variant_id;
      const res = await clientFetch(`/cart/items/${serverItemId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        await fetchServerCart();
        return { success: true };
      }

      // Rollback nếu lỗi
      const prevCalc = recalculate(previousItems);
      $cart.set({
        ...current,
        items: previousItems,
        totalQuantity: prevCalc.totalQuantity,
        subtotal: prevCalc.subtotal,
      });
      return { success: false, message: res.message || 'Xóa sản phẩm thất bại' };
    } catch (e: any) {
      const prevCalc = recalculate(previousItems);
      $cart.set({
        ...current,
        items: previousItems,
        totalQuantity: prevCalc.totalQuantity,
        subtotal: prevCalc.subtotal,
      });
      return { success: false, message: e.message || 'Lỗi kết nối' };
    }
  }

  // Khách chưa đăng nhập
  saveGuestCart(updatedItems);
  return { success: true };
}

/**
 * Xóa sạch toàn bộ giỏ hàng
 */
export async function clearCart(): Promise<void> {
  const auth = $auth.get();
  if (auth.isAuthenticated) {
    try {
      await clientFetch('/cart', { method: 'DELETE' });
    } catch {}
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  }

  $cart.set({
    items: [],
    totalQuantity: 0,
    subtotal: 0,
    isLoading: false,
  });
}
