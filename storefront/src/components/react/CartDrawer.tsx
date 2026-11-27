import React from 'react';
import { useStore } from '@nanostores/react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag } from 'lucide-react';
import {
  $cart,
  $isCartOpen,
  closeCart,
  updateQuantity,
  removeFromCart,
} from '../../stores/cartStore';
import { formatCurrency, imgUrl } from '../../lib/format';

export default function CartDrawer() {
  const isOpen = useStore($isCartOpen);
  const cart = useStore($cart);

  // Hỗ trợ phím Escape để đóng nhanh giỏ hàng
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-[101]">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header - Nằm trên cùng, không bao giờ bị che bởi menu */}
          <div className="p-4 sm:p-5 border-b border-warm-100 flex items-center justify-between bg-white shrink-0 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-warm-900 leading-tight">
                  Giỏ hàng của bạn
                </h2>
                <p className="text-xs text-warm-500">
                  {cart.totalQuantity} sản phẩm
                </p>
              </div>
            </div>

            {/* Nút X đóng giỏ hàng to rõ, dễ bấm */}
            <button
              type="button"
              onClick={closeCart}
              className="w-9 h-9 rounded-full bg-warm-100 hover:bg-rose-100 text-warm-600 hover:text-rose-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
              aria-label="Đóng giỏ hàng"
              title="Đóng giỏ hàng (✕)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-warm-100">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-warm-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center text-warm-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-warm-600">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-warm-400 max-w-xs">
                  Hãy khám phá các mẫu nội thất sang trọng của Góc Nhà Đẹp và thêm vào giỏ nhé!
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 transition"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={`${item.variant_id}-${item.id}`} className="pt-4 first:pt-0 flex gap-3.5">
                  <div className="w-20 h-20 rounded-xl bg-warm-100 overflow-hidden shrink-0 border border-warm-200">
                    {item.image_url ? (
                      <img
                        src={imgUrl(item.image_url)}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-300">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-warm-900 line-clamp-1">
                          {item.product_name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item)}
                          className="p-1 text-warm-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-warm-500 mt-0.5">
                        {item.color || item.material || item.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-warm-200 bg-warm-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="p-1 hover:bg-warm-100 text-warm-600 transition"
                          title="Giảm số lượng"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-medium text-xs text-warm-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          className="p-1 hover:bg-warm-100 text-warm-600 transition"
                          title="Tăng số lượng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-brand-800">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cart.items.length > 0 && (
            <div className="p-5 border-t border-warm-200 bg-warm-50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-600">Tạm tính:</span>
                <span className="font-bold text-base text-brand-800 font-serif">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="leading-tight">
                  Mã <strong className="font-mono text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">FREESHIP</strong> & ưu đãi thành viên sẵn sàng áp dụng tại bước thanh toán!
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full py-2.5 px-3 rounded-xl border border-warm-300 text-warm-700 text-xs font-medium hover:bg-warm-100 transition text-center"
                >
                  Mua thêm
                </button>
                <a
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-2.5 px-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center shadow-xs"
                >
                  Thanh toán <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
