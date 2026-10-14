import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'sonner';
import { Sparkles, ShoppingBag, Plus, Minus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { $cart, addToCart, openCart } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/format';

interface Props {
  sampleProduct: {
    id: number;
    variant_id: number;
    name: string;
    slug: string;
    price: number;
    sale_price?: number | null;
    image?: string;
    sku: string;
    material?: string;
    color?: string;
  };
}

export default function Stage0InteractiveCard({ sampleProduct }: Props) {
  const [qty, setQty] = useState(1);
  const cart = useStore($cart);

  const effectivePrice = sampleProduct.sale_price || sampleProduct.price;

  const handleAddToCart = async () => {
    const result = await addToCart({
      variant_id: sampleProduct.variant_id,
      product_id: sampleProduct.id,
      product_name: sampleProduct.name,
      product_slug: sampleProduct.slug,
      sku: sampleProduct.sku,
      color: sampleProduct.color || 'Gỗ sồi tự nhiên',
      material: sampleProduct.material || 'Gỗ tự nhiên cao cấp',
      image_url: sampleProduct.image,
      original_price: sampleProduct.price,
      unit_price: effectivePrice,
      quantity: qty,
      stock_quantity: 50,
      available: true,
    });

    if (result.success) {
      toast.success(`Đã thêm ${qty} "${sampleProduct.name}" vào giỏ hàng!`, {
        description: `Tổng giỏ hàng: ${formatCurrency(cart.subtotal + effectivePrice * qty)}`,
      });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-warm-100 mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            React Island Demo (Client Hydrated)
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Nanostores Reactive
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-warm-900 line-clamp-1">
            {sampleProduct.name}
          </h4>
          <p className="text-xs text-warm-500 mt-0.5">
            Mã: <code className="text-warm-700 font-mono">{sampleProduct.sku}</code> • Chất liệu: {sampleProduct.material || 'Gỗ Sồi Tự Nhiên'}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-700 font-serif">
            {formatCurrency(effectivePrice)}
          </span>
          {sampleProduct.sale_price && sampleProduct.sale_price < sampleProduct.price && (
            <span className="text-sm text-warm-400 line-through">
              {formatCurrency(sampleProduct.price)}
            </span>
          )}
        </div>

        {/* Quantity Controller */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-warm-700">Chọn số lượng:</span>
          <div className="flex items-center rounded-lg border border-warm-200 bg-warm-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              className="p-2 hover:bg-warm-100 text-warm-700 transition"
              aria-label="Giảm"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-semibold text-sm text-warm-800">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((prev) => prev + 1)}
              className="p-2 hover:bg-warm-100 text-warm-700 transition"
              aria-label="Tăng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm transition shadow-sm hover:shadow"
        >
          <ShoppingBag className="w-4 h-4" />
          Thêm vào giỏ & Test Toast Sonner
        </button>

        <div className="pt-3 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Giỏ hàng hiện tại:
          </span>
          <span className="font-semibold text-warm-800">
            {cart.totalQuantity} món ({formatCurrency(cart.subtotal)})
          </span>
        </div>
      </div>
    </div>
  );
}
